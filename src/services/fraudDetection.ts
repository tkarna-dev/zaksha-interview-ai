import { randomUUID } from 'crypto';
import { 
  FraudScore, 
  FraudRiskLevel, 
  FraudReason,
  TranscriptChunk, 
  ScreenEvent, 
  CompileRunEvent,
  SessionData,
  KeystrokeEvent,
  CodeStylometryFeatures
} from '../types';
import { KeystrokeAnalyzer } from './keystrokeAnalyzer';
import { CodeStylometryAnalyzer } from './codeStylometryAnalyzer';

export class FraudDetectionService {
  private sessions: Map<string, SessionData> = new Map();
  private fraudSignals: Map<string, FraudScore[]> = new Map();
  private transcriptChunks: Map<string, TranscriptChunk[]> = new Map();
  private screenEvents: Map<string, ScreenEvent[]> = new Map();
  private compileEvents: Map<string, CompileRunEvent[]> = new Map();
  private keystrokeEvents: Map<string, KeystrokeEvent[]> = new Map();
  private codeSamples: Map<string, string> = new Map();
  
  // Advanced analyzers
  private keystrokeAnalyzer: KeystrokeAnalyzer;
  private codeStylometryAnalyzer: CodeStylometryAnalyzer;

  constructor() {
    this.keystrokeAnalyzer = new KeystrokeAnalyzer();
    this.codeStylometryAnalyzer = new CodeStylometryAnalyzer();
  }

  // Session Management
  async startInterview(data: {
    candidateId: string;
    companyId: string;
    role?: string;
    consent: {
      audio: boolean;
      video: boolean;
      screen: boolean;
      telemetry: boolean;
    };
  }): Promise<{ sessionId: string }> {
    const sessionId = `session_${Date.now()}_${randomUUID().substring(0, 8)}`;
    
    const session: SessionData = {
      id: sessionId,
      candidateId: data.candidateId,
      companyId: data.companyId,
      role: data.role,
      status: 'live',
      startedAt: new Date().toISOString(),
      consent: data.consent,
    };

    this.sessions.set(sessionId, session);
    this.fraudSignals.set(sessionId, []);
    this.transcriptChunks.set(sessionId, []);
    this.screenEvents.set(sessionId, []);
    this.compileEvents.set(sessionId, []);

    return { sessionId };
  }

  async endInterview(sessionId: string): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);

    return { success: true };
  }

  // Data Ingestion
  async ingestTranscript(data: TranscriptChunk): Promise<{ success: boolean }> {
    const chunks = this.transcriptChunks.get(data.sessionId) || [];
    chunks.push({
      ...data,
      id: randomUUID(),
    });
    this.transcriptChunks.set(data.sessionId, chunks);

    // Trigger fraud analysis
    await this.analyzeFraud(data.sessionId);

    return { success: true };
  }

  async ingestScreenEvent(data: ScreenEvent): Promise<{ success: boolean }> {
    const events = this.screenEvents.get(data.sessionId) || [];
    events.push({
      ...data,
      id: randomUUID(),
    });
    this.screenEvents.set(data.sessionId, events);

    // Trigger fraud analysis
    await this.analyzeFraud(data.sessionId);

    return { success: true };
  }

  async ingestCompileEvent(data: CompileRunEvent): Promise<{ success: boolean }> {
    const events = this.compileEvents.get(data.sessionId) || [];
    events.push({
      ...data,
      id: randomUUID(),
    });
    this.compileEvents.set(data.sessionId, events);

    // Trigger fraud analysis
    await this.analyzeFraud(data.sessionId);

    return { success: true };
  }

  // Advanced keystroke analysis
  async ingestKeystrokeEvent(data: KeystrokeEvent): Promise<{ success: boolean }> {
    const events = this.keystrokeEvents.get(data.sessionId) || [];
    events.push(data);
    this.keystrokeEvents.set(data.sessionId, events);

    // Record in keystroke analyzer
    this.keystrokeAnalyzer.recordKeystroke(data.sessionId, data);

    // Trigger fraud analysis
    await this.analyzeFraud(data.sessionId);

    return { success: true };
  }

  // Code analysis
  async analyzeCode(sessionId: string, code: string, language: string = 'javascript'): Promise<{ success: boolean }> {
    this.codeSamples.set(sessionId, code);
    
    // Trigger fraud analysis
    await this.analyzeFraud(sessionId);

    return { success: true };
  }

  // Fraud Analysis
  private async analyzeFraud(sessionId: string): Promise<void> {
    const chunks = this.transcriptChunks.get(sessionId) || [];
    const screenEvents = this.screenEvents.get(sessionId) || [];
    const compileEvents = this.compileEvents.get(sessionId) || [];
    const keystrokeEvents = this.keystrokeEvents.get(sessionId) || [];
    const codeSample = this.codeSamples.get(sessionId) || '';

    // Calculate enhanced fraud score with cross-modal fusion
    const score = this.calculateEnhancedFraudScore(
      chunks, 
      screenEvents, 
      compileEvents, 
      keystrokeEvents, 
      codeSample
    );
    
    // Store fraud signal
    const signals = this.fraudSignals.get(sessionId) || [];
    signals.push(score);
    this.fraudSignals.set(sessionId, signals);
  }

  private calculateFraudScore(
    chunks: TranscriptChunk[],
    screenEvents: ScreenEvent[],
    compileEvents: CompileRunEvent[]
  ): FraudScore {
    // Enhanced heuristic-based scoring with multiple detection patterns
    const analysis = this.analyzeBehavioralPatterns(chunks, screenEvents, compileEvents);
    
    // Weighted scoring system
    let rawScore = 0;
    const reasons: FraudReason[] = [];

    // 1. Copy-Paste Analysis (Weight: 25%)
    if (analysis.pasteBursts >= 2) {
      rawScore += Math.min(analysis.pasteBursts * 8, 25);
      reasons.push({ 
        code: 'PASTE_BURST', 
        message: `Multiple large paste actions (${analysis.pasteBursts} detected)`,
        weight: Math.min(analysis.pasteBursts * 8, 25)
      });
    }

    // 2. Tab Switching Analysis (Weight: 20%)
    if (analysis.tabSwitches >= 3) {
      rawScore += Math.min(analysis.tabSwitches * 4, 20);
      reasons.push({ 
        code: 'TAB_SWITCHING', 
        message: `Frequent tab/window switching (${analysis.tabSwitches} switches)`,
        weight: Math.min(analysis.tabSwitches * 4, 20)
      });
    }

    // 3. Compile Activity Analysis (Weight: 20%)
    if (analysis.compileCount <= 1 && analysis.sessionDuration > 300000) { // 5 minutes
      rawScore += 20;
      reasons.push({ 
        code: 'LOW_COMPILE', 
        message: 'Low compile/run activity for extended session',
        weight: 20
      });
    }

    // 4. Transcript Pattern Analysis (Weight: 15%)
    if (analysis.avgChunkLen > 200) {
      rawScore += 15;
      reasons.push({ 
        code: 'LONG_TRANSCRIPTS', 
        message: 'Long uninterrupted transcript chunks',
        weight: 15
      });
    }

    // 5. Timing Pattern Analysis (Weight: 10%)
    if (analysis.suspiciousTiming) {
      rawScore += 10;
      reasons.push({ 
        code: 'SUSPICIOUS_TIMING', 
        message: 'Unusual timing patterns detected',
        weight: 10
      });
    }

    // 6. Keystroke Analysis (Weight: 10%)
    if (analysis.keystrokeAnomalies) {
      rawScore += 10;
      reasons.push({ 
        code: 'KEYSTROKE_ANOMALIES', 
        message: 'Unusual keystroke patterns detected',
        weight: 10
      });
    }

    // 7. Mouse Activity Analysis (Weight: 5%)
    if (analysis.mouseAnomalies) {
      rawScore += 5;
      reasons.push({ 
        code: 'MOUSE_ANOMALIES', 
        message: 'Unusual mouse activity patterns detected',
        weight: 5
      });
    }

    // 8. Application Switching Analysis (Weight: 5%)
    if (analysis.applicationSwitching) {
      rawScore += 5;
      reasons.push({ 
        code: 'APPLICATION_SWITCHING', 
        message: 'Frequent application switching detected',
        weight: 5
      });
    }

    const clamped = Math.max(0, Math.min(100, rawScore));
    const level: FraudRiskLevel = clamped >= 70 ? 'high' : 
                                  clamped >= 40 ? 'medium' : 'low';

    return {
      sessionId: chunks[0]?.sessionId || 'unknown',
      score: clamped,
      level,
      reasons,
      at: new Date().toISOString(),
    };
  }

  private analyzeBehavioralPatterns(
    chunks: TranscriptChunk[],
    screenEvents: ScreenEvent[],
    compileEvents: CompileRunEvent[]
  ) {
    // Basic counts
    const pasteBursts = screenEvents.filter(e => e.type === 'PASTE').length;
    const tabSwitches = screenEvents.filter(e => 
      e.type === 'WINDOW_SWITCH' || e.type === 'TAB_BLUR'
    ).length;
    const compileCount = compileEvents.length;

    // Transcript analysis
    const totalChars = chunks.reduce((a, c) => a + c.text.length, 0);
    const avgChunkLen = chunks.length ? totalChars / chunks.length : 0;

    // Session duration analysis
    const sessionStart = Math.min(
      ...chunks.map(c => c.startMs),
      ...screenEvents.map(e => e.t),
      ...compileEvents.map(e => e.t)
    );
    const sessionEnd = Math.max(
      ...chunks.map(c => c.endMs),
      ...screenEvents.map(e => e.t),
      ...compileEvents.map(e => e.t)
    );
    const sessionDuration = sessionEnd - sessionStart;

    // Timing pattern analysis
    const suspiciousTiming = this.detectSuspiciousTiming(chunks, screenEvents);

    // Keystroke analysis
    const keystrokeAnomalies = this.detectKeystrokeAnomalies(screenEvents);

    // Mouse activity analysis
    const mouseAnomalies = this.detectMouseAnomalies(screenEvents);

    // Application switching analysis
    const applicationSwitching = this.detectApplicationSwitching(screenEvents);

    return {
      pasteBursts,
      tabSwitches,
      compileCount,
      avgChunkLen,
      sessionDuration,
      suspiciousTiming,
      keystrokeAnomalies,
      mouseAnomalies,
      applicationSwitching
    };
  }

  private detectSuspiciousTiming(chunks: TranscriptChunk[], screenEvents: ScreenEvent[]): boolean {
    // Detect if there are long gaps between transcript chunks
    if (chunks.length < 2) return false;

    const sortedChunks = chunks.sort((a, b) => a.startMs - b.startMs);
    const gaps = [];
    
    for (let i = 1; i < sortedChunks.length; i++) {
      const gap = sortedChunks[i].startMs - sortedChunks[i-1].endMs;
      gaps.push(gap);
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const longGaps = gaps.filter(gap => gap > avgGap * 3).length;

    // Suspicious if more than 30% of gaps are unusually long
    return longGaps / gaps.length > 0.3;
  }

  private detectKeystrokeAnomalies(screenEvents: ScreenEvent[]): boolean {
    // Detect keystroke batch events that might indicate copy-paste
    const keystrokeBatches = screenEvents.filter(e => e.type === 'KEYSTROKE_BATCH');
    
    if (keystrokeBatches.length === 0) return false;

    // Check for unusually large keystroke batches (might indicate paste)
    const largeBatches = keystrokeBatches.filter(e => 
      e.meta?.count && e.meta.count > 50
    );

    return largeBatches.length > 0;
  }

  private detectMouseAnomalies(screenEvents: ScreenEvent[]): boolean {
    // Detect mouse anomaly events
    const mouseAnomalies = screenEvents.filter(e => e.type === 'MOUSE_ANOMALY');
    
    if (mouseAnomalies.length === 0) return false;

    // Check for patterns that might indicate automated behavior
    const suspiciousPatterns = mouseAnomalies.filter(e => 
      e.meta?.pattern && ['linear_movement', 'perfect_clicking', 'no_human_delay'].includes(e.meta.pattern)
    );

    return suspiciousPatterns.length > 0;
  }

  private detectApplicationSwitching(screenEvents: ScreenEvent[]): boolean {
    // Detect frequent application switching
    const appSwitches = screenEvents.filter(e => e.type === 'APPLICATION_SWITCH');
    
    if (appSwitches.length < 5) return false;

    // Check for rapid application switching (more than 5 switches in 30 seconds)
    const recentSwitches = appSwitches.filter(e => {
      const now = Date.now();
      const eventTime = e.t;
      return (now - eventTime) < 30000; // 30 seconds
    });

    return recentSwitches.length >= 5;
  }

  // Enhanced fraud scoring with cross-modal fusion (based on research paper)
  private calculateEnhancedFraudScore(
    chunks: TranscriptChunk[],
    screenEvents: ScreenEvent[],
    compileEvents: CompileRunEvent[],
    keystrokeEvents: KeystrokeEvent[],
    codeSample: string
  ): FraudScore {
    // Generate typing profile and detect anomalies
    const typingProfile = this.keystrokeAnalyzer.generateTypingProfile(chunks[0]?.sessionId || 'unknown');
    const typingAnomalies = this.keystrokeAnalyzer.detectTypingAnomalies(chunks[0]?.sessionId || 'unknown');

    // Analyze code stylometry
    const codeFeatures = this.codeStylometryAnalyzer.analyzeCode(codeSample);
    const codeAnomalies = this.codeStylometryAnalyzer.detectCodeAnomalies(codeFeatures);

    // Get basic behavioral analysis
    const behavioralAnalysis = this.analyzeBehavioralPatterns(chunks, screenEvents, compileEvents);

    // Cross-modal fusion scoring
    let rawScore = 0;
    const reasons: FraudReason[] = [];

    // 1. Keystroke Dynamics Analysis (Weight: 30%)
    if (typingAnomalies.isSuspicious) {
      rawScore += typingAnomalies.confidence * 30;
      typingAnomalies.anomalies.forEach(anomaly => {
        reasons.push({
          code: 'KEYSTROKE_ANOMALY',
          message: anomaly,
          weight: typingAnomalies.confidence * 10
        });
      });
    }

    // 2. Code Stylometry Analysis (Weight: 25%)
    if (codeAnomalies.isSuspicious) {
      rawScore += codeAnomalies.confidence * 25;
      codeAnomalies.anomalies.forEach(anomaly => {
        reasons.push({
          code: 'CODE_STYLOMETRY_ANOMALY',
          message: anomaly,
          weight: codeAnomalies.confidence * 8
        });
      });
    }

    // 3. Process-Level Signals (Weight: 25%)
    if (behavioralAnalysis.pasteBursts >= 2) {
      rawScore += Math.min(behavioralAnalysis.pasteBursts * 6, 15);
      reasons.push({
        code: 'PASTE_BURST',
        message: `Multiple large paste actions (${behavioralAnalysis.pasteBursts} detected)`,
        weight: Math.min(behavioralAnalysis.pasteBursts * 6, 15)
      });
    }

    if (behavioralAnalysis.tabSwitches >= 3) {
      rawScore += Math.min(behavioralAnalysis.tabSwitches * 3, 10);
      reasons.push({
        code: 'TAB_SWITCHING',
        message: `Frequent tab/window switching (${behavioralAnalysis.tabSwitches} switches)`,
        weight: Math.min(behavioralAnalysis.tabSwitches * 3, 10)
      });
    }

    // 4. Compile Activity Analysis (Weight: 10%)
    if (behavioralAnalysis.compileCount <= 1 && behavioralAnalysis.sessionDuration > 300000) {
      rawScore += 10;
      reasons.push({
        code: 'LOW_COMPILE',
        message: 'Low compile/run activity for extended session',
        weight: 10
      });
    }

    // 5. Timing Pattern Analysis (Weight: 5%)
    if (behavioralAnalysis.suspiciousTiming) {
      rawScore += 5;
      reasons.push({
        code: 'SUSPICIOUS_TIMING',
        message: 'Unusual timing patterns detected',
        weight: 5
      });
    }

    // 6. Mouse Activity Analysis (Weight: 3%)
    if (behavioralAnalysis.mouseAnomalies) {
      rawScore += 3;
      reasons.push({
        code: 'MOUSE_ANOMALIES',
        message: 'Unusual mouse activity patterns detected',
        weight: 3
      });
    }

    // 7. Application Switching Analysis (Weight: 2%)
    if (behavioralAnalysis.applicationSwitching) {
      rawScore += 2;
      reasons.push({
        code: 'APPLICATION_SWITCHING',
        message: 'Frequent application switching detected',
        weight: 2
      });
    }

    const clamped = Math.max(0, Math.min(100, rawScore));
    const level: FraudRiskLevel = clamped >= 70 ? 'high' : 
                                  clamped >= 40 ? 'medium' : 'low';

    return {
      sessionId: chunks[0]?.sessionId || 'unknown',
      score: clamped,
      level,
      reasons,
      at: new Date().toISOString(),
    };
  }

  // Data Retrieval
  async getLatestScore(sessionId: string): Promise<FraudScore> {
    const signals = this.fraudSignals.get(sessionId) || [];
    const latest = signals[signals.length - 1];
    
    if (!latest) {
      return {
        sessionId,
        score: 0,
        level: 'low',
        reasons: [],
        at: new Date().toISOString(),
      };
    }

    return latest;
  }

  async getReport(sessionId: string): Promise<{
    session: SessionData | undefined;
    scores: FraudScore[];
    chunks: TranscriptChunk[];
    events: ScreenEvent[];
    compiles: CompileRunEvent[];
  }> {
    return {
      session: this.sessions.get(sessionId),
      scores: this.fraudSignals.get(sessionId) || [],
      chunks: this.transcriptChunks.get(sessionId) || [],
      events: this.screenEvents.get(sessionId) || [],
      compiles: this.compileEvents.get(sessionId) || [],
    };
  }

  async getSession(sessionId: string): Promise<SessionData | undefined> {
    return this.sessions.get(sessionId);
  }

  // Utility methods
  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.fraudSignals.delete(sessionId);
    this.transcriptChunks.delete(sessionId);
    this.screenEvents.delete(sessionId);
    this.compileEvents.delete(sessionId);
    this.keystrokeEvents.delete(sessionId);
    this.codeSamples.delete(sessionId);
    this.keystrokeAnalyzer.clearSession(sessionId);
  }

  // Analytics and Trends
  async getFraudAnalytics(): Promise<{
    totalSessions: number;
    highRiskSessions: number;
    mediumRiskSessions: number;
    lowRiskSessions: number;
    averageScore: number;
    topRiskFactors: Array<{ code: string; count: number; percentage: number }>;
    trends: Array<{ date: string; averageScore: number; sessionCount: number }>;
  }> {
    const allSessions = Array.from(this.sessions.values());
    const allScores = Array.from(this.fraudSignals.values()).flat();

    const totalSessions = allSessions.length;
    const highRiskSessions = allScores.filter(s => s.level === 'high').length;
    const mediumRiskSessions = allScores.filter(s => s.level === 'medium').length;
    const lowRiskSessions = allScores.filter(s => s.level === 'low').length;
    
    const averageScore = allScores.length > 0 
      ? allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length 
      : 0;

    // Calculate top risk factors
    const riskFactorCounts = new Map<string, number>();
    allScores.forEach(score => {
      score.reasons.forEach(reason => {
        const count = riskFactorCounts.get(reason.code) || 0;
        riskFactorCounts.set(reason.code, count + 1);
      });
    });

    const topRiskFactors = Array.from(riskFactorCounts.entries())
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / allScores.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trends (last 7 days)
    const trends = this.calculateTrends(allScores);

    return {
      totalSessions,
      highRiskSessions,
      mediumRiskSessions,
      lowRiskSessions,
      averageScore: Math.round(averageScore * 100) / 100,
      topRiskFactors,
      trends
    };
  }

  private calculateTrends(scores: FraudScore[]): Array<{ date: string; averageScore: number; sessionCount: number }> {
    const trends = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayScores = scores.filter(s => {
        const scoreDate = new Date(s.at).toISOString().split('T')[0];
        return scoreDate === dateStr;
      });
      
      const averageScore = dayScores.length > 0 
        ? dayScores.reduce((sum, s) => sum + s.score, 0) / dayScores.length 
        : 0;
      
      trends.push({
        date: dateStr,
        averageScore: Math.round(averageScore * 100) / 100,
        sessionCount: dayScores.length
      });
    }
    
    return trends;
  }
}
