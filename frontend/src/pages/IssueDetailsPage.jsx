import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, MapPin, Calendar, Clock, AlertTriangle, Shield, CheckCircle2, 
  Wrench, Upload, MessageSquare, Clipboard, DollarSign, Brain, Sparkles, FileImage
} from 'lucide-react';

export default function IssueDetailsPage() {
  const { issueNumber } = useParams();
  const navigate = useNavigate();
  const { token, user, API_URL } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Maintenance Logging Form States
  const [notes, setNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [cost, setCost] = useState('');
  const [finalCondition, setFinalCondition] = useState('Good');
  const [nextServiceIntervalDays, setNextServiceIntervalDays] = useState('180');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchIssueDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/issues/${issueNumber}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Issue not found');
        }
        const data = await res.json();
        setIssue(data);
        
        // Pre-fill condition from asset if present
        if (data.asset) {
          setFinalCondition(data.asset.condition);
        }
      } catch (err) {
        setError(err.message || 'Could not fetch issue details.');
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetails();
  }, [issueNumber, token]);

  const handleUpdateStatus = async (status) => {
    try {
      const res = await fetch(`${API_URL}/issues/${issue.id}/status`, {
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

      const updated = await res.json();
      setIssue(prev => ({ ...prev, status: updated.status, asset: { ...prev.asset, status: updated.status === 'Inspection Started' ? 'Under Inspection' : 'Under Maintenance' } }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const handleResolveIssue = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!notes || !finalCondition) {
      setFormError('Please fill out notes and final condition.');
      return;
    }

    const parsedCost = parseFloat(cost || 0);
    if (parsedCost < 0) {
      setFormError('Maintenance cost cannot be negative.');
      return;
    }

    setFormLoading(true);

    try {
      const formData = new FormData();
      formData.append('issueId', issue.id);
      formData.append('notes', notes);
      formData.append('partsReplaced', partsReplaced);
      formData.append('cost', parsedCost);
      formData.append('finalCondition', finalCondition);
      formData.append('nextServiceIntervalDays', nextServiceIntervalDays);
      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      const res = await fetch(`${API_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit maintenance log.');
      }

      alert('Maintenance logged and issue resolved successfully!');
      
      // Go back to dashboard
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/technician/dashboard');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setFormLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-rose-450';
      case 'High': return 'text-orange-450';
      case 'Medium': return 'text-amber-450';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Wrench className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading ticket records...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Ticket Error</h1>
        <p className="text-slate-400 max-w-md mb-8">{error || 'Unable to load ticket details.'}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-indigo-600 hover:bg-indigo-505 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isAssignedTech = issue.technicianId === user.id;
  const canUpdate = user.role === 'admin' || isAssignedTech;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400 uppercase tracking-wider">
          Work Order {issue.issueNumber}
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Ticket Details & AI Sugesstion Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="glass-panel border border-slate-900 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-4">
              <div>
                <span className="text-xs font-black text-indigo-400">{issue.issueNumber}</span>
                <h1 className="text-2xl font-extrabold text-white mt-1">{issue.title}</h1>
                <p className="text-slate-400 text-xs mt-1">Reporter: <span className="text-white font-semibold">{issue.reporterName}</span> ({issue.reporterEmail})</p>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
                <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-200">
                  {issue.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Complaint Description</h4>
              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900/20 border border-slate-900 p-3.5 rounded-xl">
                <span className="text-slate-550 block font-semibold uppercase mb-1">Priority</span>
                <span className={`font-bold text-sm ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
              </div>
              
              <div className="bg-slate-900/20 border border-slate-900 p-3.5 rounded-xl">
                <span className="text-slate-550 block font-semibold uppercase mb-1">Category</span>
                <span className="font-bold text-white text-sm">{issue.category}</span>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 p-3.5 rounded-xl">
                <span className="text-slate-550 block font-semibold uppercase mb-1">Assigned Technician</span>
                <span className="font-bold text-white text-sm">{issue.technician?.username || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* AI Suggestions Card */}
          {issue.aiSuggestedFields && (
            <div className="glass-panel border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
              {/* Background gradient hint */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span>AI Diagnostics Log</span>
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-350 px-2.5 py-0.5 rounded-full">
                  Gemini Triage
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase">AI Response Source</span>
                  <p className="text-white font-medium mt-0.5">{issue.aiSuggestedFields.source}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-semibold block uppercase">Original Suggested Category</span>
                    <p className="text-slate-350 font-medium mt-0.5">{issue.aiSuggestedFields.originalCategory}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block uppercase">Original Suggested Priority</span>
                    <p className="text-slate-350 font-medium mt-0.5">{issue.aiSuggestedFields.originalPriority}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block uppercase">User Edited AI Recommendations?</span>
                  <span className={`inline-block px-2 py-0.5 rounded-md mt-1 font-bold ${issue.aiSuggestedFields.userEdited ? 'bg-amber-550/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {issue.aiSuggestedFields.userEdited ? 'Yes (Edits Performed)' : 'No (AI Output Accepted Directly)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Previous Maintenance Logs for this ticket */}
          {issue.maintenanceRecords && issue.maintenanceRecords.length > 0 && (
            <div className="glass-panel border border-slate-900 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-indigo-400" />
                <span>Technician Repair Logs ({issue.maintenanceRecords.length})</span>
              </h3>

              <div className="space-y-4">
                {issue.maintenanceRecords.map(rec => (
                  <div key={rec.id} className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-400 font-bold">Tech: {rec.technician?.username}</span>
                      <span className="text-slate-550">{new Date(rec.completedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm italic">"{rec.notes}"</p>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-900 pt-3">
                      <div>
                        <span className="text-slate-500 block font-semibold">Parts Replaced</span>
                        <span className="text-white">{rec.partsReplaced || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-slate-550 dark:text-slate-500 block font-semibold">Cost</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">Rs. {parseFloat(rec.cost).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold">Final Condition</span>
                        <span className="text-white">{rec.finalCondition}</span>
                      </div>
                    </div>
                    {rec.evidenceUrl && (
                      <div className="mt-3">
                        <span className="text-slate-500 text-xs block font-semibold mb-1">Evidence Media</span>
                        <a 
                          href={`${API_URL.replace('/api', '')}${rec.evidenceUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-350"
                        >
                          <FileImage className="w-3.5 h-3.5" />
                          <span>View Evidence File</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Work Order Actions & Asset Quick details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Asset Info Card */}
          {issue.asset && (
            <div className="glass-panel border border-slate-900 rounded-2xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-900 pb-2 mb-3">Asset Target</h3>
              <h2 className="text-lg font-bold text-white">{issue.asset.name}</h2>
              <p className="text-slate-500 text-xs font-bold uppercase mt-0.5">{issue.asset.code}</p>
              
              <div className="space-y-2 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{issue.asset.location}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-2">
                  <span>Current Status:</span>
                  <span className="font-bold text-white">{issue.asset.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Status Actions */}
          {canUpdate && issue.status !== 'Resolved' && issue.status !== 'Closed' && (
            <div className="glass-panel border border-slate-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Stage Actions</h3>
              
              {issue.status === 'Assigned' && (
                <button
                  onClick={() => handleUpdateStatus('Inspection Started')}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-550 text-white font-semibold py-3 rounded-xl text-xs transition-all cursor-pointer shadow shadow-indigo-500/10 glow-indigo"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Begin Inspection</span>
                </button>
              )}

              {issue.status === 'Inspection Started' && (
                <button
                  onClick={() => handleUpdateStatus('Maintenance In Progress')}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-550 text-white font-semibold py-3 rounded-xl text-xs transition-all cursor-pointer shadow shadow-indigo-500/10 glow-indigo"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Begin Repair Work</span>
                </button>
              )}

              {issue.status !== 'Waiting for Parts' && (issue.status === 'Inspection Started' || issue.status === 'Maintenance In Progress') && (
                <button
                  onClick={() => handleUpdateStatus('Waiting for Parts')}
                  className="w-full border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Mark: Waiting for Parts
                </button>
              )}

              {issue.status === 'Waiting for Parts' && (
                <button
                  onClick={() => handleUpdateStatus('Maintenance In Progress')}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-550 text-white font-semibold py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Resume Repairs</span>
                </button>
              )}
            </div>
          )}

          {/* RESOLUTION/MAINTENANCE LOG FORM */}
          {canUpdate && (issue.status === 'Inspection Started' || issue.status === 'Maintenance In Progress' || issue.status === 'Waiting for Parts') && (
            <div className="glass-panel border border-slate-900 rounded-2xl p-5 glow-indigo">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 border-b border-slate-900 pb-2 mb-4">Complete Work Order</h3>
              
              <form onSubmit={handleResolveIssue} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Work / Repair Notes *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter what diagnostic was completed..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Parts Replaced</label>
                  <input
                    type="text"
                    placeholder="e.g. HDMI Cable, Fan belt"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Parts/Repair Cost *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-550 dark:text-slate-500">Rs.</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Final Asset State *</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={finalCondition}
                      onChange={(e) => setFinalCondition(e.target.value)}
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Broken">Broken</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Next Service Target</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={nextServiceIntervalDays}
                      onChange={(e) => setNextServiceIntervalDays(e.target.value)}
                    >
                      <option value="30">In 30 Days (1 Month)</option>
                      <option value="90">In 90 Days (3 Months)</option>
                      <option value="180">In 180 Days (6 Months)</option>
                      <option value="365">In 365 Days (1 Year)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Upload Media Evidence</label>
                  <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative transition-all">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    {evidencePreview ? (
                      <div className="text-center">
                        <img 
                          src={evidencePreview} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded-lg mx-auto mb-2 border border-slate-800" 
                        />
                        <span className="text-[10px] text-slate-400 truncate block max-w-[150px]">{evidenceFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-500 mb-1.5" />
                        <span className="text-[10px] text-slate-400 text-center font-medium">Click or Drag Image / Video</span>
                        <span className="text-[9px] text-slate-650 block mt-0.5">JPEG, PNG, WEBP, MP4 (max 5MB)</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-550 hover:to-emerald-450 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formLoading ? 'Completing...' : 'Log & Mark Resolved'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
