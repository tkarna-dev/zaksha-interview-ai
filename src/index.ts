import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import fraudRoutes from './routes/fraud';
import llmRoutes from './routes/llm';
import videoRoutes from './routes/video';

// Import services
import { FraudDetectionService } from './services/fraudDetection';
import { LLMService } from './services/llm';
import { VideoService } from './services/video';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'zaksha-interview-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/v1/fraud', fraudRoutes);
app.use('/api/v1/llm', llmRoutes);
app.use('/api/v1/video', videoRoutes);

// Initialize services
const fraudService = new FraudDetectionService();
const llmService = new LLMService();
const videoService = new VideoService();

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join interview session room
  socket.on('join-session', (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} joined session: ${sessionId}`);
  });

  // Leave interview session room
  socket.on('leave-session', (sessionId: string) => {
    socket.leave(sessionId);
    console.log(`Client ${socket.id} left session: ${sessionId}`);
  });

  // Handle fraud score updates
  socket.on('fraud-score-update', (data: any) => {
    socket.to(data.sessionId).emit('fraud-score-updated', data);
  });

  // Handle LLM analysis updates
  socket.on('llm-analysis-update', (data: any) => {
    socket.to(data.sessionId).emit('llm-analysis-updated', data);
  });

  // Handle video signaling
  socket.on('video-signaling', (data: any) => {
    socket.to(data.targetUserId).emit('video-signaling', data);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Zaksha Interview AI Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
  console.log(`🤖 LLM Analysis: ${process.env.ENABLE_LLM_ANALYSIS === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🎥 Video Calls: ${process.env.ENABLE_VIDEO_CALLS === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🛡️ Fraud Detection: ${process.env.ENABLE_FRAUD_DETECTION === 'true' ? 'Enabled' : 'Disabled'}`);
});

export { io };
