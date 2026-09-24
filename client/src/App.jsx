import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navigation/Navbar';
import Footer from './components/Navigation/Footer';
import Home from './pages/Home';
import Call from './pages/Call';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { Toaster } from 'react-hot-toast';
import { IS_DEMO_MODE } from './services/api';


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
            {/* Demo mode notice banner */}
            {IS_DEMO_MODE && (
              <div className="w-full text-center py-1.5 px-4 text-[11px] font-semibold tracking-wide"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)', color: '#e0e7ff', letterSpacing: '0.04em' }}>
                🚀 Demo Mode — All data is simulated. Deploy a backend to enable real calls.
              </div>
            )}
            {/* Global navigation bar */}
            <Navbar />

            
            {/* Main view container */}
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/call" element={<Call />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            {/* Global footer */}
            <Footer />
          </div>
          
          {/* Notification popup manager */}
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'glass text-slate-200 border-slate-800 text-xs font-semibold rounded-xl',
              style: {
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
