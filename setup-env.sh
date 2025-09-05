#!/bin/bash

echo "🔧 Setting up environment for Zaksha Interview AI Microservice..."

# Create .env file
cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=1000

# Feature Flags
ENABLE_LLM_ANALYSIS=true
ENABLE_VIDEO_CALLS=true
ENABLE_FRAUD_DETECTION=true

# Analysis Settings
ANALYSIS_INTERVAL=15000
FRAUD_SCORE_THRESHOLD=50
EOF

echo "✅ Environment file created!"
echo ""
echo "📝 Next steps:"
echo "1. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "2. Replace 'sk-your-openai-api-key-here' in .env with your actual API key"
echo "3. Run: npm run dev"
echo ""
echo "🚀 To start the microservice:"
echo "   npm run dev"
echo ""
echo "🔗 The microservice will run on: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"
