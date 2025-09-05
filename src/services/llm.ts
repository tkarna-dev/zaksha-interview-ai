import OpenAI from 'openai';
import { InterviewAnalysis, LLMTranscriptChunk } from '../types';

export class LLMService {
  private openai: OpenAI;
  private conversationHistory: Map<string, LLMTranscriptChunk[]> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeInterview(
    sessionId: string,
    transcript: LLMTranscriptChunk[],
    fraudScore: number,
    additionalContext?: string
  ): Promise<InterviewAnalysis> {
    try {
      // Store conversation history
      this.conversationHistory.set(sessionId, transcript);

      const systemPrompt = `You are an AI assistant helping interviewers detect suspicious behavior during technical interviews. 

Your job is to:
1. Analyze candidate responses for signs of cheating, AI assistance, or suspicious behavior
2. Provide real-time suggestions to the interviewer
3. Suggest follow-up questions to verify candidate knowledge
4. Identify risk factors and suspicious patterns

Consider these factors:
- Fraud detection score: ${fraudScore}/100
- Response patterns that might indicate AI assistance
- Technical knowledge depth vs. claimed experience
- Inconsistencies in explanations
- Overly perfect or generic responses
- Lack of personal experience details

Respond in JSON format with:
{
  "suspiciousBehavior": boolean,
  "confidence": number (0-100),
  "suggestions": ["suggestion1", "suggestion2"],
  "riskFactors": ["risk1", "risk2"],
  "nextQuestions": ["question1", "question2"]
}`;

      const userPrompt = `Analyze this interview transcript:

${transcript.map(chunk => `${chunk.speaker}: ${chunk.text}`).join('\n')}

Additional context: ${additionalContext || 'None'}

Provide your analysis in the specified JSON format.`;

      const completion = await this.openai.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
        max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const analysis = JSON.parse(response) as InterviewAnalysis;
      return analysis;

    } catch (error) {
      console.error('LLM analysis error:', error);
      
      // Fallback analysis based on fraud score
      return this.getFallbackAnalysis(fraudScore);
    }
  }

  async generateFollowUpQuestion(
    sessionId: string,
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<string[]> {
    try {
      const systemPrompt = `Generate 3 follow-up technical interview questions about ${topic} at ${difficulty} difficulty level. 
      Make them specific, practical, and designed to test deep understanding rather than memorization.`;

      const completion = await this.openai.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate 3 ${difficulty} level questions about ${topic}` }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Split response into individual questions
      const questions = response.split('\n').filter(q => q.trim().length > 0);
      return questions.slice(0, 3);

    } catch (error) {
      console.error('Question generation error:', error);
      return [
        `Can you explain how ${topic} works in a real-world scenario?`,
        `What are the main challenges when working with ${topic}?`,
        `How would you optimize ${topic} for better performance?`
      ];
    }
  }

  private getFallbackAnalysis(fraudScore: number): InterviewAnalysis {
    const suspiciousBehavior = fraudScore > 50;
    const confidence = Math.min(fraudScore, 80);
    
    const suggestions = suspiciousBehavior ? [
      "Ask for specific examples from their experience",
      "Request a live coding demonstration",
      "Ask about challenges they faced in previous projects"
    ] : [
      "Continue with technical questions",
      "Ask about their problem-solving approach"
    ];

    const riskFactors = suspiciousBehavior ? [
      "High fraud detection score",
      "Potential AI assistance detected"
    ] : [];

    const nextQuestions = [
      "Can you walk me through a specific project you worked on?",
      "What was the most challenging technical problem you solved?",
      "How do you approach debugging complex issues?"
    ];

    return {
      suspiciousBehavior,
      confidence,
      suggestions,
      riskFactors,
      nextQuestions
    };
  }

  getConversationHistory(sessionId: string): LLMTranscriptChunk[] {
    return this.conversationHistory.get(sessionId) || [];
  }

  clearConversationHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  // Health check for LLM service
  async healthCheck(): Promise<{ status: string; model: string }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });

      return {
        status: 'healthy',
        model: process.env.LLM_MODEL || "gpt-4"
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        model: process.env.LLM_MODEL || "gpt-4"
      };
    }
  }
}
