import { 
  KeystrokeEvent, 
  KeystrokeDigraph, 
  KeystrokeTrigraph, 
  TypingProfile 
} from '../types';

export class KeystrokeAnalyzer {
  private keystrokeEvents: Map<string, KeystrokeEvent[]> = new Map();
  private digraphs: Map<string, KeystrokeDigraph[]> = new Map();
  private trigraphs: Map<string, KeystrokeTrigraph[]> = new Map();
  private typingProfiles: Map<string, TypingProfile> = new Map();

  // Record keystroke event
  recordKeystroke(sessionId: string, event: KeystrokeEvent): void {
    const events = this.keystrokeEvents.get(sessionId) || [];
    events.push(event);
    this.keystrokeEvents.set(sessionId, events);

    // Analyze for digraphs and trigraphs
    this.analyzeDigraphs(sessionId, events);
    this.analyzeTrigraphs(sessionId, events);
  }

  // Analyze digraph latencies (time between key releases and next key press)
  private analyzeDigraphs(sessionId: string, events: KeystrokeEvent[]): void {
    if (events.length < 2) return;

    const digraphs = this.digraphs.get(sessionId) || [];
    
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      // Look for key release followed by key press
      if (current.action === 'up' && next.action === 'down') {
        const latency = next.t - current.t;
        
        // Only record reasonable latencies (10ms to 2000ms)
        if (latency >= 10 && latency <= 2000) {
          digraphs.push({
            sessionId,
            key1: current.key,
            key2: next.key,
            latency,
            timestamp: next.t
          });
        }
      }
    }

    this.digraphs.set(sessionId, digraphs);
  }

  // Analyze trigraph latencies (three consecutive keys)
  private analyzeTrigraphs(sessionId: string, events: KeystrokeEvent[]): void {
    if (events.length < 3) return;

    const trigraphs = this.trigraphs.get(sessionId) || [];
    
    for (let i = 0; i < events.length - 2; i++) {
      const first = events[i];
      const second = events[i + 1];
      const third = events[i + 2];

      // Look for key release -> key press -> key release -> key press pattern
      if (first.action === 'up' && second.action === 'down' && 
          second.action === 'up' && third.action === 'down') {
        const latency1 = second.t - first.t;
        const latency2 = third.t - second.t;
        
        // Only record reasonable latencies
        if (latency1 >= 10 && latency1 <= 2000 && latency2 >= 10 && latency2 <= 2000) {
          trigraphs.push({
            sessionId,
            key1: first.key,
            key2: second.key,
            key3: third.key,
            latency1,
            latency2,
            timestamp: third.t
          });
        }
      }
    }

    this.trigraphs.set(sessionId, trigraphs);
  }

  // Generate typing profile for a session
  generateTypingProfile(sessionId: string): TypingProfile {
    const events = this.keystrokeEvents.get(sessionId) || [];
    const digraphs = this.digraphs.get(sessionId) || [];
    const trigraphs = this.trigraphs.get(sessionId) || [];

    if (events.length === 0) {
      return this.createEmptyProfile(sessionId);
    }

    // Calculate typing speed (characters per minute)
    const sessionDuration = this.getSessionDuration(events);
    const characterCount = events.filter(e => e.action === 'down' && e.key.length === 1).length;
    const averageSpeed = sessionDuration > 0 ? (characterCount / sessionDuration) * 60000 : 0;

    // Calculate digraph latencies
    const digraphLatencies = new Map<string, number>();
    const digraphGroups = this.groupDigraphsByKeyPair(digraphs);
    
    for (const [keyPair, latencies] of digraphGroups.entries()) {
      const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      digraphLatencies.set(keyPair, average);
    }

    // Calculate trigraph latencies
    const trigraphLatencies = new Map<string, number>();
    const trigraphGroups = this.groupTrigraphsByKeyTriple(trigraphs);
    
    for (const [keyTriple, latencies] of trigraphGroups.entries()) {
      const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      trigraphLatencies.set(keyTriple, average);
    }

    // Calculate key hold durations
    const keyHoldDurations = this.calculateKeyHoldDurations(events);

    // Calculate pause distribution
    const pauseDistribution = this.calculatePauseDistribution(events);

    // Calculate variance of inter-keystroke intervals
    const variance = this.calculateInterKeystrokeVariance(events);

    const profile: TypingProfile = {
      sessionId,
      averageSpeed,
      digraphLatencies,
      trigraphLatencies,
      keyHoldDurations,
      pauseDistribution,
      variance
    };

    this.typingProfiles.set(sessionId, profile);
    return profile;
  }

  // Detect typing anomalies based on research paper insights
  detectTypingAnomalies(sessionId: string): {
    isSuspicious: boolean;
    anomalies: string[];
    confidence: number;
  } {
    const profile = this.typingProfiles.get(sessionId);
    if (!profile) {
      return { isSuspicious: false, anomalies: [], confidence: 0 };
    }

    const anomalies: string[] = [];
    let confidence = 0;

    // Check for unusually uniform timing (AI-assisted typing)
    if (profile.variance < 50) { // Very low variance indicates robotic typing
      anomalies.push('Unusually uniform keystroke timing detected');
      confidence += 0.3;
    }

    // Check for typing speed anomalies
    if (profile.averageSpeed > 200) { // Extremely fast typing
      anomalies.push('Unusually fast typing speed detected');
      confidence += 0.2;
    } else if (profile.averageSpeed < 20) { // Extremely slow typing
      anomalies.push('Unusually slow typing speed detected');
      confidence += 0.1;
    }

    // Check for pause pattern anomalies
    const longPauses = profile.pauseDistribution.filter(pause => pause > 5000).length;
    const totalPauses = profile.pauseDistribution.length;
    
    if (totalPauses > 0 && (longPauses / totalPauses) > 0.3) {
      anomalies.push('Frequent long pauses detected (possible copy-paste)');
      confidence += 0.2;
    }

    // Check for digraph pattern anomalies
    const digraphVariance = this.calculateDigraphVariance(profile.digraphLatencies);
    if (digraphVariance < 100) { // Very consistent digraph timing
      anomalies.push('Unusually consistent digraph timing detected');
      confidence += 0.2;
    }

    return {
      isSuspicious: confidence > 0.3,
      anomalies,
      confidence: Math.min(confidence, 1.0)
    };
  }

  // Helper methods
  private createEmptyProfile(sessionId: string): TypingProfile {
    return {
      sessionId,
      averageSpeed: 0,
      digraphLatencies: new Map(),
      trigraphLatencies: new Map(),
      keyHoldDurations: new Map(),
      pauseDistribution: [],
      variance: 0
    };
  }

  private getSessionDuration(events: KeystrokeEvent[]): number {
    if (events.length < 2) return 0;
    const sorted = events.sort((a, b) => a.t - b.t);
    return sorted[sorted.length - 1].t - sorted[0].t;
  }

  private groupDigraphsByKeyPair(digraphs: KeystrokeDigraph[]): Map<string, number[]> {
    const groups = new Map<string, number[]>();
    
    for (const digraph of digraphs) {
      const keyPair = `${digraph.key1}-${digraph.key2}`;
      if (!groups.has(keyPair)) {
        groups.set(keyPair, []);
      }
      groups.get(keyPair)!.push(digraph.latency);
    }
    
    return groups;
  }

  private groupTrigraphsByKeyTriple(trigraphs: KeystrokeTrigraph[]): Map<string, number[]> {
    const groups = new Map<string, number[]>();
    
    for (const trigraph of trigraphs) {
      const keyTriple = `${trigraph.key1}-${trigraph.key2}-${trigraph.key3}`;
      if (!groups.has(keyTriple)) {
        groups.set(keyTriple, []);
      }
      groups.get(keyTriple)!.push((trigraph.latency1 + trigraph.latency2) / 2);
    }
    
    return groups;
  }

  private calculateKeyHoldDurations(events: KeystrokeEvent[]): Map<string, number> {
    const holdDurations = new Map<string, number[]>();
    
    for (let i = 0; i < events.length - 1; i++) {
      const press = events[i];
      const release = events[i + 1];
      
      if (press.action === 'down' && release.action === 'up' && press.key === release.key) {
        const duration = release.t - press.t;
        if (duration > 0 && duration < 2000) { // Reasonable hold duration
          if (!holdDurations.has(press.key)) {
            holdDurations.set(press.key, []);
          }
          holdDurations.get(press.key)!.push(duration);
        }
      }
    }
    
    const averages = new Map<string, number>();
    for (const [key, durations] of holdDurations.entries()) {
      const average = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
      averages.set(key, average);
    }
    
    return averages;
  }

  private calculatePauseDistribution(events: KeystrokeEvent[]): number[] {
    const pauses: number[] = [];
    const keyPresses = events.filter(e => e.action === 'down').sort((a, b) => a.t - b.t);
    
    for (let i = 1; i < keyPresses.length; i++) {
      const pause = keyPresses[i].t - keyPresses[i - 1].t;
      if (pause > 100) { // Only count pauses longer than 100ms
        pauses.push(pause);
      }
    }
    
    return pauses;
  }

  private calculateInterKeystrokeVariance(events: KeystrokeEvent[]): number {
    const keyPresses = events.filter(e => e.action === 'down').sort((a, b) => a.t - b.t);
    
    if (keyPresses.length < 2) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < keyPresses.length; i++) {
      intervals.push(keyPresses[i].t - keyPresses[i - 1].t);
    }
    
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    
    return variance;
  }

  private calculateDigraphVariance(digraphLatencies: Map<string, number>): number {
    const latencies = Array.from(digraphLatencies.values());
    if (latencies.length < 2) return 0;
    
    const mean = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - mean, 2), 0) / latencies.length;
    
    return variance;
  }

  // Get typing profile for a session
  getTypingProfile(sessionId: string): TypingProfile | undefined {
    return this.typingProfiles.get(sessionId);
  }

  // Clear session data
  clearSession(sessionId: string): void {
    this.keystrokeEvents.delete(sessionId);
    this.digraphs.delete(sessionId);
    this.trigraphs.delete(sessionId);
    this.typingProfiles.delete(sessionId);
  }
}
