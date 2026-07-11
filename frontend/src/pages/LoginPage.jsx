import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, Wrench, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'technician') {
        navigate('/technician/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    const demoEmail = role === 'admin' ? 'admin@maintainiq.com' : 'tech@maintainiq.com';
    const demoPassword = role === 'admin' ? 'admin123' : 'tech123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(demoEmail, demoPassword);
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'technician') {
        navigate('/technician/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 to-slate-950 p-4">
      {/* Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 glow-indigo animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl mb-3 border border-indigo-500/20">
            <Wrench className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Maintain<span className="text-indigo-600 dark:text-indigo-400">IQ</span></h1>
          <p className="text-slate-550 dark:text-slate-400 mt-2 text-sm font-semibold">Asset Management & Service Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-405 dark:placeholder:text-slate-660 text-sm"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                required
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-405 dark:placeholder:text-slate-660 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl py-3 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800/80"></div>
          </div>
          <span className="relative bg-white dark:bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-550 dark:text-slate-500 font-bold">Quick Demo Access</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleDemoLogin('admin')}
            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 bg-slate-50 hover:bg-indigo-500/5 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 text-slate-700 hover:text-indigo-655 dark:text-slate-300 dark:hover:text-white rounded-xl py-2.5 text-sm transition-all cursor-pointer font-bold"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => handleDemoLogin('technician')}
            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 bg-slate-50 hover:bg-emerald-500/5 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 text-slate-700 hover:text-emerald-655 dark:text-slate-300 dark:hover:text-white rounded-xl py-2.5 text-sm transition-all cursor-pointer font-bold"
          >
            <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Technician</span>
          </button>
        </div>
      </div>
    </div>
  );
}
