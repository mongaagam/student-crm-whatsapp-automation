import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const { user, login, register, loading } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard instantly
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg('Please enter all credentials');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (isRegister && !name) {
      setErrorMsg('Please enter your full name');
      return;
    }

    setLocalLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await register(name, email, password);
      } else {
        result = await login(email, password);
      }

      if (result && !result.success) {
        setErrorMsg(result.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg('An unexpected authentication error occurred.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setName('Demo Admin');
    setEmail('admin@studentcrm.com');
    setPassword('admin123');
    setIsRegister(false);
    
    setLocalLoading(true);
    try {
      // Small timeout to mimic real authorization loader
      setTimeout(async () => {
        const result = await login('admin@studentcrm.com', 'admin123');
        if (result && !result.success) {
          setErrorMsg(result.message);
        } else {
          navigate('/dashboard');
        }
        setLocalLoading(false);
      }, 800);
    } catch (err) {
      setErrorMsg('Demo sign-in failed');
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#05070F]">
      {/* Decorative Glow Nodes */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-pink-500/8 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Auth Card container */}
      <div className="w-full max-w-md glass-panel border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl backdrop-blur-xl bg-opacity-60">
        
        {/* Core Header Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-indigo-500/20 mb-3 animate-pulse-slow">
            A
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            ANTIGRAVITY<span className="text-indigo-400 font-normal text-sm ml-0.5">CRM</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1 text-center font-medium max-w-[280px]">
            AI-Powered Admissions Command Center & Automated WhatsApp Hub
          </p>
        </div>

        {/* Dynamic Mode Switcher tabs */}
        <div className="grid grid-cols-2 bg-[#090C16] border border-white/5 p-1 rounded-xl mb-6 relative">
          <button
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Admin Sign In
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-2 animate-bounce">
            <span className="text-sm font-bold">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pl-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admissions Manager"
                className="w-full px-4 py-2.5 glass-input text-sm"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pl-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@admissions.com"
              className="w-full px-4 py-2.5 glass-input text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pl-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 glass-input text-sm"
              required
            />
          </div>

          {/* Form submit button */}
          <button
            type="submit"
            disabled={localLoading || loading}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-xl shadow-indigo-500/10 transition-all hover:scale-[1.01] flex items-center justify-center disabled:opacity-50"
          >
            {localLoading || loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isRegister ? (
              'Create Manager Profile'
            ) : (
              'Enter CRM Control Deck'
            )}
          </button>
        </form>

        {/* Demo Fast Login Helper */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-500 mb-2">Want to explore instantly without registering?</p>
          <button
            onClick={handleDemoLogin}
            className="px-4 py-1.5 rounded-full border border-indigo-500/30 text-[10px] font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-all uppercase tracking-wider"
          >
            🚀 Fast Demo Sign-In
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
