import { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socket.service';
import logger from '../utils/helpers'; // we'll write simple helpers or print statements

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export const useWebRTC = (matchId, partnerSocketId, onCallEnded, isVideoEnabled = false) => {
  const [callState, setCallState] = useState('idle'); // idle, ringing, connecting, connected, ended, reconnecting
  const [isMuted, setIsMuted] = useState(false);
  const [latency, setLatency] = useState(0);
  const [audioLevels, setAudioLevels] = useState(new Array(10).fill(0)); // amplitude levels for voice visualizer
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const socketRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Initialize Remote Audio object
  useEffect(() => {
    remoteAudioRef.current = new Audio();
    remoteAudioRef.current.autoplay = true;

    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, []);

  /**
   * Handle Web Audio API for visualizer bars
   */
  const startAudioAnalysis = (stream) => {
    try {
      if (!stream) return;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Small size for visualizer columns

      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisuals = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map 32 elements down to 10 visualizer bars
        const step = Math.floor(bufferLength / 10) || 1;
        const levels = [];
        for (let i = 0; i < 10; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          const average = sum / step;
          // Scale from 0-255 down to 0-100% height
          levels.push(Math.round((average / 255) * 100));
        }

        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
      };

      updateVisuals();
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevels(new Array(10).fill(0));
  };

  /**
   * Close peer connection
   */
  const cleanupCall = useCallback(() => {
    console.log('Cleaning up WebRTC peer connection...');
    
    // Stop stats interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Stop audio levels visualizer
    stopAudioAnalysis();

    // Close and stop local microphone/video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Remove remote audio/video source
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    setRemoteStream(null);

    // Close RTCPeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState('ended');
  }, []);

  /**
   * Monitor WebRTC metrics (Latency, Packet Loss)
   */
  const startQualityStatsMonitoring = (pc) => {
    pingIntervalRef.current = setInterval(async () => {
      if (!pc || pc.connectionState !== 'connected') return;

      try {
        const stats = await pc.getStats();
        stats.forEach(report => {
          // Look for candidate-pair representing the active connection
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            // Round-trip time is in seconds, convert to ms
            if (report.currentRoundTripTime) {
              setLatency(Math.round(report.currentRoundTripTime * 1000));
            }
          }
        });
      } catch (err) {
        console.warn('Failed to retrieve WebRTC statistics:', err);
      }
    }, 3000); // Check stats every 3 seconds
  };

  /**
   * Initialize Peer Connection
   */
  const initWebRTC = useCallback(async () => {
    try {
      setCallState('connecting');
      socketRef.current = socketService.getSocket();

      // 1. Get user media (microphone and optional video camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideoEnabled ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } : false
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      startAudioAnalysis(stream);

      // 2. Create peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionRef.current = pc;

      // Add track to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE Candidates from local browser to send to signaling partner
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('call:ice-candidate', {
            to: partnerSocketId,
            candidate: event.candidate
          });
        }
      };

      // Handle incoming remote audio/video stream
      pc.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind);
        const remoteStream = event.streams[0];
        remoteStreamRef.current = remoteStream;
        setRemoteStream(remoteStream);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state changed:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState('connected');
          startQualityStatsMonitoring(pc);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setCallState('ended');
          cleanupCall();
          if (onCallEnded) onCallEnded();
        } else if (pc.connectionState === 'disconnected') {
          setCallState('reconnecting');
        }
      };

      return pc;
    } catch (err) {
      console.error('Failed to initialize WebRTC local media:', err);
      setCallState('ended');
      throw err;
    }
  }, [partnerSocketId, cleanupCall, onCallEnded, isVideoEnabled]);

  /**
   * Create SDP Offer
   */
  const initiateOffer = useCallback(async () => {
    const pc = await initWebRTC();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('call:webrtc-offer', {
          to: partnerSocketId,
          offer
        });
      }
    } catch (err) {
      console.error('Failed to create WebRTC Offer:', err);
    }
  }, [initWebRTC, partnerSocketId]);

  /**
   * Handle incoming WebRTC SDP Offer
   */
  const handleOfferReceived = useCallback(async (offer) => {
    const pc = await initWebRTC();
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('call:webrtc-answer', {
          to: partnerSocketId,
          answer
        });
      }
    } catch (err) {
      console.error('Failed to handle incoming WebRTC Offer:', err);
    }
  }, [initWebRTC, partnerSocketId]);

  /**
   * Handle incoming WebRTC SDP Answer
   */
  const handleAnswerReceived = useCallback(async (answer) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Failed to set remote WebRTC Answer:', err);
      }
    }
  }, []);

  /**
   * Handle incoming WebRTC ICE Candidate
   */
  const handleIceCandidateReceived = useCallback(async (candidate) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Failed to add remote ICE Candidate:', err);
      }
    }
  }, []);

  /**
   * Handle socket events for calling signaling
   */
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('call:webrtc-offer', (data) => {
      handleOfferReceived(data.offer);
    });

    socket.on('call:webrtc-answer', (data) => {
      handleAnswerReceived(data.answer);
    });

    socket.on('call:ice-candidate', (data) => {
      handleIceCandidateReceived(data.candidate);
    });

    socket.on('call:ended', () => {
      cleanupCall();
      if (onCallEnded) onCallEnded();
    });

    return () => {
      socket.off('call:webrtc-offer');
      socket.off('call:webrtc-answer');
      socket.off('call:ice-candidate');
      socket.off('call:ended');
    };
  }, [handleOfferReceived, handleAnswerReceived, handleIceCandidateReceived, cleanupCall, onCallEnded]);

  /**
   * Toggle mute microphone track
   */
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        // If muted, visualizer drops to zero
        if (!audioTrack.enabled) {
          stopAudioAnalysis();
        } else {
          startAudioAnalysis(localStreamRef.current);
        }
      }
    }
  };

  /**
   * Triggers manual call end
   */
  const hangupCall = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('user:end-call');
    }
    cleanupCall();
    if (onCallEnded) onCallEnded();
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  return {
    callState,
    isMuted,
    latency,
    audioLevels,
    initiateOffer,
    toggleMute,
    hangupCall,
    localStream,
    remoteStream,
    isCameraOff,
    toggleCamera
  };
};

export default useWebRTC;
