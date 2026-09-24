import React, { useState, useEffect } from 'react';
import { callService } from '../services/api';
import { timeAgo, formatDuration } from '../utils/helpers';
import { Calendar, Clock, Award, PhoneIncoming, Flame, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function History() {
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalMinutes: 0,
    averageDuration: 0,
    thisWeekCalls: 0,
    thisMonthCalls: 0,
    streak: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const fetchHistoryAndStats = async (reset = false) => {
    setIsLoading(true);
    try {
      const currentSkip = reset ? 0 : skip;
      
      // Fetch history logs
      const historyResponse = await callService.getHistory(limit, currentSkip);
      if (historyResponse.success) {
        if (reset) {
          setCalls(historyResponse.calls);
        } else {
          setCalls(prev => [...prev, ...historyResponse.calls]);
        }
        setHasMore(historyResponse.hasMore);
        setSkip(currentSkip + limit);
      }

      // Fetch statistics
      const statsResponse = await callService.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (err) {
      toast.error('Failed to load call details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndStats(true);
  }, []);

  const handleLoadMore = () => {
    fetchHistoryAndStats(false);
  };

  const handleRefresh = () => {
    setSkip(0);
    fetchHistoryAndStats(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Calling History & Analytics</h2>
          <p className="text-sm text-slate-400">Track your conversations, speaking minutes, and calling streaks.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-full glass-light hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          title="Refresh statistics"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Calls */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <PhoneIncoming size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Total Calls</span>
            <span className="text-2xl font-bold text-slate-200">{stats.totalCalls}</span>
          </div>
        </div>

        {/* Total Minutes */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Clock size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Speaking Time</span>
            <span className="text-2xl font-bold text-slate-200">{stats.totalMinutes} min</span>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
            <Award size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Duration</span>
            <span className="text-2xl font-bold text-slate-200">{formatDuration(stats.averageDuration)}</span>
          </div>
        </div>

        {/* Calling Streak */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Flame size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Daily Streak</span>
            <span className="text-2xl font-bold text-slate-200">{stats.streak} days</span>
          </div>
        </div>
      </div>

      {/* Call Log Listing Table */}
      <div className="glass rounded-3xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/40">
          <h3 className="font-bold text-slate-200">Call Log Records</h3>
          <span className="text-xs px-2 py-1 rounded bg-slate-850 border border-slate-800 text-slate-400">
            Past {calls.length} entries
          </span>
        </div>

        {calls.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Calendar className="mx-auto text-slate-700" size={32} />
            <p className="text-sm">No call records found yet.</p>
            <p className="text-xs">Once you match and start calling, your records will show here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {calls.map((call) => (
              <div key={call.callId} className="flex justify-between items-center p-4 hover:bg-slate-800/10 transition-colors">
                <div className="flex items-center gap-3">
                  {call.otherUserProfilePicture ? (
                    <img
                      src={call.otherUserProfilePicture}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-slate-300">
                      {call.otherUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{call.otherUserName}</h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} />
                      {timeAgo(call.date)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-300 flex items-center justify-end gap-1">
                    <Clock size={12} className="text-slate-500" />
                    {formatDuration(call.duration)}
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Duration</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div className="p-4 text-center border-t border-slate-850 bg-slate-900/10">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-6 py-2 rounded-xl glass-light border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load Older Logs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
