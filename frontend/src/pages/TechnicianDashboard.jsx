import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, LogOut, Search, ClipboardList, MapPin, AlertCircle, Eye, ArrowRight } from 'lucide-react';

export default function TechnicianDashboard() {
  const { token, logout, API_URL, user } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadTechnicianIssues = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/issues`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIssues(data);
        }
      } catch (err) {
        console.error('Error fetching technician issues:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTechnicianIssues();
  }, [token]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = !search ||
      issue.issueNumber.toLowerCase().includes(search.toLowerCase()) ||
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
      issue.asset?.code.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeJobs = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header navbar */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-bold tracking-tight">Maintain<span className="text-indigo-400">IQ</span></span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full ml-2">
            Technician Pro
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-405 dark:text-slate-400 font-medium">Technician: <span className="text-white font-semibold">{user?.username}</span></span>
          <button 
            onClick={logout}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold border border-rose-500/15 hover:border-rose-500/35 bg-rose-500/5 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        
        {/* Banner with metrics */}
        <div className="glass-panel border border-slate-900 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Technician Task Board</h2>
            <p className="text-slate-400 text-sm mt-1">Review your assigned work orders and perform maintenance logs.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 text-center sm:text-right shrink-0">
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Active Jobs</span>
            <span className="text-2xl font-black text-white mt-0.5 inline-block">{activeJobs} Issues</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel border border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticket, asset name, code..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
            <select
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Inspection Started">Inspection Started</option>
              <option value="Maintenance In Progress">Maintenance In Progress</option>
              <option value="Waiting for Parts">Waiting for Parts</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="glass-panel border border-slate-900 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <Wrench className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Fetching assigned work orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="glass-panel border border-slate-900 rounded-2xl p-5 flex flex-col justify-between glass-card-hover"
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-slate-900 pb-3 mb-3">
                      <div>
                        <span className="text-xs font-bold text-indigo-400">{issue.issueNumber}</span>
                        <h3 className="text-white font-bold text-base mt-0.5">{issue.title}</h3>
                      </div>
                      
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-500 font-semibold uppercase block">Asset Target</span>
                        <span className="text-white font-semibold text-sm">{issue.asset?.name}</span> ({issue.asset?.code})
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{issue.asset?.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                      {issue.status}
                    </span>

                    <Link
                      to={`/technician/issue/${issue.issueNumber}`}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                    >
                      <span>Manage Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full glass-panel border border-slate-900 rounded-2xl p-16 text-center text-slate-500">
                No work orders assigned matching parameters.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
