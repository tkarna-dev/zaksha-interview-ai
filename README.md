# 🚀 Zaksha Interview AI Microservice

A powerful microservice for AI-powered interview fraud detection, real-time analysis, and video interview capabilities.

## 🏗️ Architecture

This microservice provides:
- **Fraud Detection**: Real-time monitoring of suspicious behavior
- **LLM Analysis**: AI-powered interview analysis and suggestions
- **Video Platform**: WebRTC-based video interviews
- **Real-time Communication**: WebSocket support for live updates

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your API keys
```

### 3. Development
```bash
npm run dev
```

### 4. Production
```bash
npm run build
npm start
```

## 🔧 Configuration

### Required Environment Variables
```bash
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# OpenAI (Required for LLM features)
OPENAI_API_KEY=sk-your-openai-api-key-here
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=1000

# Feature Flags
ENABLE_LLM_ANALYSIS=true
ENABLE_VIDEO_CALLS=true
ENABLE_FRAUD_DETECTION=true
```

## 📡 API Endpoints

### Fraud Detection
- `POST /api/v1/fraud/start` - Start interview session
- `POST /api/v1/fraud/end/:sessionId` - End interview session
- `POST /api/v1/fraud/transcript` - Submit transcript chunks
- `POST /api/v1/fraud/screen` - Submit screen events
- `POST /api/v1/fraud/compile` - Submit compile/run events
- `GET /api/v1/fraud/score/:sessionId` - Get fraud score
- `GET /api/v1/fraud/report/:sessionId` - Get detailed report

### LLM Analysis
- `POST /api/v1/llm/analyze` - Analyze interview conversation
- `POST /api/v1/llm/questions` - Generate follow-up questions
- `GET /api/v1/llm/history/:sessionId` - Get conversation history
- `DELETE /api/v1/llm/history/:sessionId` - Clear conversation history
- `GET /api/v1/llm/health` - LLM service health check

### Video Platform
- `GET /api/v1/video/config` - Get video configuration
- `POST /api/v1/video/offer` - Create peer connection offer
- `POST /api/v1/video/answer` - Create peer connection answer
- `POST /api/v1/video/ice-candidate` - Handle ICE candidate
- `POST /api/v1/video/end-call` - End video call
- `POST /api/v1/video/toggle-video` - Toggle video
- `POST /api/v1/video/toggle-audio` - Toggle audio
- `GET /api/v1/video/stats/:userId` - Get connection statistics
- `GET /api/v1/video/health` - Video service health check

### Health Check
- `GET /health` - Service health status

## 🔌 WebSocket Events

### Client → Server
- `join-session` - Join interview session room
- `leave-session` - Leave interview session room
- `fraud-score-update` - Send fraud score update
- `llm-analysis-update` - Send LLM analysis update
- `video-signaling` - Video signaling data

### Server → Client
- `fraud-score-updated` - Receive fraud score update
- `llm-analysis-updated` - Receive LLM analysis update
- `video-signaling` - Receive video signaling data

## 🧪 Testing

### Start the Service
```bash
npm run dev
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Start interview
curl -X POST http://localhost:3001/api/v1/fraud/start \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"test123","companyId":"company456","consent":{"audio":true,"video":true,"screen":true,"telemetry":true}}'

# Get fraud score
curl http://localhost:3001/api/v1/fraud/score/session_123
```

## 🔗 Integration with Main App

### Frontend Integration
```javascript
// Connect to the microservice
const API_BASE = 'http://localhost:3001/api/v1';

// Start interview
const response = await fetch(`${API_BASE}/fraud/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candidateId: 'candidate123',
    companyId: 'company456',
    consent: { audio: true, video: true, screen: true, telemetry: true }
  })
});

// WebSocket connection
import io from 'socket.io-client';
const socket = io('http://localhost:3001');
socket.emit('join-session', sessionId);
```

### Environment Variables for Main App
```bash
# Add to your main app's .env
INTERVIEW_AI_SERVICE_URL=http://localhost:3001
INTERVIEW_AI_WS_URL=http://localhost:3001
```

## 🏗️ Microservices Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main App      │    │  API Gateway     │    │ Interview AI    │
│  (Frontend)     │◄──►│  (Optional)      │◄──►│  Microservice   │
│                 │    │                  │    │                 │
│ - UI Components │    │ - Load Balancing │    │ - Fraud Detection│
│ - User Auth     │    │ - Rate Limiting  │    │ - LLM Analysis  │
│ - Core Features │    │ - Request Routing│    │ - Video Platform│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
OPENAI_API_KEY=your-production-api-key
```

## 📊 Monitoring

### Health Checks
- Service health: `GET /health`
- LLM health: `GET /api/v1/llm/health`
- Video health: `GET /api/v1/video/health`

### Metrics
- Active sessions
- Fraud detection accuracy
- LLM response times
- Video connection quality

## 🔒 Security

- CORS protection
- Helmet.js security headers
- Input validation
- Rate limiting (recommended)
- API key protection

## 🛠️ Development

### Project Structure
```
src/
├── index.ts              # Main server file
├── types/                # TypeScript type definitions
├── services/             # Business logic services
│   ├── fraudDetection.ts
│   ├── llm.ts
│   └── video.ts
└── routes/               # API route handlers
    ├── fraud.ts
    ├── llm.ts
    └── video.ts
```

### Adding New Features
1. Add types to `src/types/index.ts`
2. Implement service logic in `src/services/`
3. Create API routes in `src/routes/`
4. Update main server in `src/index.ts`

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🆘 Support

For issues and questions:
- Check the health endpoints
- Review the logs
- Verify environment variables
- Test with curl commands

---

**Built with ❤️ by the Zaksha Team**
