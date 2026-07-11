import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Wrench, ShieldAlert, Sparkles, Send, ArrowLeft, Brain, User, Mail, AlertTriangle } from 'lucide-react';

export default function ReportIssuePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assetError, setAssetError] = useState('');

  // Reporter Fields
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [complaint, setComplaint] = useState('');

  // AI Triage State
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [aiResponseSource, setAiResponseSource] = useState('');

  // Form Fields (initialized with AI suggestions, but editable)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [possibleCauses, setPossibleCauses] = useState('');
  const [initialChecks, setInitialChecks] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`${API_URL}/assets/public/${code}`);
        if (!res.ok) throw new Error('Asset not found');
        const data = await res.json();
        setAsset(data);
      } catch (err) {
        setAssetError(err.message || 'Could not resolve asset.');
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [code]);

  const handleRunTriage = async (e) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    setTriageLoading(true);
    setTriageData(null);
    try {
      const res = await fetch(`${API_URL}/ai/triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: asset.id,
          complaint: complaint
        })
      });

      if (!res.ok) {
        throw new Error('AI Triage request failed.');
      }

      const data = await res.json();
      setAiResponseSource(data.source);
      
      const details = data.triage;
      setTriageData(details);

      // Pre-fill editable fields
      setTitle(details.title);
      setCategory(details.category);
      setPriority(details.priority);
      setPossibleCauses(details.possibleCauses.join('\n'));
      setInitialChecks(details.initialChecks.join('\n'));
      setWarning(details.recurringPatternWarning);
    } catch (err) {
      console.error(err);
      // Fail gracefully: manually prefill simple defaults
      setAiResponseSource('Local Failback System');
      setTitle(`Equipment issue with ${asset.name}`);
      setCategory(asset.category || 'General');
      setPriority('Medium');
      setPossibleCauses('Hardware wear / general malfunction');
      setInitialChecks('Perform visual inspection\nReport to administration');
      setTriageData({});
    } finally {
      setTriageLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!title || !category || !reporterName || !reporterEmail) return;

    setSubmitting(true);
    try {
      // Determine if the user edited any fields compared to AI suggestions
      const isEdited = triageData && (
        title !== triageData.title ||
        category !== triageData.category ||
        priority !== triageData.priority ||
        possibleCauses !== triageData.possibleCauses?.join('\n') ||
        initialChecks !== triageData.initialChecks?.join('\n')
      );

      const aiSuggestedFields = triageData ? {
        originalTitle: triageData.title,
        originalCategory: triageData.category,
        originalPriority: triageData.priority,
        originalCauses: triageData.possibleCauses,
        originalChecks: triageData.initialChecks,
        source: aiResponseSource,
        userEdited: !!isEdited
      } : null;

      const res = await fetch(`${API_URL}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: asset.id,
          title,
          description: `${complaint}\n\n[Possible Causes]:\n${possibleCauses}\n\n[Initial Checks]:\n${initialChecks}`,
          priority,
          category,
          reporterName,
          reporterEmail,
          aiSuggestedFields
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit issue');
      }

      const savedIssue = await res.json();
      alert(`Issue successfully submitted! Issue Number: ${savedIssue.issueNumber}`);
      navigate(`/public/asset/${code}`);
    } catch (err) {
      alert(err.message || 'Error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center text-slate-800 dark:text-slate-100">
        <Wrench className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Validating asset link...</p>
      </div>
    );
  }

  if (assetError || !asset) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center text-slate-800 dark:text-slate-100">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Asset URL</h1>
        <p className="text-slate-550 dark:text-slate-400 max-w-md mb-8">
          This reporting link is invalid. Please scan the QR code again or contact administrative support.
        </p>
        <Link to="/" className="bg-indigo-650 hover:bg-indigo-550 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link to={`/public/asset/${code}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to {asset.code}</span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 uppercase tracking-wider">
          Report Issue
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-6 mt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Report Equipment Issue</h1>
          <p className="text-slate-400 text-sm mt-1">Submit maintenance request for <span className="text-indigo-400 font-bold">{asset.name}</span> ({asset.code})</p>
        </div>

        {/* Step 1: Write Complaint & Trigger Triage */}
        {!triageData && !triageLoading && (
          <div className="glass-panel border border-slate-205 dark:border-slate-900 rounded-2xl p-6 glow-indigo animate-fade-in">
            <form onSubmit={handleRunTriage} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-650"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Your Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@domain.com"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-650"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Describe the Issue</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Example: The projector display is flickering and sometimes does not detect HDMI. Also, it makes a humming noise."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl py-3.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Brain className="w-5 h-5" />
                <span>Run AI Issue Triage</span>
              </button>
            </form>
          </div>
        )}

        {/* AI Loading State */}
        {triageLoading && (
          <div className="glass-panel border border-slate-200 dark:border-slate-900 rounded-2xl p-10 flex flex-col items-center justify-center text-center animate-pulse">
            <div className="relative mb-6">
              <Brain className="w-16 h-16 text-indigo-500 animate-bounce" />
              <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1.5 -right-1.5 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Complaint Context</h2>
            <p className="text-slate-550 dark:text-slate-400 text-sm max-w-sm">
              We are leveraging Gemini AI to translate your natural language report into diagnostic inputs (structured title, priority classification, possible causes, and safety checks).
            </p>
          </div>
        )}

        {/* Step 2: Display AI Results & User Override Form */}
        {triageData && !triageLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* Banner detailing AI source */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-indigo-300 font-semibold">Triage engine source: <span className="font-bold text-white">{aiResponseSource}</span></span>
              </div>
              <span className="text-[10px] uppercase font-extrabold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full">AI Output</span>
            </div>

            {warning && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider">Asset Alert</h4>
                  <p className="text-amber-300 text-xs mt-0.5 leading-relaxed">{warning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleFinalSubmit} className="glass-panel border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-900 pb-3">Verify & Edit Diagnostics</h3>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">AI-Generated Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-semibold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Category Selection</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Suggested Priority</label>
                  <select
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 mb-2">Possible Causes (One per line)</label>
                <textarea
                  rows={3}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-mono placeholder:text-slate-405 dark:placeholder:text-slate-650"
                  value={possibleCauses}
                  onChange={(e) => setPossibleCauses(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 mb-2">Safe Initial Checks (One per line)</label>
                <textarea
                  rows={3}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-mono placeholder:text-slate-405 dark:placeholder:text-slate-655"
                  value={initialChecks}
                  onChange={(e) => setInitialChecks(e.target.value)}
                />
              </div>

              <div className="flex gap-4 border-t border-slate-900 pt-5">
                <button
                  type="button"
                  onClick={() => setTriageData(null)}
                  className="flex-1 border border-slate-800 hover:border-rose-500/40 bg-slate-900/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer"
                >
                  Reject & Re-write
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-550 hover:to-emerald-450 text-white font-semibold rounded-xl py-3 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Confirm & File Report'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
