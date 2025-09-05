// Fraud Detection Types
export type FraudRiskLevel = 'low' | 'medium' | 'high';

export interface FraudReason {
  code: string;
  message: string;
  weight?: number;
}

export interface FraudScore {
  sessionId: string;
  score: number;
  level: FraudRiskLevel;
  reasons: FraudReason[];
  at: string;
}

export interface TranscriptChunk {
  id?: string;
  sessionId: string;
  seq: number;
  text: string;
  startMs: number;
  endMs: number;
  speaker?: 'candidate' | 'interviewer';
}

export interface ScreenEvent {
  id?: string;
  sessionId: string;
  t: number;
  type: 'TAB_BLUR' | 'TAB_FOCUS' | 'PASTE' | 'URL_CHANGE' | 'COPY' | 'WINDOW_SWITCH';
  meta?: Record<string, any>;
}

export interface KeystrokeEvent {
  sessionId: string;
  t: number;
  key: string;
  action: 'down' | 'up';
}

export interface CompileRunEvent {
  id?: string;
  sessionId: string;
  t: number;
  action: 'compile' | 'run' | 'test';
  ok?: boolean;
}

// LLM Analysis Types
export interface InterviewAnalysis {
  suspiciousBehavior: boolean;
  confidence: number;
  suggestions: string[];
  riskFactors: string[];
  nextQuestions: string[];
}

export interface LLMTranscriptChunk {
  speaker: 'candidate' | 'interviewer';
  text: string;
  timestamp: number;
}

// Video Types
export interface VideoConfig {
  sessionId: string;
  userId: string;
  role: 'candidate' | 'interviewer';
}

export interface VideoStream {
  stream: MediaStream;
  userId: string;
  role: 'candidate' | 'interviewer';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionData {
  id: string;
  candidateId: string;
  companyId: string;
  role?: string;
  status: 'created' | 'live' | 'ended' | 'canceled';
  startedAt?: string;
  endedAt?: string;
  consent: {
    audio: boolean;
    video: boolean;
    screen: boolean;
    telemetry: boolean;
  };
}

// WebSocket Event Types
export interface WebSocketEvents {
  'join-session': (sessionId: string) => void;
  'leave-session': (sessionId: string) => void;
  'fraud-score-update': (data: FraudScore) => void;
  'llm-analysis-update': (data: InterviewAnalysis & { sessionId: string }) => void;
  'video-signaling': (data: any) => void;
  'fraud-score-updated': (data: FraudScore) => void;
  'llm-analysis-updated': (data: InterviewAnalysis & { sessionId: string }) => void;
}
