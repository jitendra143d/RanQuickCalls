import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-md py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left pb-8 border-b border-[var(--border-color)]">
        <div className="space-y-3.5">
          <h4 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>About RanQuickCalls</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            RanQuickCalls is a premium, secure, peer-to-peer connection network designed to connect you instantly with people from around the world. Talk, connect, learn languages, and make friends completely free of charge.
          </p>
        </div>
        <div className="space-y-3.5">
          <h4 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Match Features</h4>
          <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
            <li className="flex items-center gap-2">🟢 Real-Time Matchmaking (Instant queue pairing)</li>
            <li className="flex items-center gap-2">🎙️ Separate Video & Audio matchmaking pools</li>
            <li className="flex items-center gap-2">🛡️ Multi-Provider OAuth (Google, Facebook, Mobile OTP)</li>
            <li className="flex items-center gap-2">💬 Secure client-to-client video communication</li>
          </ul>
        </div>
        <div className="space-y-3.5">
          <h4 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Safety & Privacy</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            We implement zero-tolerance monitoring for disruptive behaviour and do not record or log video transmissions. Your connection remains completely private.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-[var(--text-secondary)] font-medium gap-4">
        <span>© {new Date().getFullYear()} RanQuickCalls. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#terms" className="hover:underline hover:text-[var(--text-primary)] transition-colors">Terms of Use</a>
          <a href="#privacy" className="hover:underline hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
          <a href="#safety" className="hover:underline hover:text-[var(--text-primary)] transition-colors">Community Guidelines</a>
        </div>
      </div>
    </footer>
  );
}
