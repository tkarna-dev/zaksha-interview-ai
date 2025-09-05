import express from 'express';
import { LLMService } from '../services/llm';
import { ApiResponse } from '../types';

const router = express.Router();
const llmService = new LLMService();

// Analyze interview conversation
router.post('/analyze', async (req, res) => {
  try {
    const { sessionId, transcript, fraudScore, additionalContext } = req.body;

    if (!sessionId || !transcript) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, transcript'
      } as ApiResponse);
    }

    const analysis = await llmService.analyzeInterview(
      sessionId,
      transcript,
      fraudScore || 0,
      additionalContext
    );

    res.json({
      success: true,
      data: analysis
    } as ApiResponse);
  } catch (error) {
    console.error('LLM analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze interview'
    } as ApiResponse);
  }
});

// Generate follow-up questions
router.post('/questions', async (req, res) => {
  try {
    const { sessionId, topic, difficulty } = req.body;

    if (!sessionId || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, topic'
      } as ApiResponse);
    }

    const questions = await llmService.generateFollowUpQuestion(
      sessionId,
      topic,
      difficulty || 'medium'
    );

    res.json({
      success: true,
      data: { questions }
    } as ApiResponse);
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate questions'
    } as ApiResponse);
  }
});

// Get conversation history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = llmService.getConversationHistory(sessionId);

    res.json({
      success: true,
      data: { history }
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    } as ApiResponse);
  }
});

// Clear conversation history
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    llmService.clearConversationHistory(sessionId);

    res.json({
      success: true,
      message: 'Conversation history cleared'
    } as ApiResponse);
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation history'
    } as ApiResponse);
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await llmService.healthCheck();

    res.json({
      success: true,
      data: health
    } as ApiResponse);
  } catch (error) {
    console.error('LLM health check error:', error);
    res.status(500).json({
      success: false,
      error: 'LLM service unhealthy'
    } as ApiResponse);
  }
});

export default router;
