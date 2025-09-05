import { VideoConfig, VideoStream } from '../types';

export class VideoService {
  private static instance: VideoService;
  private localStreams: Map<string, MediaStream> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();

  static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  // WebRTC Configuration
  private getRTCConfiguration(): RTCConfiguration {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
  }

  // Create peer connection
  async createPeerConnection(userId: string, sessionId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.getRTCConfiguration());

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(userId, remoteStream);
      console.log(`Remote stream received from ${userId}`);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // This would be sent to the remote peer via signaling server
        console.log('ICE candidate generated:', event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, peerConnection.connectionState);
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  // Create offer
  async createOffer(userId: string, sessionId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = await this.createPeerConnection(userId, sessionId);
    
    // Add local stream if available
    const localStream = this.localStreams.get(sessionId);
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  // Create answer
  async createAnswer(userId: string, sessionId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = await this.createPeerConnection(userId, sessionId);
    
    // Add local stream if available
    const localStream = this.localStreams.get(sessionId);
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  // Handle answer
  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  // Get user media
  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Unable to access camera/microphone. Please check permissions.');
    }
  }

  // Get display media (screen share)
  async getDisplayMedia(constraints: DisplayMediaStreamConstraints): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing display media:', error);
      throw new Error('Unable to access screen sharing. Please check permissions.');
    }
  }

  // Store local stream
  setLocalStream(sessionId: string, stream: MediaStream): void {
    this.localStreams.set(sessionId, stream);
  }

  // Get local stream
  getLocalStream(sessionId: string): MediaStream | undefined {
    return this.localStreams.get(sessionId);
  }

  // Get remote stream
  getRemoteStream(userId: string): MediaStream | undefined {
    return this.remoteStreams.get(userId);
  }

  // Get all remote streams
  getAllRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  // End call
  async endCall(sessionId: string): Promise<void> {
    // Close all peer connections
    this.peerConnections.forEach(peerConnection => {
      peerConnection.close();
    });
    this.peerConnections.clear();

    // Stop local stream
    const localStream = this.localStreams.get(sessionId);
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStreams.delete(sessionId);
    }

    // Clear remote streams
    this.remoteStreams.clear();
  }

  // Toggle video track
  toggleVideo(sessionId: string): boolean {
    const stream = this.localStreams.get(sessionId);
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Toggle audio track
  toggleAudio(sessionId: string): boolean {
    const stream = this.localStreams.get(sessionId);
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Check if video is enabled
  isVideoEnabled(sessionId: string): boolean {
    const stream = this.localStreams.get(sessionId);
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      return videoTrack ? videoTrack.enabled : false;
    }
    return false;
  }

  // Check if audio is enabled
  isAudioEnabled(sessionId: string): boolean {
    const stream = this.localStreams.get(sessionId);
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      return audioTrack ? audioTrack.enabled : false;
    }
    return false;
  }

  // Get connection statistics
  async getConnectionStats(userId: string): Promise<RTCStatsReport | null> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      return await peerConnection.getStats();
    }
    return null;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; connections: number }> {
    return {
      status: 'healthy',
      connections: this.peerConnections.size
    };
  }
}
