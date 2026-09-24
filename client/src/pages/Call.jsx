import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket.service';
import { useWebRTC } from '../hooks/useWebRTC';
import MatchingStatus from '../components/CallMatching/MatchingStatus';
import AudioVisualizer from '../components/CallInterface/AudioVisualizer';
import CallFeedbackModal from '../components/Feedback/CallFeedbackModal';
import ReportModal from '../components/Feedback/ReportModal';
import { feedbackService } from '../services/api';
import { formatDuration } from '../utils/helpers';
import { COUNTRIES } from '../utils/countries';
import { Phone, Mic, MicOff, ShieldAlert, X, SkipForward, Check, Globe, HelpCircle, Video, VideoOff, Users, Send, Play, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_ONLINE_USERS = [
  { id: '1', name: 'Ava', age: 25, country: 'US', flag: '🇺🇸', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava' },
  { id: '2', name: 'Grace', age: 30, country: 'GB', flag: '🇬🇧', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace' },
  { id: '3', name: 'Olivia', age: 23, country: 'CA', flag: '🇨🇦', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
  { id: '4', name: 'Sofia', age: 28, country: 'IT', flag: '🇮🇹', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' },
  { id: '5', name: 'Isabella', age: 24, country: 'ES', flag: '🇪🇸', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella' },
  { id: '6', name: 'Ella', age: 25, country: 'DE', flag: '🇩🇪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ella' },
  { id: '7', name: 'Yuki', age: 22, country: 'JP', flag: '🇯🇵', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki' },
  { id: '8', name: 'Carlos', age: 27, country: 'BR', flag: '🇧🇷', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos' }
];

// Demo dummy partners
const DEMO_PARTNERS = [
  { id: 'demo1', username: 'Sophia_UK', ageRange: '18-25', country: 'GB', flag: '🇬🇧', languageLevel: 'Advanced', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sophia&backgroundColor=b6e3f4' },
  { id: 'demo2', username: 'Luca_IT', ageRange: '26-35', country: 'IT', flag: '🇮🇹', languageLevel: 'Intermediate', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Luca&backgroundColor=ffdfbf' },
  { id: 'demo3', username: 'Yuki_JP', ageRange: '18-25', country: 'JP', flag: '🇯🇵', languageLevel: 'Intermediate', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Yuki&backgroundColor=c0aede' },
  { id: 'demo4', username: 'Diego_BR', ageRange: '26-35', country: 'BR', flag: '🇧🇷', languageLevel: 'Beginner', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Diego&backgroundColor=d1d4f9' },
];

// Scripted conversation sequences
const DEMO_CONVERSATIONS = [
  [
    { delay: 1500, sender: 'partner', text: 'Hey! 👋 How are you doing today?' },
    { delay: 3200, sender: 'You', text: 'Hi! I\'m good, thanks! This is so cool haha 😅' },
    { delay: 5000, sender: 'partner', text: 'Same here! Where are you from? 🌍' },
    { delay: 7500, sender: 'You', text: 'I\'m from India! And you?' },
    { delay: 9000, sender: 'partner', text: 'I\'m from the UK 🇬🇧 Love your country, hope to visit someday!' },
    { delay: 11500, sender: 'You', text: 'That\'s amazing! You should definitely visit!' },
    { delay: 14000, sender: 'partner', text: 'Are you learning English or just practicing speaking? 😊' },
    { delay: 16500, sender: 'You', text: 'Practicing speaking mostly. My English is decent but I want to get better!' },
    { delay: 19000, sender: 'partner', text: 'You\'re doing great honestly ✨ Very clear pronunciation!' },
    { delay: 21500, sender: 'You', text: 'Thank you so much! That means a lot 🙏' },
    { delay: 24000, sender: 'partner', text: 'What do you do for work or study? 💼' },
    { delay: 26500, sender: 'You', text: 'I\'m a software developer! You?' },
    { delay: 28000, sender: 'partner', text: 'Oh wow cool! I\'m studying linguistics 📚' },
    { delay: 30500, sender: 'You', text: 'That\'s so interesting! Do you speak multiple languages?' },
    { delay: 32000, sender: 'partner', text: 'English, French and a little Spanish! Working on Mandarin now 😅' },
  ],
  [
    { delay: 1000, sender: 'partner', text: 'Ciao! 👋 Do you speak Italian at all?' },
    { delay: 3000, sender: 'You', text: 'Ciao! Unfortunately no, but I\'d love to learn 😄' },
    { delay: 5000, sender: 'partner', text: 'I can teach you a few words haha! “Come stai?” means How are you?' },
    { delay: 7000, sender: 'You', text: 'Come stai? 😄 Did I say it right?' },
    { delay: 8500, sender: 'partner', text: 'Perfetto!! 🥳 You\'re a natural!' },
    { delay: 11000, sender: 'You', text: 'Haha grazie! That\'s the only Italian I know 😅' },
    { delay: 13000, sender: 'partner', text: 'Do you like Italian food? 🍕' },
    { delay: 14500, sender: 'You', text: 'Are you kidding me?? Pizza is literally my religion 🙏' },
    { delay: 16500, sender: 'partner', text: 'Hahaha! Real Italian pizza is nothing like what you get outside though!' },
    { delay: 19000, sender: 'You', text: 'I believe it! I have to visit Italy someday just for the food' },
    { delay: 21000, sender: 'partner', text: 'Come to Naples 😍 Best pizza in the world guaranteed!' },
  ],
  [
    { delay: 2000, sender: 'partner', text: 'こんにちは! Hello from Tokyo 🇯🇵' },
    { delay: 4000, sender: 'You', text: 'Konnichiwa! 😄 Tokyo must be incredible!' },
    { delay: 5500, sender: 'partner', text: 'It is! Very busy, very bright, very fun 🌃 Have you been?' },
    { delay: 7500, sender: 'You', text: 'Not yet but it\'s top of my bucket list! Anime fan here 🙋' },
    { delay: 9500, sender: 'partner', text: 'Oh! Which anime do you like? 🎴' },
    { delay: 11500, sender: 'You', text: 'Attack on Titan, Demon Slayer, Jujutsu Kaisen! You?' },
    { delay: 13000, sender: 'partner', text: 'Gintama is my all time fave 😅 You should watch it!' },
    { delay: 15000, sender: 'You', text: 'Adding it to my list right now! 📝' },
    { delay: 17500, sender: 'partner', text: 'How\'s your Japanese? Do you know any words?' },
    { delay: 19500, sender: 'You', text: 'Only kawaii and sugoi haha! 😅' },
    { delay: 21000, sender: 'partner', text: 'Hahaha!! That\'s actually a good start ✨' },
  ],
];

export default function Call() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // DEMO MODE state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoPartner, setDemoPartner] = useState(null);
  const [demoIsTyping, setDemoIsTyping] = useState(false);
  const [demoPartnerAvatarSeed, setDemoPartnerAvatarSeed] = useState('');
  const demoTimersRef = useRef([]);

  // Call state machine: idle, searching, match_found, match_accepted, calling, call_ended
  const [sessionState, setSessionState] = useState('idle');
  const [matchData, setMatchData] = useState(null); // otherUser info, matchId
  const [otherUserSocketId, setOtherUserSocketId] = useState('');
  const [isPeerAccepted, setIsPeerAccepted] = useState(false);
  const [acceptCountdown, setAcceptCountdown] = useState(10);
  const [hasSentAccept, setHasSentAccept] = useState(false);

  // Filters
  const [preferredCountry, setPreferredCountry] = useState('Global');
  
  // Call mode switch: audio vs video (read from search params)
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'video';
  const [callMode, setCallMode] = useState(initialMode);
  
  // Chat messaging states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  
  // HTML5 Video streams refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Live counter
  const [liveCounter, setLiveCounter] = useState(205786);

  // Call timer
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // Audio Device
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  // Modals
  const [showFeedback, setShowFeedback] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [lastCallId, setLastCallId] = useState('');

  // Socket reference
  const socketRef = useRef(null);

  // Redirect if not signed in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Live counter fluctuation animation
  useEffect(() => {
    const counterInterval = setInterval(() => {
      setLiveCounter(prev => prev + Math.floor(Math.random() * 41) - 20);
    }, 3000);
    return () => clearInterval(counterInterval);
  }, []);

  // Load Audio Input Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        setAudioInputDevices(inputs);
        if (inputs.length > 0) {
          setSelectedInput(inputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Devices listing permission not granted yet:', err);
      }
    };
    getDevices();
  }, [sessionState]);

  // WebRTC Hook usage
  const handleCallEnded = () => {
    clearInterval(timerRef.current);
    setSessionState('call_ended');
    setShowFeedback(true);
  };

  // Dynamic Page Title based on State
  useEffect(() => {
    if (sessionState === 'calling') {
      document.title = callMode === 'video' 
        ? "📹 RanQuickCalls | Match Live Video" 
        : "🎙️ RanQuickCalls | Live Audio Call";
    } else if (sessionState === 'searching') {
      document.title = "🔍 RanQuickCalls | Matching...";
    } else {
      document.title = "🎙️ RanQuickCalls | Peer Calling Network";
    }
  }, [sessionState, callMode]);

  const {
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
  } = useWebRTC(matchData?.matchId, otherUserSocketId, handleCallEnded, callMode === 'video');

  // Set local video element srcObject
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video element srcObject
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto scroll chat messaging box
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Establish Sockets
  useEffect(() => {
    if (!token) return;

    const socket = socketService.connect(token);
    socketRef.current = socket;

    // Automatically search on connect
    socket.on('connect', () => {
      socket.emit('user:join-queue', { preferredCountry, callMode: initialMode });
      setSessionState('searching');
      toast.success(`Automatically matching in ${initialMode} mode...`);
    });

    if (socket.connected) {
      socket.emit('user:join-queue', { preferredCountry, callMode: initialMode });
      setSessionState('searching');
    }

    // Register Match Event Listeners
    socket.on('match:found', (data) => {
      setMatchData(data);
      setSessionState('match_found');
      setAcceptCountdown(data.expiresIn || 10);
      setHasSentAccept(false);
      setIsPeerAccepted(false);
    });

    socket.on('match:accepted', (data) => {
      setMatchData(data); // Set matchData containing otherUser info immediately
      setSessionState('calling');
      setOtherUserSocketId(data.otherUserSocketId);
      
      const socket = socketService.getSocket();
      if (socket && socket.id < data.otherUserSocketId) {
        setTimeout(() => {
          initiateOffer();
        }, 1000);
      }

      // Start Call Timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    });

    socket.on('call:peer-accepted', () => {
      setIsPeerAccepted(true);
    });

    socket.on('match:rejected', (data) => {
      toast.error('Match declined.');
      resetToIdle();
    });

    socket.on('match:timeout', () => {
      toast.error('Match expired.');
      resetToIdle();
    });

    socket.on('chat:message', (data) => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: data.from,
        text: data.message
      }]);
    });

    return () => {
      socket.off('match:found');
      socket.off('match:accepted');
      socket.off('call:peer-accepted');
      socket.off('match:rejected');
      socket.off('match:timeout');
      socket.off('chat:message');
      socketService.disconnect();
    };
  }, [token, initiateOffer]);

  // Match ring countdown
  useEffect(() => {
    if (sessionState !== 'match_found') return;
    if (acceptCountdown <= 0) {
      if (!hasSentAccept) {
        handleDeclineMatch();
      }
      return;
    }

    const cd = setInterval(() => {
      setAcceptCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(cd);
  }, [sessionState, acceptCountdown, hasSentAccept]);

  const resetToIdle = () => {
    clearInterval(timerRef.current);
    // Clean up any demo timers
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];
    setIsDemoMode(false);
    setDemoPartner(null);
    setDemoIsTyping(false);
    setSessionState('idle');
    setMatchData(null);
    setOtherUserSocketId('');
    setHasSentAccept(false);
    setIsPeerAccepted(false);
    setDuration(0);
    setChatMessages([]);
  };

  // ── DEMO MODE: Simulate full matching + live conversation ──
  const handleStartDemo = () => {
    // Pick a random partner and conversation
    const partnerIndex = Math.floor(Math.random() * DEMO_PARTNERS.length);
    const partner = DEMO_PARTNERS[partnerIndex];
    const conversation = DEMO_CONVERSATIONS[partnerIndex % DEMO_CONVERSATIONS.length];

    setIsDemoMode(true);
    setDemoPartner(partner);
    setChatMessages([]);
    setDuration(0);

    // Phase 1: Show searching state
    setSessionState('searching');
    toast.success('🎬 Demo mode: Searching for a match...', { duration: 2000 });

    // Phase 2: After 3s, show match found
    const t1 = setTimeout(() => {
      setSessionState('match_found');
      setMatchData({ matchId: 'demo-match-001', otherUser: partner });
      setAcceptCountdown(5);
      toast('🔔 Match found! Auto-accepting...', { icon: '🎉', duration: 2000 });
    }, 3000);

    // Phase 3: After 5s, enter calling state and start conversation
    const t2 = setTimeout(() => {
      setSessionState('calling');
      setMatchData({ matchId: 'demo-match-001', otherUser: partner });

      // Start call timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Schedule each chat message
      const chatTimers = conversation.map(({ delay, sender, text }) => {
        // Show typing indicator just before partner messages
        let typingTimer = null;
        if (sender === 'partner') {
          typingTimer = setTimeout(() => setDemoIsTyping(true), delay - 800);
        }

        const msgTimer = setTimeout(() => {
          if (sender === 'partner') setDemoIsTyping(false);
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            sender,
            text,
          }]);
        }, delay);

        return typingTimer ? [typingTimer, msgTimer] : [msgTimer];
      });

      demoTimersRef.current = chatTimers.flat().filter(Boolean);
    }, 5500);

    demoTimersRef.current = [t1, t2];
  };

  const handleStartSearching = () => {
    const socket = socketService.getSocket();
    if (socket) {
      setSessionState('searching');
      socket.emit('user:join-queue', { preferredCountry, callMode });
      toast.success(`Joined ${callMode} queue with filter: ${preferredCountry}`);
    } else {
      toast.error('Connection server is offline. Try reloading.');
    }
  };

  const handleCancelSearching = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('disconnect');
      socketService.connect(token);
    }
    resetToIdle();
  };

  const handleAcceptMatch = () => {
    const socket = socketService.getSocket();
    if (socket && matchData) {
      socket.emit('user:accept-match', { matchId: matchData.matchId });
      setHasSentAccept(true);
    }
  };

  const handleDeclineMatch = () => {
    const socket = socketService.getSocket();
    if (socket && matchData) {
      socket.emit('user:reject-match', { matchId: matchData.matchId });
    }
    resetToIdle();
  };

  const handleHangup = () => {
    hangupCall();
    if (matchData?.matchId) {
      setLastCallId(matchData.matchId);
    }
    handleCallEnded();
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('chat:message', { message: chatInput });
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'You',
        text: chatInput
      }]);
      setChatInput('');
    }
  };

  const handleSkipNext = () => {
    hangupCall();
    resetToIdle();
    setTimeout(() => {
      handleStartSearching();
    }, 1000);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await feedbackService.submitFeedback({
        callId: matchData?.matchId || lastCallId,
        ...feedbackData
      });
      toast.success('Thank you for your feedback!');
    } catch (err) {
      console.warn('Could not post feedback details:', err.message);
    } finally {
      setShowFeedback(false);
      resetToIdle();
    }
  };

  const handleReportSubmit = async (reportData) => {
    try {
      const response = await feedbackService.reportAbuse({
        reportedUserId: matchData?.otherUser?.id,
        callId: matchData?.matchId,
        ...reportData
      });
      if (response.success) {
        toast.success('Report submitted. User blocked.');
        hangupCall();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setShowReport(false);
      resetToIdle();
    }
  };

  const getLatencyLabel = () => {
    if (latency === 0) return 'Analyzing...';
    if (latency < 100) return 'Excellent (<100ms)';
    if (latency < 250) return 'Good (<250ms)';
    return 'Poor (>250ms)';
  };

  const getPartnerCountryFlag = () => {
    if (!matchData?.otherUser?.country) return '🌐';
    const found = COUNTRIES.find(c => c.code === matchData.otherUser.country);
    return found ? found.flag : '🌐';
  };

  // Determine if currently in active calling state for full-width layout
  const isCallingActive = sessionState === 'calling' && matchData;

  return (
    <div className={`mx-auto px-4 py-0 min-h-[calc(100vh-80px)] animate-fade-in text-left flex flex-col ${isCallingActive ? 'max-w-full' : 'max-w-7xl px-6 py-6'}`}>

    {/* ── ACTIVE CALL: FULL-WIDTH SPLIT LAYOUT ── */}
    {isCallingActive && (
      <div className="flex flex-col h-[calc(100vh-80px)]">

        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center px-5 py-2.5 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500 font-bold">Auto Matching...</span>
            </span>
            <span className="text-[var(--text-secondary)] flex items-center gap-1 text-xs">
              <span className="animate-spin text-slate-400" style={{ display: 'inline-block', animationDuration: '3s' }}>⚙</span>
              Finding someone for you
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)]">
            <Users size={16} className="text-purple-500" />
            <span>{liveCounter.toLocaleString()}+ online now</span>
          </div>
        </div>

        {/* MAIN CALL AREA: LEFT VIDEO + RIGHT PANEL */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Two Stacked Video Feeds */}
          <div className="flex flex-col w-[38%] min-w-[300px] border-r border-[var(--border-color)] bg-black">

            {/* Partner Video (top half) */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
              {isDemoMode && demoPartner ? (
                /* DEMO: Show partner avatar with animated background */
                <div className="w-full h-full relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                  {/* Animated circles for ambiance */}
                  <div className="absolute w-48 h-48 rounded-full bg-purple-600/10 animate-pulse" style={{ animationDuration: '2s' }} />
                  <div className="absolute w-32 h-32 rounded-full bg-blue-600/10 animate-ping" style={{ animationDuration: '3s' }} />
                  {/* Avatar */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30">
                      <img src={demoPartner.avatar} alt={demoPartner.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-base">{demoPartner.username}</p>
                      <p className="text-slate-400 text-xs">{demoPartner.flag} {demoPartner.country} • {demoPartner.languageLevel}</p>
                    </div>
                    {/* Mic wave animation */}
                    <div className="flex items-end gap-1 h-6">
                      {[0.4,0.8,1,0.6,0.9,0.5,0.7].map((h, i) => (
                        <div key={i} className="w-1 rounded-full bg-green-400" style={{ height: `${h * 24}px`, animationName: 'wave', animationDuration: `${0.5 + i * 0.1}s`, animationIterationCount: 'infinite', animationDirection: 'alternate' }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Connecting...</span>
                </div>
              )}
              {/* Partner label */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>Partner</span>
                <span>{getPartnerCountryFlag()}</span>
              </div>
              {/* Fullscreen icon */}
              <button className="absolute top-3 right-3 bg-black/40 hover:bg-black/70 p-1.5 rounded-lg transition-all text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              </button>
            </div>

            {/* Divider line */}
            <div className="h-[2px] bg-black" />

            {/* You Video (bottom half) */}
            <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
              {isDemoMode ? (
                /* DEMO: Show your local avatar */
                <div className="w-full h-full relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)' }}>
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500/50 shadow-2xl shadow-blue-500/20">
                      <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.username || 'You'}&backgroundColor=374151`} alt="You" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{user?.username || 'You'}</p>
                      <p className="text-slate-400 text-xs">🇮🇳 India • Your cam</p>
                    </div>
                    {/* Muted mic indicator */}
                    <div className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded-full">
                      <Mic size={10} className="text-blue-400" />
                      <span className="text-[10px] text-blue-400 font-bold">Live Audio</span>
                    </div>
                  </div>
                </div>
              ) : localStream ? (
                <>
                  {isCameraOff ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <VideoOff size={32} className="opacity-40" />
                      <span className="text-xs uppercase tracking-widest font-bold">Camera Off</span>
                    </div>
                  ) : (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
                  <span className="text-xs uppercase tracking-widest font-bold">Starting cam...</span>
                </div>
              )}
              {/* You label */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                You
              </div>
              {/* Fullscreen icon */}
              <button className="absolute top-3 right-3 bg-black/40 hover:bg-black/70 p-1.5 rounded-lg transition-all text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              </button>
              {/* Camera snapshot button */}
              <button className="absolute bottom-3 left-3 bg-black/50 hover:bg-black/80 p-2 rounded-lg text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
            </div>
          </div>

          {/* RIGHT: Info + Chat Panel */}
          <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">

            {/* Community Guidelines Banner */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Be respectful and follow our <span className="text-purple-500 underline cursor-pointer hover:text-purple-400">community guidelines.</span></p>
                  <p className="text-[10px] text-[var(--text-secondary)]">We don't tolerate hate speech, nudity or any harmful behavior.</p>
                </div>
              </div>
              <button className="text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all whitespace-nowrap">
                Learn more
              </button>
            </div>

            {/* Connected Status Center */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 px-5">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-purple-500/20 flex items-center justify-center">
                <Users size={28} className="text-purple-500" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-[var(--text-primary)]">Connected!</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">Say hi! You both like chatting.</p>
              </div>
              {/* Timer */}
              <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="text-sm font-mono font-bold text-[var(--text-primary)] tracking-widest">{formatDuration(duration)}</span>
              </div>

              {/* Chat message scroll area */}
              <div className="w-full max-w-lg flex-grow overflow-y-auto space-y-2 mt-2 max-h-[220px] min-h-[80px] px-1">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-xs text-[var(--text-secondary)]">No messages yet — say hello! 👋</p>
                    {isDemoMode && <p className="text-[10px] text-amber-400 mt-1 font-bold animate-pulse">🎬 Demo conversation will begin shortly...</p>}
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender === 'You';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                        <span className="text-[9px] text-[var(--text-secondary)] mb-0.5 font-bold">{msg.sender === 'partner' ? (demoPartner?.username || 'Partner') : msg.sender}</span>
                        <div className={`p-2.5 rounded-2xl max-w-[85%] break-words font-semibold text-xs leading-relaxed ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-color)]'}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Typing indicator */}
                {demoIsTyping && (
                  <div className="flex flex-col items-start animate-fade-in">
                    <span className="text-[9px] text-[var(--text-secondary)] mb-0.5 font-bold">{demoPartner?.username || 'Partner'}</span>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-[var(--border-color)] px-4 py-3">
              <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                />
                {/* Emoji button */}
                <button type="button" className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all text-lg">
                  😊
                </button>
                <button type="submit" className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center shadow-md">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROL BAR */}
        <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">

          {/* Left: Skip */}
          <button
            onClick={handleSkipNext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-sm transition-all group"
          >
            <SkipForward size={18} className="text-purple-500 group-hover:translate-x-0.5 transition-transform" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-black text-sm">Skip</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">Next Person</span>
            </div>
          </button>

          {/* Center: Control Buttons */}
          <div className="flex items-center gap-6">
            {/* Enable Cam */}
            <button
              onClick={toggleCamera}
              className="flex flex-col items-center gap-1 group"
              title={isCameraOff ? 'Enable Camera' : 'Disable Camera'}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-105 ${isCameraOff ? 'bg-red-600 border-red-500 text-white' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'}`}>
                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Enable Cam</span>
            </button>

            {/* End Call (big red) */}
            <button
              onClick={handleHangup}
              className="flex flex-col items-center gap-1 group"
              title="End Call"
            >
              <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all group-hover:scale-105">
                <Phone size={22} style={{ transform: 'rotate(135deg)' }} />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)]">End Call</span>
            </button>

            {/* Mute Mic */}
            <button
              onClick={toggleMute}
              className="flex flex-col items-center gap-1 group"
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-105 ${isMuted ? 'bg-red-600 border-red-500 text-white' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'}`}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Mute Mic</span>
            </button>
          </div>

          {/* Right: Report */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] hover:bg-red-500/5 hover:border-red-500/30 text-[var(--text-secondary)] hover:text-red-500 font-bold text-sm transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-red-500 text-[var(--text-secondary)] transition-colors"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div className="flex flex-col items-start leading-none">
              <span className="font-black text-sm">Report</span>
              <span className="text-[10px] font-medium">Block User</span>
            </div>
          </button>
        </div>
      </div>
    )}

    {/* ── NON-CALLING STATES: Original Grid Layout ── */}
    {!isCallingActive && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch py-6">

      {/* LEFT SCREEN PANEL: Call States Hub */}
      <div className="lg:col-span-8 flex flex-col justify-center items-center">
        
        {/* IDLE STATE: Main start dashboard */}
        {sessionState === 'idle' && (
          <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
            {/* Pulsing light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

            {/* Header branding */}
            <div className="relative z-10">
              <span className="text-sm font-bold text-blue-400 tracking-widest uppercase">RanQuickCalls Dashboard</span>
              <h2 className="text-4xl font-extrabold text-slate-100 mt-1">RanQuickCalls</h2>
              
              {/* Online matching counter (fluctuating) */}
              <div className="flex items-center gap-2 mt-4 text-green-400 font-bold text-sm bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl w-fit">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span>{liveCounter.toLocaleString()} are matching now!</span>
              </div>
            </div>

            {/* Call Mode Switcher Option (OmeTV style) */}
            <div className="flex justify-center gap-4 mt-4 z-10">
              <button
                type="button"
                onClick={() => setCallMode('video')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  callMode === 'video'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📹 Video Calling
              </button>
              <button
                type="button"
                onClick={() => setCallMode('audio')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  callMode === 'audio'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🎙️ Audio Calling
              </button>
            </div>

            {/* Big center start button */}
            <div className="flex flex-col justify-center items-center my-6 z-10 gap-4">
              <button
                onClick={handleStartSearching}
                className="group relative w-44 h-44 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-green-600 p-1 flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl shadow-purple-900/30"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-green-600 blur-md opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: 'var(--accent-gradient)' }} />
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center gap-1.5 relative z-10 transition-all hover:bg-slate-900/40">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-200">
                    <Video size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">Start Match</span>
                </div>
              </button>

              {/* DEMO MODE BUTTON */}
              <button
                onClick={handleStartDemo}
                className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/70 transition-all duration-300 hover:scale-[1.04] shadow-lg shadow-amber-500/10"
              >
                {/* Glow */}
                <div className="absolute inset-0 rounded-2xl bg-amber-500/5 blur-md group-hover:bg-amber-500/15 transition-all" />
                <div className="relative z-10 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/40 group-hover:scale-110 transition-transform">
                  <Play size={14} className="text-white ml-0.5" />
                </div>
                <div className="relative z-10 text-left">
                  <span className="block text-sm font-black text-amber-400 group-hover:text-amber-300 transition-colors">🎬 Watch Demo</span>
                  <span className="block text-[10px] text-slate-400 font-medium">See random matching in action</span>
                </div>
                <Sparkles size={16} className="relative z-10 text-amber-500/60 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>

            {/* Filters panel at bottom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/60 pt-6 z-10">
              {/* Country Selection Matching Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Globe size={10} /> Country Match Filter
                </label>
                <select
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-3 text-xs text-slate-300 font-semibold cursor-pointer transition-all"
                >
                  <option value="Global">🌐 Global (Anyone)</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Level matching filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  🗣️ English Level Filter
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-3 text-xs text-slate-300 font-semibold cursor-pointer transition-all"
                >
                  <option value="Any">All Levels</option>
                  <option value="Beginner">Beginner Only</option>
                  <option value="Intermediate">Intermediate Only</option>
                  <option value="Advanced">Advanced / Native</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SEARCHING STATE */}
        {sessionState === 'searching' && (
          <MatchingStatus status="searching" onCancel={handleCancelSearching} />
        )}

        {/* MATCH FOUND RINGING STATE */}
        {sessionState === 'match_found' && matchData && (
          <div className="glass-premium rounded-3xl p-8 border border-slate-800 max-w-md w-full text-center space-y-6 animate-fade-in relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
              <Phone className="animate-bounce" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Calling Partner Found!</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Accept inside: {acceptCountdown}s</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-left space-y-3 relative z-10">
              <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matched Partner</span>
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 border border-green-500/20 text-green-400 font-semibold uppercase">
                  {getPartnerCountryFlag()} {matchData.otherUser.country || 'Global'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Username</span>
                  <span className="text-sm font-semibold text-slate-200">{matchData.otherUser.username}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Age group</span>
                  <span className="text-sm font-semibold text-slate-200">{matchData.otherUser.ageRange}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">English Level</span>
                  <span className="text-sm font-semibold text-slate-200">{matchData.otherUser.languageLevel}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <button
                onClick={handleDeclineMatch}
                className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-bold text-sm transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptMatch}
                disabled={hasSentAccept}
                className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                  hasSentAccept
                    ? 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 shadow-green-950/20'
                }`}
              >
                <Check size={16} />
                {hasSentAccept ? 'Waiting...' : 'Accept Call'}
              </button>
            </div>
          </div>
        )}

        {/* CALL ENDED STATE */}
        {sessionState === 'call_ended' && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <Phone size={28} className="text-red-400" style={{ transform: 'rotate(135deg)' }} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Call Ended</h3>
            <p className="text-sm text-[var(--text-secondary)]">Duration: {formatDuration(duration)}</p>
            <button onClick={handleStartSearching} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all">
              Start New Match
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE PANEL: Online active user profiles */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-1.5">
            <Users size={16} className="text-purple-400" />
            Online Active Callers
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">
            Live Grid
          </span>
        </div>

        {/* Online profiles grid */}
        <div className="grid grid-cols-2 gap-4 flex-grow max-h-[500px] lg:max-h-none overflow-y-auto pr-1">
          {MOCK_ONLINE_USERS.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-[var(--border-color)] hover:border-purple-500/30 bg-slate-900/60 transition-all duration-300 cursor-pointer flex flex-col justify-end min-h-[140px] p-3 shadow-md"
              onClick={handleStartSearching}
            >
              {/* Avatar background */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
              <img
                src={item.avatar}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
              />

              {/* Online indicator badge */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-slate-950/80 border border-slate-850 px-1.5 py-0.5 rounded text-[8px] font-bold text-green-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </div>

              {/* Profile Details */}
              <div className="relative z-20 space-y-0.5">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1 leading-none">
                  {item.name}, {item.age}
                  <span className="text-base" title={item.country}>{item.flag}</span>
                </h4>
                <p className="text-[10px] text-slate-400 leading-none">Matched level: Inter</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>
    )}

      {/* MODALS (always rendered outside layout) */}
      {showFeedback && (
        <CallFeedbackModal
          isOpen={showFeedback}
          onClose={() => { setShowFeedback(false); resetToIdle(); }}
          onSubmit={handleFeedbackSubmit}
          callDuration={duration}
        />
      )}

      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          onSubmit={handleReportSubmit}
          reportedUser={matchData?.otherUser}
        />
      )}
    </div>
  );
}
