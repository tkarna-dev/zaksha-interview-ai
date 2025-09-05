import express from 'express';
import { VideoService } from '../services/video';
import { ApiResponse } from '../types';

const router = express.Router();
const videoService = VideoService.getInstance();

// Get video configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      features: {
        video: process.env.ENABLE_VIDEO_CALLS === 'true',
        screenShare: true,
        audio: true
      }
    };

    res.json({
      success: true,
      data: config
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting video config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get video configuration'
    } as ApiResponse);
  }
});

// Create peer connection offer
router.post('/offer', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, sessionId'
      } as ApiResponse);
    }

    const offer = await videoService.createOffer(userId, sessionId);

    res.json({
      success: true,
      data: { offer }
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create offer'
    } as ApiResponse);
  }
});

// Create peer connection answer
router.post('/answer', async (req, res) => {
  try {
    const { userId, sessionId, offer } = req.body;

    if (!userId || !sessionId || !offer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, sessionId, offer'
      } as ApiResponse);
    }

    const answer = await videoService.createAnswer(userId, sessionId, offer);

    res.json({
      success: true,
      data: { answer }
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create answer'
    } as ApiResponse);
  }
});

// Handle ICE candidate
router.post('/ice-candidate', async (req, res) => {
  try {
    const { userId, candidate } = req.body;

    if (!userId || !candidate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, candidate'
      } as ApiResponse);
    }

    await videoService.handleIceCandidate(userId, candidate);

    res.json({
      success: true,
      message: 'ICE candidate processed'
    } as ApiResponse);
  } catch (error) {
    console.error('Error handling ICE candidate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle ICE candidate'
    } as ApiResponse);
  }
});

// End video call
router.post('/end-call', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId'
      } as ApiResponse);
    }

    await videoService.endCall(sessionId);

    res.json({
      success: true,
      message: 'Call ended successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end call'
    } as ApiResponse);
  }
});

// Toggle video
router.post('/toggle-video', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId'
      } as ApiResponse);
    }

    const isEnabled = videoService.toggleVideo(sessionId);

    res.json({
      success: true,
      data: { videoEnabled: isEnabled }
    } as ApiResponse);
  } catch (error) {
    console.error('Error toggling video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle video'
    } as ApiResponse);
  }
});

// Toggle audio
router.post('/toggle-audio', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId'
      } as ApiResponse);
    }

    const isEnabled = videoService.toggleAudio(sessionId);

    res.json({
      success: true,
      data: { audioEnabled: isEnabled }
    } as ApiResponse);
  } catch (error) {
    console.error('Error toggling audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle audio'
    } as ApiResponse);
  }
});

// Get connection statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await videoService.getConnectionStats(userId);

    res.json({
      success: true,
      data: { stats }
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting connection stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connection statistics'
    } as ApiResponse);
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await videoService.healthCheck();

    res.json({
      success: true,
      data: health
    } as ApiResponse);
  } catch (error) {
    console.error('Video service health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Video service unhealthy'
    } as ApiResponse);
  }
});

export default router;
