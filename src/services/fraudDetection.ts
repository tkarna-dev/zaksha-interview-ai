import { v4 as uuidv4 } from 'uuid';
import { 
  FraudScore, 
  FraudRiskLevel, 
  TranscriptChunk, 
  ScreenEvent, 
  CompileRunEvent,
  SessionData 
} from '../types';

export class FraudDetectionService {
  private sessions: Map<string, SessionData> = new Map();
  private fraudSignals: Map<string, FraudScore[]> = new Map();
  private transcriptChunks: Map<string, TranscriptChunk[]> = new Map();
  private screenEvents: Map<string, ScreenEvent[]> = new Map();
  private compileEvents: Map<string, CompileRunEvent[]> = new Map();

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
    const sessionId = `session_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
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
      id: uuidv4(),
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
      id: uuidv4(),
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
      id: uuidv4(),
    });
    this.compileEvents.set(data.sessionId, events);

    // Trigger fraud analysis
    await this.analyzeFraud(data.sessionId);

    return { success: true };
  }

  // Fraud Analysis
  private async analyzeFraud(sessionId: string): Promise<void> {
    const chunks = this.transcriptChunks.get(sessionId) || [];
    const screenEvents = this.screenEvents.get(sessionId) || [];
    const compileEvents = this.compileEvents.get(sessionId) || [];

    // Calculate fraud score
    const score = this.calculateFraudScore(chunks, screenEvents, compileEvents);
    
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
    // Heuristic-based scoring
    const pasteBursts = screenEvents.filter(e => e.type === 'PASTE').length;
    const tabSwitches = screenEvents.filter(e => 
      e.type === 'WINDOW_SWITCH' || e.type === 'TAB_BLUR'
    ).length;
    const compileCount = compileEvents.length;

    const totalChars = chunks.reduce((a, c) => a + c.text.length, 0);
    const avgChunkLen = chunks.length ? totalChars / chunks.length : 0;

    // Scoring algorithm
    let raw = 0;
    raw += Math.min(pasteBursts * 10, 30);
    raw += Math.min(tabSwitches * 5, 20);
    if (compileCount <= 1) raw += 20;
    if (avgChunkLen > 200) raw += 15;

    const clamped = Math.max(0, Math.min(100, raw));
    const level: FraudRiskLevel = clamped >= 70 ? 'high' : 
                                  clamped >= 40 ? 'medium' : 'low';

    const reasons = [];
    if (pasteBursts >= 2) reasons.push({ 
      code: 'PASTE_BURST', 
      message: 'Multiple large paste actions' 
    });
    if (compileCount <= 1) reasons.push({ 
      code: 'LOW_COMPILE', 
      message: 'Low compile/run activity' 
    });
    if (tabSwitches >= 3) reasons.push({ 
      code: 'TAB_SWITCHING', 
      message: 'Frequent tab/window switching' 
    });
    if (avgChunkLen > 200) reasons.push({ 
      code: 'LONG_TRANSCRIPTS', 
      message: 'Long uninterrupted transcript chunks' 
    });

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
  }
}
