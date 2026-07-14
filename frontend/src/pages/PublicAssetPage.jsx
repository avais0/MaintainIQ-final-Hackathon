import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QrCode, AlertTriangle, CheckCircle2, History, MapPin, Calendar, Clock, Wrench, Download, Link2, Copy, Check } from 'lucide-react';

export default function PublicAssetPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchPublicAsset = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/assets/public/${code}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Asset not found');
        }
        const data = await res.json();
        setAsset(data);
      } catch (err) {
        setError(err.message || 'Could not fetch asset details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicAsset();
  }, [code]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!asset || !asset.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = asset.qrCodeUrl;
    link.download = `QR-${asset.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Issue Reported': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Under Inspection': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Under Maintenance': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Out of Service': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Retired': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent':
      case 'Good': return 'text-emerald-400';
      case 'Fair': return 'text-amber-400';
      case 'Poor':
      case 'Broken': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Wrench className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Fetching asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Asset Not Found</h1>
        <p className="text-slate-400 max-w-md mb-8">
          The asset identifier <span className="text-rose-400 font-bold uppercase">"{code}"</span> does not match any registered asset in our records, or this asset might have been removed.
        </p>
        <Link 
          to="/"
          className="bg-slate-900 border border-slate-800 text-white hover:bg-slate-850 px-6 py-3 rounded-xl text-sm font-medium transition-all"
        >
          Return to Portal Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-bold tracking-tight">Maintain<span className="text-indigo-400">IQ</span></span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400 uppercase tracking-wider">
          Public Asset View
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: QR & Quick Actions */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            {/* Printable Label Wrapper */}
            <div className="w-full bg-white text-slate-950 p-4 rounded-xl shadow-md flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">MaintainIQ Asset Label</span>
              <h3 className="font-extrabold text-sm mt-1">{asset.name}</h3>
              <p className="text-xs text-slate-600 font-semibold">{asset.code}</p>
              
              {asset.qrCodeUrl && (
                <img 
                  src={asset.qrCodeUrl} 
                  alt="Asset QR Code" 
                  className="w-40 h-40 object-contain my-3"
                />
              )}
              
              <span className="text-[9px] text-slate-500 font-medium">Scan to check status or report issues</span>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <button
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/50 hover:bg-indigo-500/10 text-slate-300 hover:text-white py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/50 hover:bg-indigo-500/10 text-slate-300 hover:text-white py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {asset.status !== 'Retired' && (
            <button
              onClick={() => navigate(`/public/asset/${asset.code}/report`)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold transition-all text-center cursor-pointer shadow-lg shadow-indigo-500/20 glow-indigo"
            >
              Report an Issue
            </button>
          )}
        </div>

        {/* Right Side: Asset Details & Timeline */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel border border-slate-900 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-5">
              <div>
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{asset.category}</span>
                <h2 className="text-2xl font-bold text-white mt-1">{asset.name}</h2>
                <p className="text-slate-400 text-sm mt-1 uppercase font-semibold">{asset.code}</p>
              </div>
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Location</h4>
                  <p className="text-white text-sm mt-0.5 font-medium">{asset.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Reported Condition</h4>
                  <p className={`text-sm mt-0.5 font-bold ${getConditionColor(asset.condition)}`}>{asset.condition}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Last Serviced Date</h4>
                  <p className="text-white text-sm mt-0.5 font-medium">{asset.lastServiceDate || 'Not yet serviced'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Next Service Target</h4>
                  <p className="text-white text-sm mt-0.5 font-medium">{asset.nextServiceDate || 'Not scheduled'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs (Safe Version) */}
          <div className="glass-panel border border-slate-900 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>Asset Activity Timeline</span>
            </h3>

            {asset.history && asset.history.length > 0 ? (
              <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6">
                {asset.history.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Circle Pin */}
                    <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-950 ring-4 ring-indigo-500/10"></span>
                    
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                      <h4 className="text-slate-200 text-sm font-bold mt-0.5">{log.action}</h4>
                      {log.details && (
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed bg-slate-900/30 p-2 border border-slate-900/80 rounded-lg">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">No service or modification history logged yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
