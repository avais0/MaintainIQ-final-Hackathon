import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, QrCode, ArrowRight, Shield, Wrench, Landmark, ClipboardList } from 'lucide-react';

export default function LandingPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    // Redirect to public asset route
    navigate(`/public/asset/${code.trim().toUpperCase()}`);
  };

  const demoAssets = [
    { code: 'ASSET-001', name: 'Classroom Projector 01', type: 'IT / AV Support' },
    { code: 'ASSET-002', name: 'Central AC Unit', type: 'HVAC' },
    { code: 'ASSET-003', name: 'Breakroom Refrigerator', type: 'Appliance' }
  ];

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden text-slate-100">
      {/* Background glow animations */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold tracking-tight">Maintain<span className="text-indigo-400">IQ</span></span>
        </div>
        
        {token ? (
          <div className="flex items-center gap-4">
            {role === 'admin' && (
              <Link 
                to="/dashboard" 
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mr-2"
              >
                Go to Admin Panel
              </Link>
            )}
            {role === 'technician' && (
              <Link 
                to="/dashboard" 
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mr-2"
              >
                Go to Tech Panel
              </Link>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-red-950/40 hover:border-red-500/40 bg-red-950/20 hover:bg-red-500/10 text-red-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-1.5 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Portal Login</span>
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <QrCode className="w-3.5 h-3.5" />
          <span>Scan. Report. Diagnose. Maintain.</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          AI-Powered QR Maintenance & <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Asset History Platform</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Centralize your organization's assets. Give every physical device a secure digital identity. Enable instantly reportable issues, AI-powered diagnostic recommendations, and automated maintenance tracking.
        </p>

        {/* Asset Code Lookup Box */}
        <div className="w-full max-w-md glass-panel rounded-2xl p-6 glow-indigo mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 text-left">Lookup Asset by Code</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. ASSET-001, ASSET-002"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl py-3 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span>Inspect Public Asset Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* QR Scan Simulator */}
        <div className="w-full max-w-2xl">
          <div className="relative mb-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-900"></div>
            </div>
            <span className="relative bg-slate-950 px-3 text-xs uppercase tracking-wider text-slate-500">QR Code Scan Simulator</span>
          </div>

          <p className="text-slate-400 text-sm mb-4">Click below to simulate scanning a physical asset label QR code:</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoAssets.map(asset => (
              <button
                key={asset.code}
                onClick={() => navigate(`/public/asset/${asset.code}`)}
                className="glass-panel hover:bg-slate-900/40 border border-slate-900 hover:border-indigo-500/30 rounded-xl p-4 text-left transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-indigo-400 font-bold mb-1.5">
                    <span>{asset.code}</span>
                    <QrCode className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h4 className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">{asset.name}</h4>
                  <p className="text-slate-500 text-xs mt-1">{asset.type}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-5px] group-hover:translate-x-0">
                  <span>Scan QR Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/80 px-6 py-6 text-center text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} MaintainIQ. Built for SMIT Final Hackathon (Batch 17 Track A).</p>
      </footer>
    </div>
  );
}
