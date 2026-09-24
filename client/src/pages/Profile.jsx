import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, feedbackService } from '../services/api';
import { User, Globe, Languages, Shield, Tag, X, Award, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { COUNTRIES } from '../utils/countries';

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo"
];

const PREDEFINED_INTERESTS = [
  "travel", "books", "coding", "gaming", "music", "movies", "cooking", "fitness", "finance", "business"
];

export default function Profile() {
  const { user, updateProfile, updateAvatar } = useAuth();
  
  // Profile settings state
  const [username, setUsername] = useState('');
  const [languageLevel, setLanguageLevel] = useState('Intermediate');
  const [timezone, setTimezone] = useState('UTC');
  const [country, setCountry] = useState('US');
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Distribution details
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setLanguageLevel(user.languageLevel || 'Intermediate');
      setTimezone(user.timezone || 'UTC');
      setInterests(user.interests || []);
      setCountry(user.country || 'US');
      fetchRatingStats();
      fetchBlockedUsers();
    }
  }, [user]);

  const fetchRatingStats = async () => {
    if (!user) return;
    try {
      const response = await feedbackService.getUserRating(user.id);
      if (response.success) {
        setRatingStats(response.rating);
      }
    } catch (err) {
      console.warn('Failed to load rating stats:', err.message);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await userService.getBlockedUsers();
      if (response.success) {
        setBlockedUsers(response.blockedUsers);
      }
    } catch (err) {
      console.warn('Failed to load blocked users list:', err.message);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        username,
        languageLevel,
        interests,
        timezone,
        country
      });
    } catch (err) {
      // Handled in Context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAvatar = async (url) => {
    try {
      await updateAvatar(url);
    } catch (err) {
      // Handled in Context
    }
  };

  const handleAddInterest = (tag) => {
    const formattedTag = tag.trim().toLowerCase();
    if (!formattedTag) return;
    if (interests.includes(formattedTag)) return;
    if (interests.length >= 10) {
      toast.error('Limit of 10 interests reached.');
      return;
    }
    setInterests(prev => [...prev, formattedTag]);
    setInterestInput('');
  };

  const handleRemoveInterest = (tag) => {
    setInterests(prev => prev.filter(t => t !== tag));
  };

  const handleUnblock = async (blockedId) => {
    try {
      const response = await userService.unblockUser(blockedId);
      if (response.success) {
        toast.success('User unblocked successfully');
        setBlockedUsers(prev => prev.filter(u => u.userId !== blockedId));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to unblock user');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in">
      
      {/* Page header */}
      <div className="lg:col-span-12 border-b border-slate-800/40 pb-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-100">Profile Configurations</h2>
        <p className="text-sm text-slate-400">Configure your partner matching criteria, timezone, and avatars.</p>
      </div>

      {/* Left Column: Avatar & Rating Distribution */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Avatar Card */}
        <div className="glass rounded-3xl p-6 border border-slate-800 text-center">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile Avatar"
              className="w-24 h-24 rounded-full object-cover border border-purple-500 mx-auto mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-green-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
              {user?.username.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="font-bold text-slate-200 text-lg">{user?.username}</h3>
          <p className="text-xs text-slate-500 uppercase font-semibold mt-0.5">{user?.isGuest ? 'Guest User' : 'Registered'}</p>
          
          {/* Avatar selector list */}
          <div className="mt-6">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Change Avatar</span>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectAvatar(url)}
                  className={`relative rounded-lg border overflow-hidden p-0.5 aspect-square bg-slate-950 transition-all ${
                    user?.profilePicture === url ? 'border-purple-500 scale-105' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={url} alt={`Avatar option ${i}`} className="w-full h-full object-cover" />
                  {user?.profilePicture === url && (
                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full flex items-center justify-center text-[8px] text-white">
                      <Check size={8} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Call Feedback Ratings Stats card */}
        <div className="glass rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
              <Award size={16} className="text-amber-400" />
              Rating Score
            </h4>
            <span className="text-xs text-slate-500 font-bold uppercase">{ratingStats.totalRatings} ratings</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold text-slate-100">{ratingStats.averageRating || '0.0'}</span>
            <div>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-lg">
                    {s <= Math.round(ratingStats.averageRating) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Average rating</span>
            </div>
          </div>

          {/* Rating bars distribution list */}
          <div className="space-y-1.5 pt-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingStats.ratingDistribution[stars] || 0;
              const percent = ratingStats.totalRatings > 0 
                ? (count / ratingStats.totalRatings) * 100 
                : 0;

              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-400 font-bold">{stars}</span>
                  <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Edit Profile details, Interests & Blocks */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Settings form */}
        <div className="glass rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2">
            <User size={18} className="text-blue-400" />
            Basic Configurations
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Speaking Level</label>
                <select
                  value={languageLevel}
                  onChange={(e) => setLanguageLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-855 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-3 text-sm text-slate-200"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Native">Native</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">My Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-855 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-3 text-sm text-slate-200"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Globe size={12} /> Timezone
                </label>
                <input
                  type="text"
                  placeholder="e.g. America/New_York or UTC"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-3 text-sm text-slate-200"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </div>

            {/* Interest badges */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={12} /> Matching Interests (Maximum 10)
              </label>

              {/* Badge container */}
              <div className="flex flex-wrap gap-2 mb-3 bg-slate-950 p-3 rounded-2xl border border-slate-850/60 min-h-[50px]">
                {interests.length === 0 ? (
                  <span className="text-xs text-slate-600 self-center">No interests added yet. Add badges to match with users of similar interests.</span>
                ) : (
                  interests.map((tag) => (
                    <span 
                      key={tag} 
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300 font-medium capitalize"
                    >
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveInterest(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Input for custom interests */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type an interest (e.g. reading, sports) and hit Enter"
                  className="flex-1 bg-slate-950 border border-slate-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl p-2.5 text-xs text-slate-200"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest(interestInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddInterest(interestInput)}
                  className="px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
                >
                  Add
                </button>
              </div>

              {/* Predefined templates tag buttons */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PREDEFINED_INTERESTS.filter(tag => !interests.includes(tag)).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddInterest(tag)}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 capitalize transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {isLoading ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Blocked users dashboard card */}
        <div className="glass rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2">
            <Shield size={18} className="text-red-400" />
            Blocked Callers List
          </h3>

          {blockedUsers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No blocked users. All matching routes are active.</p>
          ) : (
            <div className="divide-y divide-slate-850 max-h-[220px] overflow-y-auto pr-2">
              {blockedUsers.map((item) => (
                <div key={item.userId} className="flex justify-between items-center py-2.5">
                  <div className="flex items-center gap-2">
                    {item.profilePicture ? (
                      <img src={item.profilePicture} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-semibold text-slate-200 block">{item.username}</span>
                      <span className="text-[10px] text-slate-500">Language: {item.languageLevel}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(item.userId)}
                    className="px-3 py-1.5 rounded-lg border border-red-800/40 text-[10px] font-semibold text-red-400 hover:bg-red-950/20 hover:border-red-700 transition-all"
                  >
                    Unblock User
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
