import React, { useState } from 'react';
import { Star, Check } from 'lucide-react';

export default function CallFeedbackModal({ isOpen, onSubmit, onSkip, otherUserName = 'your partner' }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [quality, setQuality] = useState('good');
  const [issues, setIssues] = useState([]);

  if (!isOpen) return null;

  const toggleIssue = (issue) => {
    setIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue) 
        : [...prev, issue]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({
      rating,
      comment,
      qualityRating: quality,
      issues
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <h3 className="text-xl font-bold mb-1 text-slate-100">Rate your call</h3>
        <p className="text-sm text-slate-400 mb-6">How was your conversation with {otherUserName}?</p>

        <form onSubmit={handleSubmit}>
          {/* Star selector */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                className="p-1 transition-all transform hover:scale-110"
                onClick={() => setRating(val)}
                onMouseEnter={() => setHoverRating(val)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  size={36}
                  className={`transition-colors ${
                    val <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Quality selector */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Audio Connection Quality
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['poor', 'fair', 'good', 'excellent'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    quality === q
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox issues */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Did you experience any issues? (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'audio_issue', label: 'Audio cutouts' },
                { id: 'connection_issue', label: 'High latency / Lag' },
                { id: 'inappropriate_behavior', label: 'Inappropriate behavior' }
              ].map((issue) => {
                const isSelected = issues.includes(issue.id);
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => toggleIssue(issue.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? 'bg-green-950/30 border-green-800 text-green-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    {issue.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text feedback */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Additional Comments
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 resize-none h-24"
              placeholder="What did you talk about? Was this partner helpful?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-medium text-sm transition-all"
            >
              Skip Feedback
            </button>
            <button
              type="submit"
              disabled={rating === 0}
              className={`flex-1 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-lg ${
                rating > 0
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-purple-900/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              Submit & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
