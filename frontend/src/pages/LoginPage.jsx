import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, Wrench, ShieldAlert, User, Users } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Portal and Registration States
  const [activePortal, setActivePortal] = useState('client'); // 'client' or 'staff'
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('technician'); // for staff portal registration

  // Auto redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'technician') {
        navigate('/technician/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

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
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const finalRole = activePortal === 'client' ? 'user' : role;

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, role: finalRole })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Account created successfully! You can now log in.');
      setIsRegistering(false);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl mb-3 border border-indigo-500/20">
            {activePortal === 'client' ? (
              <Users className="w-8 h-8 text-indigo-400" />
            ) : (
              <Wrench className="w-8 h-8 text-indigo-400 animate-pulse" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Maintain<span className="text-indigo-400">IQ</span></h1>
          <p className="text-slate-400 mt-2 text-sm">
            {activePortal === 'client' 
              ? (isRegistering ? 'Register Client Account' : 'Client Access Portal')
              : (isRegistering ? 'Register Staff Account' : 'Staff & Management Portal')}
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-6">
          <button
            onClick={() => {
              setActivePortal('client');
              setIsRegistering(false);
              setError('');
            }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activePortal === 'client'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Client Portal
          </button>
          <button
            onClick={() => {
              setActivePortal('staff');
              setIsRegistering(false);
              setError('');
            }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activePortal === 'staff'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff Portal
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900/55 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                  placeholder="John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full bg-slate-900/55 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full bg-slate-900/55 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isRegistering && activePortal === 'staff' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Staff Role</label>
              <select
                className="w-full bg-slate-900/55 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550 transition-all text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="technician">Technician (Maintenance & Repairs)</option>
                <option value="admin">Admin (Full Control Dashboard)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl py-3 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            onClick={toggleMode}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer bg-transparent border-0"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Create an Account'}
          </button>
        </div>

        {!isRegistering && activePortal === 'staff' && (
          <>
            <div className="relative my-8 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Quick Demo Access</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center justify-center gap-2 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 hover:text-white rounded-xl py-2.5 text-sm transition-all cursor-pointer font-bold"
              >
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => handleDemoLogin('technician')}
                className="flex items-center justify-center gap-2 border border-slate-800 hover:border-emerald-500/40 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 hover:text-white rounded-xl py-2.5 text-sm transition-all cursor-pointer font-bold"
              >
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Technician</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
