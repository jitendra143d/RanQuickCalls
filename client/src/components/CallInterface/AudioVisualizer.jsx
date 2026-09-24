import React from 'react';

export default function AudioVisualizer({ audioLevels = [], isMuted = false, colorClass = 'bg-gradient-to-t from-blue-500 to-purple-500' }) {
  // If call is inactive or muted, show static low waveform
  const displayLevels = isMuted || audioLevels.length === 0
    ? new Array(10).fill(5)
    : audioLevels;

  return (
    <div className="flex items-center justify-center gap-1.5 h-20 px-6 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 w-full max-w-xs mx-auto">
      {displayLevels.map((level, index) => {
        // Enforce safe min/max limits
        const height = Math.max(5, Math.min(100, level));
        
        return (
          <div
            key={index}
            className={`w-2.5 rounded-full transition-all duration-100 ${colorClass}`}
            style={{
              height: `${height}%`,
              opacity: isMuted ? 0.3 : 0.3 + (height / 100) * 0.7
            }}
          />
        );
      })}
    </div>
  );
}
