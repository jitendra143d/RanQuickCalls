import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Languages, BrainCircuit } from 'lucide-react';

const TIPS = [
  {
    icon: <Languages className="text-blue-400" size={20} />,
    title: "Language Learning",
    text: "Don't worry about making grammar mistakes! Focusing on flow and speaking volume builds conversational confidence."
  },
  {
    icon: <BrainCircuit className="text-purple-400" size={20} />,
    title: "Stress Relief",
    text: "Speaking with strangers triggers a micro-dose of dopamine, helping lower cortisol and anxiety levels."
  },
  {
    icon: <Sparkles className="text-green-400" size={20} />,
    title: "Conversation Tip",
    text: "Ask open-ended questions like 'What is the most interesting thing you did today?' to keep conversations engaging."
  },
  {
    icon: <Languages className="text-blue-400" size={20} />,
    title: "Improve Pronunciation",
    text: "Try shadowing! Listen to how your partner speaks and replicate the intonation of their phrases."
  }
];

export default function MatchingStatus({ status = 'searching', onCancel }) {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return 'Searching for matching partners...';
      case 'found':
        return 'Match found! Ringing...';
      case 'accepted':
        return 'Match accepted! Opening audio streams...';
      default:
        return 'Connecting...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md w-full mx-auto bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] text-center animate-fade-in relative overflow-hidden shadow-2xl">
      {/* Visual Radar Waves */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 border border-blue-500/20 animate-ping" />
        <div className="absolute inset-4 rounded-full bg-purple-500/15 border border-purple-500/30 animate-pulse-wave" />
        <div className="absolute inset-8 rounded-full bg-green-500/20 border border-green-500/40 animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-green-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      </div>

      <h2 className="text-2xl font-black mb-2 text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{getStatusMessage()}</h2>
      <p className="text-sm font-bold text-[var(--text-secondary)] mb-6">Average matching speed: &lt; 15 seconds</p>

      {/* Tip Card */}
      <div className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-5 mb-6 min-h-[110px] text-left transition-all duration-300">
        <div className="flex items-center gap-2 mb-1.5">
          {TIPS[tipIndex].icon}
          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
            {TIPS[tipIndex].title}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {TIPS[tipIndex].text}
        </p>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="px-8 py-3 rounded-xl bg-red-650 hover:bg-red-750 text-white transition-all font-black text-xs w-full shadow-lg shadow-red-500/10 hover:scale-[1.02] duration-300"
      >
        Cancel Search
      </button>
    </div>
  );
}
