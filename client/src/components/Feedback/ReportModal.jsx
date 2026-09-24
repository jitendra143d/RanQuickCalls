import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function ReportModal({ isOpen, onSubmit, onCancel, otherUserName = 'your partner' }) {
  const [reason, setReason] = useState('inappropriate_language');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      reason,
      severity,
      description
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center gap-2 mb-2 text-red-400">
          <ShieldAlert size={24} />
          <h3 className="text-xl font-bold">Report Abusive Behavior</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Submit this report for moderator review. Reports are kept completely confidential and help maintain community safety.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Reason */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none rounded-xl p-3 text-sm text-slate-200"
            >
              <option value="inappropriate_language">Inappropriate Language / Swearing</option>
              <option value="harassment">Bullying / Harassment</option>
              <option value="spam">Spam / Advertising</option>
              <option value="nudity">Nudity / Sexual Content</option>
              <option value="underage">Underage user (&lt; 13 years old)</option>
              <option value="other">Other Violation</option>
            </select>
          </div>

          {/* Severity */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    severity === sev
                      ? 'bg-red-600/20 border-red-500 text-red-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Detailed Description
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 resize-none h-28"
              placeholder="What specifically did they say or do? Including details helps moderators act faster."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              required
            />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-medium text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-lg shadow-red-950/20"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
