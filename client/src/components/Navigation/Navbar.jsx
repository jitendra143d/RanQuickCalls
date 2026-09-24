import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Home as HomeIcon, HelpCircle, ShieldAlert, Video, Palette } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="glass border-b border-[var(--border-color)] py-4 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0 bg-[var(--bg-secondary)]/80 backdrop-blur-md">
      {/* Brand Logo & Subtext */}
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Video size={20} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-lg font-black text-[var(--text-primary)] leading-none tracking-tight">RanQuickCalls</span>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-none">Talk. Connect. Make Friends.</span>
        </div>
      </Link>

      {/* Center Navigation Links */}
      <div className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1 rounded-full border border-[var(--border-color)]">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 text-blue-600 font-bold text-xs shadow-sm transition-all"
        >
          <HomeIcon size={12} />
          Home
        </Link>
        <a
          href="#how"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors"
        >
          <HelpCircle size={12} />
          How It Works
        </a>
        <a
          href="#safety"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors"
        >
          <ShieldAlert size={12} />
          Safety
        </a>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Theme Picker Dropdown */}
        <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-full border border-[var(--border-color)]">
          <Palette size={12} className="text-slate-400" />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent text-[var(--text-primary)] text-xs font-semibold outline-none cursor-pointer border-none"
            title="Choose Theme"
          >
            {themes.map(t => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* User Dropdown Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)]">
              <div className="relative w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-slate-950" />
              </div>
              <span className="capitalize">{user.isGuest ? 'Guest' : user.username}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
