import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { ShieldAlert, Users, PhoneCall, Clock, HeartHandshake, AlertCircle, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCalls: 0,
    averageCallDuration: 0,
    systemUptime: '99.9%',
    apiResponseTime: 120,
    callSuccessRate: '100%'
  });

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportsFilter, setReportsFilter] = useState('under_review'); // under_review, resolved

  // Suspension Modal State
  const [suspendModalUserId, setSuspendModalUserId] = useState(null);
  const [suspendModalUsername, setSuspendModalUsername] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('3'); // 3 days default
  const [suspensionReason, setSuspensionReason] = useState('Violating community guidelines');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const statsResponse = await adminService.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      const reportsResponse = await adminService.getReports(reportsFilter);
      if (reportsResponse.success) {
        setReports(reportsResponse.reports);
      }
    } catch (err) {
      toast.error('Failed to load administrative analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [reportsFilter]);

  const handleOpenSuspendModal = (userId, username) => {
    setSuspendModalUserId(userId);
    setSuspendModalUsername(username);
  };

  const handleCloseSuspendModal = () => {
    setSuspendModalUserId(null);
    setSuspendModalUsername('');
  };

  const handleConfirmSuspension = async () => {
    if (!suspendModalUserId) return;
    try {
      const response = await adminService.suspendUser(
        suspendModalUserId,
        parseInt(suspensionDuration, 10),
        suspensionReason
      );

      if (response.success) {
        toast.success(`Suspension applied: ${suspendModalUsername} blocked.`);
        // Refresh
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to apply suspension');
    } finally {
      handleCloseSuspendModal();
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 border border-red-500/30 text-red-400 font-bold uppercase">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold uppercase">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold uppercase">Low</span>;
    }
  };

  const formatReasonLabel = (reason) => {
    return reason.replace(/_/g, ' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-slate-800/40 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="text-red-500" size={24} />
          Moderator & Admin Dashboard
        </h2>
        <p className="text-sm text-slate-400">Review system diagnostics, online calls, and process reported violations.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Active Callers */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Users size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Active Users</span>
            <span className="text-2xl font-bold text-slate-200">{stats.activeUsers}</span>
            <span className="text-[10px] block text-slate-500 mt-0.5">Total Users: {stats.totalUsers}</span>
          </div>
        </div>

        {/* Total Calls */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <PhoneCall size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Total Calls</span>
            <span className="text-2xl font-bold text-slate-200">{stats.totalCalls}</span>
            <span className="text-[10px] block text-slate-500 mt-0.5">Success Rate: {stats.callSuccessRate}</span>
          </div>
        </div>

        {/* Avg Talk Duration */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
            <Clock size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Average Call</span>
            <span className="text-2xl font-bold text-slate-200">{stats.averageCallDuration} sec</span>
            <span className="text-[10px] block text-slate-500 mt-0.5">Uptime: {stats.systemUptime}</span>
          </div>
        </div>

        {/* API Speed */}
        <div className="glass rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
            <HeartHandshake size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">API Response</span>
            <span className="text-2xl font-bold text-slate-200">{stats.apiResponseTime} ms</span>
            <span className="text-[10px] block text-slate-500 mt-0.5">Target latency: &lt;200ms</span>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="glass rounded-3xl border border-slate-800 overflow-hidden">
        
        {/* Table controls */}
        <div className="px-6 py-4 border-b border-slate-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/40">
          <div>
            <h3 className="font-bold text-slate-200">Abuse Reports Grid</h3>
            <p className="text-xs text-slate-500">Respond to reported conversations violating safety protocols.</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setReportsFilter('under_review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                reportsFilter === 'under_review' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setReportsFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                reportsFilter === 'resolved' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved / Suspended
            </button>
          </div>
        </div>

        {/* Table list */}
        {reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShieldCheck className="mx-auto text-slate-700 animate-pulse" size={36} />
            <p className="text-sm font-semibold">All clean! No active reports.</p>
            <p className="text-xs">Community standards are fully maintained.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Reported Caller</th>
                  <th className="p-4">Reported By</th>
                  <th className="p-4">Violation Type</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Detailed Info</th>
                  {reportsFilter === 'under_review' && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reports.map((report) => (
                  <tr key={report.reportId} className="hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">{report.reportedUserName}</td>
                    <td className="p-4 text-slate-400">{report.reportedByUserName}</td>
                    <td className="p-4 font-mono text-purple-400 capitalize">{formatReasonLabel(report.reason)}</td>
                    <td className="p-4">{getSeverityBadge(report.severity)}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate" title={report.description}>
                      {report.description}
                    </td>
                    {reportsFilter === 'under_review' && (
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenSuspendModal(report.reportedUserId, report.reportedUserName)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md"
                        >
                          Suspend User
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspension Input Modal Dialog */}
      {suspendModalUserId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[120] animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Apply User Lockout</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Applying a suspension lock to <strong className="text-slate-200">@{suspendModalUsername}</strong> will block login authentication and disconnect open sockets.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lock Duration</label>
                <select
                  value={suspensionDuration}
                  onChange={(e) => setSuspensionDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days (Recommended)</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="365">1 Year (Permanent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Suspension Reason</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCloseSuspendModal}
                className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspension}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
              >
                Confirm Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
