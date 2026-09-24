import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6 text-center space-y-4">
      <AlertCircle className="text-purple-500" size={48} />
      <h2 className="text-2xl font-bold text-slate-200">Page not found</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        The route you are trying to visit does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
      >
        Go Home
      </Link>
    </div>
  );
}
