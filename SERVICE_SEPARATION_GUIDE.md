# 🔄 Zaksha Service Separation Guide

## 📋 **Current Status**

We have successfully created a microservices architecture with two separate repositories:

### **1. Main App Repository** (`zaksha-web-mvp`)
- **Location**: `/Users/tarunsnehithkishorereddykarna/Downloads/zaksha-web-mvp`
- **Type**: Next.js Frontend Application
- **Purpose**: UI components, user interface, core features
- **Port**: 3000 (or 3002 if 3000 is busy)

### **2. Interview AI Microservice** (`zaksha-interview-ai`)
- **Location**: `/Users/tarunsnehithkishorereddykarna/Downloads/zaksha-interview-ai`
- **Type**: Express.js + TypeScript Microservice
- **Purpose**: Fraud detection, LLM analysis, video platform
- **Port**: 3001 (or 3003 to avoid conflicts)

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    ZAKSHA PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐ │
│  │   Main App      │◄────────────────────►│ Interview AI    │ │
│  │  (Frontend)     │                      │  Microservice   │ │
│  │                 │                      │                 │ │
│  │ - UI Components │                      │ - Fraud Detection│ │
│  │ - User Auth     │                      │ - LLM Analysis  │ │
│  │ - Core Features │                      │ - Video Platform│ │
│  │ - Port 3000     │                      │ - Port 3001     │ │
│  └─────────────────┘                      └─────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **How to Run Both Services**

### **Step 1: Start the Microservice**
```bash
# Navigate to microservice directory
cd /Users/tarunsnehithkishorereddykarna/Downloads/zaksha-interview-ai

# Install dependencies (if not already done)
npm install

# Set up environment
./setup-env.sh

# Start the microservice
npm run dev
# This will run on http://localhost:3001
```

### **Step 2: Start the Main App**
```bash
# Navigate to main app directory
cd /Users/tarunsnehithkishorereddykarna/Downloads/zaksha-web-mvp

# Set up microservice integration
./setup-microservice-integration.sh

# Start the main app
npm run dev
# This will run on http://localhost:3000
```

## 🔧 **Service Features**

### **Main App (zaksha-web-mvp)**
- ✅ Next.js frontend application
- ✅ UI components and pages
- ✅ User authentication
- ✅ Dashboard and core features
- ✅ API proxy to microservice
- ✅ Environment configuration

### **Interview AI Microservice (zaksha-interview-ai)**
- ✅ Express.js + TypeScript backend
- ✅ Fraud detection algorithms
- ✅ LLM integration (OpenAI GPT-4)
- ✅ Video platform (WebRTC)
- ✅ WebSocket support
- ✅ RESTful API endpoints
- ✅ Health monitoring
- ✅ Environment configuration

## 📡 **API Endpoints**

### **Main App (Proxy)**
- `POST /api/fraud/start` → Proxies to microservice
- `POST /api/llm/analyze` → Proxies to microservice
- `POST /api/llm/questions` → Proxies to microservice

### **Microservice (Direct)**
- `GET /health` → Health check
- `POST /api/v1/fraud/start` → Start interview
- `POST /api/v1/fraud/end/:sessionId` → End interview
- `POST /api/v1/fraud/transcript` → Submit transcript
- `POST /api/v1/fraud/screen` → Submit screen events
- `GET /api/v1/fraud/score/:sessionId` → Get fraud score
- `POST /api/v1/llm/analyze` → LLM analysis
- `POST /api/v1/llm/questions` → Generate questions
- `GET /api/v1/video/config` → Video configuration

## 🔑 **Environment Setup**

### **Microservice (.env)**
```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=sk-your-openai-api-key-here
LLM_MODEL=gpt-4
ENABLE_LLM_ANALYSIS=true
ENABLE_VIDEO_CALLS=true
ENABLE_FRAUD_DETECTION=true
```

### **Main App (.env.local)**
```bash
INTERVIEW_AI_SERVICE_URL=http://localhost:3001
INTERVIEW_AI_WS_URL=http://localhost:3001
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 🧪 **Testing the Services**

### **1. Test Microservice Health**
```bash
curl http://localhost:3001/health
```

### **2. Test Main App Health**
```bash
curl http://localhost:3000/health
```

### **3. Test Interview Start**
```bash
curl -X POST http://localhost:3000/api/fraud/start \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "test123",
    "companyId": "company456",
    "consent": {
      "audio": true,
      "video": true,
      "screen": true,
      "telemetry": true
    }
  }'
```

## 🚨 **Troubleshooting**

### **Port Conflicts**
If you get port conflicts:
1. Kill existing processes: `pkill -f "next dev" && pkill -f "nodemon"`
2. Update ports in environment files
3. Restart services

### **API Key Issues**
1. Get OpenAI API key from: https://platform.openai.com/api-keys
2. Add to microservice `.env` file
3. Restart microservice

### **Connection Issues**
1. Ensure both services are running
2. Check environment variables
3. Verify CORS settings

## 📁 **Repository Structure**

### **Main App (zaksha-web-mvp)**
```
zaksha-web-mvp/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities and services
│   └── services/
│       └── interview-ai.ts # Microservice client
├── package.json
├── .env.local             # Environment variables
└── setup-microservice-integration.sh
```

### **Microservice (zaksha-interview-ai)**
```
zaksha-interview-ai/
├── src/
│   ├── index.ts           # Main server file
│   ├── types/             # TypeScript types
│   ├── services/          # Business logic
│   │   ├── fraudDetection.ts
│   │   ├── llm.ts
│   │   └── video.ts
│   └── routes/            # API routes
│       ├── fraud.ts
│       ├── llm.ts
│       └── video.ts
├── package.json
├── .env                   # Environment variables
└── setup-env.sh
```

## 🎯 **Next Steps**

1. **Set up API keys** in the microservice
2. **Test both services** independently
3. **Integrate services** through the proxy
4. **Deploy to production** when ready
5. **Add monitoring** and logging

## 🚀 **Production Deployment**

### **Docker Deployment**
```bash
# Microservice
cd zaksha-interview-ai
docker build -t zaksha-interview-ai .
docker run -p 3001:3001 zaksha-interview-ai

# Main app
cd zaksha-web-mvp
docker build -t zaksha-web-mvp .
docker run -p 3000:3000 zaksha-web-mvp
```

### **Environment Variables for Production**
```bash
# Microservice
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
OPENAI_API_KEY=your-production-api-key

# Main app
INTERVIEW_AI_SERVICE_URL=https://your-microservice-domain.com
INTERVIEW_AI_WS_URL=wss://your-microservice-domain.com
```

---

**🎉 You now have a fully separated microservices architecture!**

The services are completely independent and can be developed, deployed, and scaled separately.

