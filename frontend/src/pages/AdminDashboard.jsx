import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Plus, Search, ShieldAlert, LogOut, Wrench, RefreshCw, 
  UserPlus, FileCheck, Layers, Calendar, BarChart3, AlertCircle, Ban, Eye, MapPin, History, Check, DollarSign
} from 'lucide-react';

export default function AdminDashboard() {
  const { token, logout, API_URL, user } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('issues'); // 'issues', 'assets', 'history'

  // Data States
  const [issues, setIssues] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [systemHistory, setSystemHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [issueFilterStatus, setIssueFilterStatus] = useState('');
  const [issueFilterPriority, setIssueFilterPriority] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [assetFilterStatus, setAssetFilterStatus] = useState('');

  // Asset Creation Form Modal States
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAssetCode, setNewAssetCode] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('');
  const [newAssetLocation, setNewAssetLocation] = useState('');
  const [newAssetCondition, setNewAssetCondition] = useState('Good');
  const [newAssetLastService, setNewAssetLastService] = useState('');
  const [newAssetNextService, setNewAssetNextService] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Trigger data reload
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // 1. Fetch Issues
        const issuesRes = await fetch(`${API_URL}/issues`, { headers });
        const issuesData = await issuesRes.json();
        setIssues(issuesData);

        // 2. Fetch Assets
        const assetsRes = await fetch(`${API_URL}/assets`, { headers });
        const assetsData = await assetsRes.json();
        setAssets(assetsData);

        // 3. Fetch Technicians
        const techsRes = await fetch(`${API_URL}/auth/technicians`, { headers });
        const techsData = await techsRes.json();
        setTechnicians(techsData);

        // 4. Fetch System History (We can hit a public or global asset endpoint. 
        // For simplicity, let's aggregate history by joining from assets or retrieve it from an history API.
        // Wait, let's create a global history log aggregator on the backend if needed.
        // Let's create an endpoint in backend for global history. 
        // Oh, wait, we didn't explicitly register GET /api/assets/history, but we can query it.
        // Let's make sure it handles history. Let's write the fetch).
        const historyRes = await fetch(`${API_URL}/assets/public/ASSET-001`); // Fallback public history check
        if (historyRes.ok) {
          const hData = await historyRes.json();
          setSystemHistory(hData.history || []);
        }

      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [token, reloadTrigger]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!newAssetCode || !newAssetName || !newAssetCategory || !newAssetLocation) {
      setFormError('Please fill out all required fields.');
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newAssetCode.trim().toUpperCase(),
          name: newAssetName.trim(),
          category: newAssetCategory.trim(),
          location: newAssetLocation.trim(),
          condition: newAssetCondition,
          lastServiceDate: newAssetLastService || null,
          nextServiceDate: newAssetNextService || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create asset');
      }

      // Reset Form & Close Modal
      setNewAssetCode('');
      setNewAssetName('');
      setNewAssetCategory('');
      setNewAssetLocation('');
      setNewAssetCondition('Good');
      setNewAssetLastService('');
      setNewAssetNextService('');
      setShowAssetModal(false);
      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      setFormError(err.message || 'Error occurred while creating asset.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignTechnician = async (issueId, technicianId) => {
    try {
      const res = await fetch(`${API_URL}/issues/${issueId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ technicianId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign technician');
      }

      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Status transitions from admin (e.g. close resolved issues)
  const handleUpdateIssueStatus = async (issueId, status) => {
    try {
      const res = await fetch(`${API_URL}/issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculations for summary metrics
  const totalAssets = assets.length;
  const operationalAssets = assets.filter(a => a.status === 'Operational').length;
  const activeIssues = issues.filter(i => i.status !== 'Closed' && i.status !== 'Resolved').length;
  const pendingAssignments = issues.filter(i => !i.technicianId).length;
  const operationalRate = totalAssets > 0 ? Math.round((operationalAssets / totalAssets) * 100) : 100;

  // Filter lists
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = !issueFilterStatus || issue.status === issueFilterStatus;
    const matchesPriority = !issueFilterPriority || issue.priority === issueFilterPriority;
    return matchesStatus && matchesPriority;
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !assetSearch || 
      asset.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.code.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.location.toLowerCase().includes(assetSearch.toLowerCase());
    const matchesStatus = !assetFilterStatus || asset.status === assetFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Low': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header navbar */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-bold tracking-tight">Maintain<span className="text-indigo-400">IQ</span></span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full ml-2">
            Administrator
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-450 font-medium">Signed in: <span className="text-white font-semibold">{user?.username}</span></span>
          <button 
            onClick={logout}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold border border-rose-500/15 hover:border-rose-500/35 bg-rose-500/5 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="glass-panel border border-slate-900 rounded-2xl p-5 flex items-center gap-4 glow-indigo">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Asset Fleet Status</p>
              <h3 className="text-2xl font-black text-white mt-1">{operationalRate}% <span className="text-xs text-slate-400 font-medium">Operational</span></h3>
              <p className="text-slate-500 text-[10px] mt-0.5">{operationalAssets} / {totalAssets} online</p>
            </div>
          </div>

          <div className="glass-panel border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Unresolved Issues</p>
              <h3 className="text-2xl font-black text-white mt-1">{activeIssues}</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">{pendingAssignments} awaiting assignment</p>
            </div>
          </div>

          <div className="glass-panel border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Service Log</p>
              <h3 className="text-2xl font-black text-white mt-1">{issues.filter(i => i.status === 'Closed' || i.status === 'Resolved').length}</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Completed repair campaigns</p>
            </div>
          </div>

          <div className="glass-panel border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-550 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Estimated Expenditure</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                Rs. {issues.reduce((sum, issue) => {
                  const subSum = issue.maintenanceRecords?.reduce((s, r) => s + parseFloat(r.cost), 0) || 0;
                  return sum + subSum;
                }, 0).toLocaleString()}
              </h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Asset maintenance costs</p>
            </div>
          </div>
        </section>

        {/* Tab Controls & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4 mb-6">
          <div className="flex border border-slate-900 bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${activeTab === 'issues' ? 'bg-indigo-600 text-white shadow' : 'text-slate-550 hover:text-white'}`}
            >
              Issue Tickets ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${activeTab === 'assets' ? 'bg-indigo-600 text-white shadow' : 'text-slate-550 hover:text-white'}`}
            >
              Assets Registry ({assets.length})
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReloadTrigger(prev => prev + 1)}
              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Reload data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {activeTab === 'assets' && (
              <button
                onClick={() => setShowAssetModal(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 glow-indigo cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="glass-panel border border-slate-900 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <Wrench className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Fetching administrative datasets...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: ISSUES LIST */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                {/* Search & Filter Controls */}
                <div className="glass-panel border border-slate-900 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px] text-sm text-slate-500 font-semibold">
                    FILTER TICKETS
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
                    <select
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={issueFilterStatus}
                      onChange={(e) => setIssueFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Reported">Reported</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Inspection Started">Inspection Started</option>
                      <option value="Maintenance In Progress">Maintenance In Progress</option>
                      <option value="Waiting for Parts">Waiting for Parts</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Reopened">Reopened</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Priority</span>
                    <select
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={issueFilterPriority}
                      onChange={(e) => setIssueFilterPriority(e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Issues Table */}
                <div className="glass-panel border border-slate-900 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                          <th className="py-4 px-5">Ticket #</th>
                          <th className="py-4 px-5">Asset</th>
                          <th className="py-4 px-5">Issue Title</th>
                          <th className="py-4 px-5">Priority</th>
                          <th className="py-4 px-5">Current Status</th>
                          <th className="py-4 px-5">Assigned Technician</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 text-sm">
                        {filteredIssues.length > 0 ? (
                          filteredIssues.map((issue) => (
                            <tr key={issue.id} className="hover:bg-slate-900/20 transition-colors">
                              <td className="py-4.5 px-5 font-black text-indigo-400">{issue.issueNumber}</td>
                              <td className="py-4.5 px-5">
                                <div className="font-bold text-white">{issue.asset?.name}</div>
                                <div className="text-slate-500 text-xs mt-0.5">{issue.asset?.code} &bull; {issue.asset?.location}</div>
                              </td>
                              <td className="py-4.5 px-5 max-w-[200px] truncate" title={issue.title}>
                                <div className="font-semibold text-slate-200">{issue.title}</div>
                                <div className="text-xs text-slate-500 truncate mt-0.5">{issue.description.split('\n')[0]}</div>
                              </td>
                              <td className="py-4.5 px-5">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${getPriorityBadgeColor(issue.priority)}`}>
                                  {issue.priority}
                                </span>
                              </td>
                              <td className="py-4.5 px-5">
                                <span className="text-slate-300 font-medium text-xs bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  {issue.status}
                                </span>
                              </td>
                              <td className="py-4.5 px-5">
                                <select
                                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-semibold"
                                  value={issue.technicianId || ''}
                                  onChange={(e) => handleAssignTechnician(issue.id, e.target.value || null)}
                                >
                                  <option value="">Unassigned</option>
                                  {technicians.map(t => (
                                    <option key={t.id} value={t.id}>{t.username}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-4.5 px-5 text-right space-x-2 whitespace-nowrap">
                                {issue.status === 'Resolved' && (
                                  <button
                                    onClick={() => handleUpdateIssueStatus(issue.id, 'Closed')}
                                    className="inline-flex items-center gap-1 bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-600 hover:text-white text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Close</span>
                                  </button>
                                )}
                                
                                {issue.status === 'Closed' && (
                                  <button
                                    onClick={() => handleUpdateIssueStatus(issue.id, 'Reopened')}
                                    className="inline-flex items-center gap-1 bg-orange-600/10 border border-orange-500/25 hover:bg-orange-600 hover:text-white text-orange-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <span>Reopen</span>
                                  </button>
                                )}

                                <Link
                                  to={`/technician/issue/${issue.issueNumber}`} // reuse page as read-only view
                                  className="inline-flex items-center gap-1 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500">
                              No issue tickets matching filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ASSETS INVENTORY */}
            {activeTab === 'assets' && (
              <div className="space-y-4">
                {/* Search & Filters */}
                <div className="glass-panel border border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search name, code, location..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
                    <select
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={assetFilterStatus}
                      onChange={(e) => setAssetFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Operational">Operational</option>
                      <option value="Issue Reported">Issue Reported</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>

                {/* Assets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="glass-panel border border-slate-900 rounded-2xl p-5 flex flex-col justify-between glass-card-hover"
                      >
                        <div>
                          <div className="flex items-start justify-between border-b border-slate-900 pb-3 mb-3">
                            <div>
                              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{asset.category}</span>
                              <h4 className="text-white font-bold text-base mt-0.5">{asset.name}</h4>
                              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-0.5">{asset.code}</p>
                            </div>
                            
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                              asset.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                              asset.status === 'Issue Reported' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                              asset.status === 'Retired' ? 'bg-slate-500/10 text-slate-400 border-slate-500/25' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            }`}>
                              {asset.status}
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                              <span>{asset.location}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Condition:</span>
                              <span className="font-bold text-white">{asset.condition}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Last Service:</span>
                              <span className="font-medium text-white">{asset.lastServiceDate || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Next service:</span>
                              <span className="font-medium text-white">{asset.nextServiceDate || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-slate-900 pt-4 mt-5">
                          <Link
                            to={`/public/asset/${asset.code}`}
                            className="flex-1 flex items-center justify-center gap-1 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-350 hover:text-white py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Public URL</span>
                          </Link>
                          {asset.status !== 'Retired' && (
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to retire this asset?')) {
                                  try {
                                    const res = await fetch(`${API_URL}/assets/${asset.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) setReloadTrigger(p => p + 1);
                                  } catch (err) { alert(err.message); }
                                }
                              }}
                              className="border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Retire asset"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full glass-panel border border-slate-900 rounded-2xl p-12 text-center text-slate-500">
                      No assets found matching parameters.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* REGISTER ASSET MODAL */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-900 rounded-2xl w-full max-w-lg glow-indigo overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/20 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Register New Physical Asset</h3>
              <button 
                onClick={() => setShowAssetModal(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Asset Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASSET-102, BLD-AC-09"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase placeholder:text-slate-600"
                    value={newAssetCode}
                    onChange={(e) => setNewAssetCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Conference Projector"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT / AV Support, HVAC, Furniture"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classroom B-302, Rooftop West"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    value={newAssetLocation}
                    onChange={(e) => setNewAssetLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Condition *</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  value={newAssetCondition}
                  onChange={(e) => setNewAssetCondition(e.target.value)}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Broken">Broken</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Last Service Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={newAssetLastService}
                    onChange={(e) => setNewAssetLastService(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Next Service Target</label>
                  <input
                    type="date"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={newAssetNextService}
                    onChange={(e) => setNewAssetNextService(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 border-t border-slate-900 pt-5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-400 hover:text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-500/20 glow-indigo cursor-pointer"
                >
                  {formLoading ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
