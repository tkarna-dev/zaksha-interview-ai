import express from 'express';
import { FraudDetectionService } from '../services/fraudDetection';
import { ApiResponse } from '../types';

const router = express.Router();
const fraudService = new FraudDetectionService();

// Start interview session
router.post('/start', async (req, res) => {
  try {
    const { candidateId, companyId, role, consent } = req.body;

    if (!candidateId || !companyId || !consent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateId, companyId, consent'
      } as ApiResponse);
    }

    const result = await fraudService.startInterview({
      candidateId,
      companyId,
      role,
      consent
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start interview'
    } as ApiResponse);
  }
});

// End interview session
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await fraudService.endInterview(sessionId);

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Error ending interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end interview'
    } as ApiResponse);
  }
});

// Submit transcript chunk
router.post('/transcript', async (req, res) => {
  try {
    const { sessionId, seq, text, startMs, endMs, speaker } = req.body;

    if (!sessionId || seq === undefined || !text || startMs === undefined || endMs === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, seq, text, startMs, endMs'
      } as ApiResponse);
    }

    const result = await fraudService.ingestTranscript({
      sessionId,
      seq,
      text,
      startMs,
      endMs,
      speaker
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Error ingesting transcript:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest transcript'
    } as ApiResponse);
  }
});

// Submit screen event
router.post('/screen', async (req, res) => {
  try {
    const { sessionId, t, type, meta } = req.body;

    if (!sessionId || t === undefined || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, t, type'
      } as ApiResponse);
    }

    const result = await fraudService.ingestScreenEvent({
      sessionId,
      t,
      type,
      meta
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Error ingesting screen event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest screen event'
    } as ApiResponse);
  }
});

// Submit compile/run event
router.post('/compile', async (req, res) => {
  try {
    const { sessionId, t, action, ok } = req.body;

    if (!sessionId || t === undefined || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, t, action'
      } as ApiResponse);
    }

    const result = await fraudService.ingestCompileEvent({
      sessionId,
      t,
      action,
      ok
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Error ingesting compile event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest compile event'
    } as ApiResponse);
  }
});

// Get latest fraud score
router.get('/score/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const score = await fraudService.getLatestScore(sessionId);

    res.json({
      success: true,
      data: score
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting fraud score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get fraud score'
    } as ApiResponse);
  }
});

// Get comprehensive report
router.get('/report/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const report = await fraudService.getReport(sessionId);

    res.json({
      success: true,
      data: report
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting fraud report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get fraud report'
    } as ApiResponse);
  }
});

// Get session info
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await fraudService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: session
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    } as ApiResponse);
  }
});

// Get all sessions (admin endpoint)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = fraudService.getAllSessions();

    res.json({
      success: true,
      data: sessions
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    } as ApiResponse);
  }
});

export default router;
