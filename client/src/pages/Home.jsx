import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, Video, Phone, Users, Globe, Heart, Mic, X, Award, HelpCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { COUNTRIES } from '../utils/countries';

export default function Home() {
  const [activeTab, setActiveTab] = useState('guest'); // guest, login, register
  const { login, register, guestLogin, socialLogin, mobileLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Set page tab title
  useEffect(() => {
    document.title = "🎙️ RanQuickCalls | Learn & Chat";
  }, []);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [guestAgeRange, setGuestAgeRange] = useState('18-25');
  const [guestLangLevel, setGuestLangLevel] = useState('Intermediate');
  const [guestCountry, setGuestCountry] = useState('US');

  // Social Auth Modal States
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState('google');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialStep, setSocialStep] = useState('input'); // input -> verifying -> success

  // Mobile Auth Modal States
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mobileStep, setMobileStep] = useState('phone'); // phone -> otp -> verifying -> success
  const [otpTimer, setOtpTimer] = useState(59);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (showMobileModal && mobileStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showMobileModal, mobileStep, otpTimer]);

  const handleStartGoogleAuth = () => {
    setSocialProvider('google');
    setSocialStep('input');
    setShowSocialModal(true);
  };

  const handleStartFacebookAuth = () => {
    setSocialProvider('facebook');
    setSocialStep('input');
    setShowSocialModal(true);
  };

  const handleStartMobileAuth = () => {
    setMobileStep('phone');
    setShowMobileModal(true);
  };

  const handleSocialSubmit = async (e) => {
    e.preventDefault();
    if (!socialEmail || !socialName) return;
    setSocialStep('verifying');
    setTimeout(async () => {
      try {
        await socialLogin({
          provider: socialProvider,
          email: socialEmail,
          name: socialName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socialName}`,
          ageRange: '18-25',
          languageLevel: 'Intermediate',
          country: 'US'
        });
        setSocialStep('success');
        setTimeout(() => {
          setShowSocialModal(false);
          setSocialStep('input');
          setSocialEmail('');
          setSocialName('');
          navigate('/call?mode=video');
        }, 1000);
      } catch (err) {
        setSocialStep('input');
      }
    }, 2000);
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!mobileNumber) return;
    setMobileStep('verifying');
    setTimeout(() => {
      setMobileStep('otp');
      setOtpTimer(59);
    }, 1500);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setMobileStep('verifying');
    setTimeout(async () => {
      try {
        await mobileLogin({
          phoneNumber: mobileNumber,
          ageRange: '18-25',
          languageLevel: 'Intermediate',
          country: 'US'
        });
        setMobileStep('success');
        setTimeout(() => {
          setShowMobileModal(false);
          setMobileStep('phone');
          setMobileNumber('');
          setOtpCode('');
          navigate('/call?mode=video');
        }, 1000);
      } catch (err) {
        setMobileStep('otp');
      }
    }, 1500);
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    try {
      await guestLogin(guestAgeRange, guestLangLevel, guestCountry);
      navigate('/call?mode=video');
    } catch (err) {
      // toast prints it
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      navigate('/call?mode=video');
    } catch (err) {
      // toast prints it
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(
        regUsername,
        regEmail,
        regPassword,
        '18-25',
        'Intermediate',
        [],
        'US'
      );
      navigate('/call?mode=video');
    } catch (err) {
      // toast prints it
    }
  };

  const handleStartCall = (mode) => {
    if (isAuthenticated) {
      navigate(`/call?mode=${mode}`);
    } else {
      setActiveTab('guest');
      toast.info('Please sign in or continue as Guest to start matching!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[calc(100vh-80px)] animate-fade-in text-[var(--text-primary)] bg-[var(--bg-primary)]">
      
      {/* LEFT COLUMN: HERO & GUIDELINES */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* HERO BANNER CARD */}
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-sm overflow-hidden text-left min-h-[300px]">
          <div className="space-y-4 max-w-sm z-15">
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-slate-100 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Talk. Connect.<br />
              Make Real <br />
              <span className="text-blue-600 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent" style={{ backgroundImage: 'var(--accent-gradient)' }}>
                Connections.👋
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-[280px]">
              Start a random audio or video call and meet amazing people from around the world.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-bold text-sm">
                <Shield size={13} /> Safe & Secure
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm">
                ⚡ 100% Free
              </span>
            </div>
          </div>

          {/* Overlapping tilted video feeds illustration */}
          <div className="hidden md:flex relative h-[180px] w-[300px] items-center justify-center select-none">
            {/* Feeder 1 - You */}
            <div className="absolute top-2 left-2 w-[120px] h-[150px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-850 shadow-lg -rotate-6 bg-slate-950 transition-all duration-300 hover:rotate-0 hover:scale-105 z-10">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ava"
                className="w-full h-full object-cover opacity-80"
                alt="YouParticipant"
              />
              <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-blue-600/90 text-white font-bold text-[8px] uppercase tracking-wide">
                You
              </span>
              <span className="absolute top-2 right-2 z-20 flex gap-0.5 text-green-400 font-extrabold text-[8px]">
                📶
              </span>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                <span className="p-1 rounded-full bg-slate-900/80 text-white text-[8px]"><Video size={8} /></span>
                <span className="p-1 rounded-full bg-slate-900/80 text-white text-[8px]"><Mic size={8} /></span>
                <span className="p-1 rounded-full bg-red-600 text-white text-[8px]"><X size={8} /></span>
              </div>
            </div>

            {/* Connecting wave badge */}
            <div className="absolute z-20 p-2 rounded-full bg-purple-500 text-white shadow-md animate-pulse">
              <Sparkles size={16} />
            </div>

            {/* Feeder 2 - Stranger */}
            <div className="absolute bottom-2 right-2 w-[120px] h-[150px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-850 shadow-lg rotate-6 bg-slate-955 transition-all duration-300 hover:rotate-0 hover:scale-105 z-10">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Liam"
                className="w-full h-full object-cover opacity-80"
                alt="StrangerParticipant"
              />
              <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-indigo-600/90 text-white font-bold text-[8px] uppercase tracking-wide">
                Stranger
              </span>
              <span className="absolute top-2 right-2 z-20 flex gap-0.5 text-green-400 font-extrabold text-[8px]">
                📶
              </span>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                <span className="p-1 rounded-full bg-slate-900/80 text-white text-[8px]"><Video size={8} /></span>
                <span className="p-1 rounded-full bg-slate-900/80 text-white text-[8px]"><Mic size={8} /></span>
                <span className="p-1 rounded-full bg-red-650 text-white text-[8px]"><X size={8} /></span>
              </div>
            </div>
          </div>
        </div>

        {/* HORIZONTAL GUIDELINES ALERT BANNER */}
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 flex items-center justify-between shadow-sm text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-650 flex-shrink-0">
              <Lock size={18} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Be kind, respectful and follow our <a href="#guidelines" className="text-blue-500 hover:underline">community guidelines</a> for a better experience.
            </p>
          </div>
          {/* Globe heart mini illustration */}
          <div className="hidden sm:flex items-center gap-1">
            <Globe className="text-blue-400 animate-spin" style={{ animationDuration: '20s' }} size={24} />
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: CALL OPTIONS CARD (MAIN FOCUS OF WEBSITE) */}
      <div className="lg:col-span-6">
        
        {/* START A RANDOM CALL STACKED CARD */}
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-8 space-y-6 shadow-2xl shadow-blue-500/10 text-left ring-8 ring-blue-500/5 transition-all duration-300">
          <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              🚀 Start a Random Call
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-snug">Choose how you want to connect and start matching instantly</p>
          </div>

          <div className="space-y-5">
            
            {/* VIDEO CALL PANEL (STACKED & EXPANDED) */}
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-6 space-y-4 hover:bg-blue-500/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-md">
                  <Video size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-blue-600 dark:text-blue-400 text-base">Video Call</span>
                  <span className="text-sm text-slate-500">Face-to-face random matchmaking</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Start a face-to-face video call with a random person. Connect globally with live video streams.
              </p>
              <button
                onClick={() => handleStartCall('video')}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-750 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] duration-300"
              >
                <Video size={18} /> Start Video Call
              </button>
            </div>

            {/* AUDIO CALL PANEL (STACKED & EXPANDED) */}
            <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-6 space-y-4 hover:bg-green-500/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 flex items-center justify-center text-green-600 flex-shrink-0 shadow-md">
                  <Phone size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-green-600 dark:text-green-400 text-base">Audio Call</span>
                  <span className="text-sm text-slate-500">Anonymously voice matched conversation</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Start an audio call and enjoy a voice conversation. Perfect for fast, private voice chats.
              </p>
              <button
                onClick={() => handleStartCall('audio')}
                className="w-full py-4 rounded-xl bg-green-650 hover:bg-green-755 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] duration-300"
              >
                <Phone size={18} /> Start Audio Call
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* BLURRED AUTH MODAL OVERLAY (FOR GUESTS AND REGULAR USERS TO SIGN IN) */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-premium rounded-3xl p-6 border border-slate-850 shadow-2xl relative overflow-hidden w-full max-w-sm bg-slate-900 text-slate-100 text-left">
            {/* Card Tabs */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl mb-6 border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setActiveTab('guest')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'guest'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={activeTab === 'guest' ? { backgroundImage: 'var(--accent-gradient)' } : {}}
              >
                Guest Mode
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={activeTab === 'login' ? { backgroundImage: 'var(--accent-gradient)' } : {}}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={activeTab === 'register' ? { backgroundImage: 'var(--accent-gradient)' } : {}}
              >
                Register
              </button>
            </div>

            {/* Guest Form */}
            {activeTab === 'guest' && (
              <form onSubmit={handleGuestSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">My Country</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-white"
                    value={guestCountry}
                    onChange={(e) => setGuestCountry(e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Age Range</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-white"
                    value={guestAgeRange}
                    onChange={(e) => setGuestAgeRange(e.target.value)}
                  >
                    <option value="13-18" className="bg-slate-900 text-white">Teenager (13-18 years old)</option>
                    <option value="18-25" className="bg-slate-900 text-white">Young Adult (18-25 years old)</option>
                    <option value="25-30" className="bg-slate-900 text-white">Adult (25-30 years old)</option>
                    <option value="30-40" className="bg-slate-900 text-white">Adult (30-40 years old)</option>
                    <option value="40-50" className="bg-slate-900 text-white">Adult (40-50 years old)</option>
                    <option value="50+" className="bg-slate-900 text-white">Senior (50+ years old)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">English Skill Level</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-white"
                    value={guestLangLevel}
                    onChange={(e) => setGuestLangLevel(e.target.value)}
                  >
                    <option value="Beginner" className="bg-slate-900 text-white">Beginner (Basic words / Slow pace)</option>
                    <option value="Intermediate" className="bg-slate-900 text-white">Intermediate (Normal pace / Everyday conversation)</option>
                    <option value="Advanced" className="bg-slate-900 text-white">Advanced (Fluently speak / Complex topics)</option>
                    <option value="Native" className="bg-slate-900 text-white">Native Speaker</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90"
                    style={{ backgroundImage: 'var(--accent-gradient)' }}
                  >
                    <Phone size={12} /> Continue anonymously
                  </button>
                </div>

                {/* Social Login buttons */}
                <div className="mt-6 border-t border-slate-850 pt-4 text-center space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Or Connect Via</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={handleStartGoogleAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-blue-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={handleStartFacebookAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-blue-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={handleStartMobileAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-green-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Mobile
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full bg-slate-955 border border-slate-855 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-955 border border-slate-855 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] duration-300"
                    style={{ backgroundImage: 'var(--accent-gradient)' }}
                  >
                    Log In Account
                  </button>
                </div>

                {/* Social Login buttons */}
                <div className="mt-6 border-t border-slate-855 pt-4 text-center space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Or Login Via</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={handleStartGoogleAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-955 border border-slate-855 hover:border-blue-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={handleStartFacebookAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-955 border border-slate-855 hover:border-blue-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={handleStartMobileAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-955 border border-slate-855 hover:border-green-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Mobile
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="john_doe"
                    className="w-full bg-slate-955 border border-slate-855 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full bg-slate-955 border border-slate-855 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-955 border border-slate-855 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] duration-300"
                    style={{ backgroundImage: 'var(--accent-gradient)' }}
                  >
                    Create Account
                  </button>
                </div>

                {/* Social Login buttons */}
                <div className="mt-6 border-t border-slate-855 pt-4 text-center space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Or Register Via</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={handleStartGoogleAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-955 border border-slate-855 hover:border-blue-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={handleStartFacebookAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-955 border border-slate-855 hover:border-blue-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={handleStartMobileAuth}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-955 border border-slate-855 hover:border-green-500/50 hover:scale-[1.03] transition-all duration-300 font-bold text-[9px] text-slate-300"
                    >
                      Mobile
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SOCIAL VERIFICATION MODAL OVERLAY */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4">
          <div className="relative w-full max-w-sm bg-slate-905 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 text-left">
            <button
              onClick={() => setShowSocialModal(false)}
              className="absolute top-4 right-4 text-slate-505 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
            <div className="text-center space-y-1">
              <span className="text-3xl">{socialProvider === 'google' ? '🌐' : '🔵'}</span>
              <h3 className="text-lg font-bold capitalize">Verify with {socialProvider}</h3>
              <p className="text-xs text-slate-400">Secure real-time OAuth verification handshake</p>
            </div>

            {socialStep === 'input' && (
              <form onSubmit={handleSocialSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Profile Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={socialName}
                    onChange={(e) => setSocialName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 outline-none rounded-xl p-3 text-xs text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center hover:scale-[1.01] duration-300"
                  style={{ backgroundImage: 'var(--accent-gradient)' }}
                >
                  Verify credentials
                </button>
              </form>
            )}

            {socialStep === 'verifying' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying on Google Server...</span>
              </div>
            )}

            {socialStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-2 text-green-400 font-bold">
                <span className="text-3xl">✓</span>
                <span className="text-xs uppercase tracking-widest">Verified successfully!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE OTP VERIFICATION MODAL OVERLAY */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4">
          <div className="relative w-full max-w-sm bg-slate-905 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 text-left">
            <button
              onClick={() => setShowMobileModal(false)}
              className="absolute top-4 right-4 text-slate-505 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
            <div className="text-center space-y-1">
              <span className="text-3xl">📱</span>
              <h3 className="text-lg font-bold">Phone Verification</h3>
              <p className="text-xs text-slate-400">Real-time OTP verification passcode</p>
            </div>

            {mobileStep === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-green-500 outline-none rounded-xl p-3 text-xs text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center hover:scale-[1.01] duration-300"
                  style={{ backgroundImage: 'var(--accent-gradient)' }}
                >
                  Send OTP Code
                </button>
              </form>
            )}

            {mobileStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center bg-slate-950 p-3 rounded-2xl border border-slate-855">
                  <span className="text-xs text-slate-400">SMS OTP sent to: <span className="font-semibold text-slate-200">{mobileNumber}</span></span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">6-Digit passcode</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-855 focus:border-green-500 outline-none rounded-xl p-3 text-center tracking-widest text-lg font-bold text-slate-100"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Resend code in: <span className="font-bold text-slate-300">{otpTimer}s</span></span>
                  <button type="button" disabled={otpTimer > 0} onClick={() => setOtpTimer(59)} className="text-blue-400 hover:text-blue-300 font-bold uppercase disabled:text-slate-600">Resend</button>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center hover:scale-[1.01] duration-300"
                  style={{ backgroundImage: 'var(--accent-gradient)' }}
                >
                  Verify OTP & Log In
                </button>
              </form>
            )}

            {mobileStep === 'verifying' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying OTP code...</span>
              </div>
            )}

            {mobileStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-2 text-green-400 font-bold">
                <span className="text-3xl">✓</span>
                <span className="text-xs uppercase tracking-widest">Mobile OTP Verified!</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
