import React, { useState, useEffect } from 'react';
import { LicenseKey, Application } from '../types';
import { KeyRound, Plus, Trash2, Copy, Check, Lock, Unlock, Ban, Snowflake, Flame, AppWindow, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface LicensesViewProps {
  licenses: LicenseKey[];
  applications: Application[];
  selectedApp: Application | null;
  onGenerateKeys: (appId: string, count: number, durationDays: number, level: number, note: string) => Promise<void> | void;
  onRefresh: () => void;
}

export const LicensesView: React.FC<LicensesViewProps> = ({ licenses, applications, selectedApp, onGenerateKeys, onRefresh }) => {
  const [count, setCount] = useState(1);
  const [durationDays, setDurationDays] = useState(30);
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Application selection for key generation
  const [targetAppId, setTargetAppId] = useState<string>(selectedApp?.id || applications[0]?.id || 'app_default');
  
  // Filter for table
  const [filterAppId, setFilterAppId] = useState<string>(selectedApp?.id || 'all');

  useEffect(() => {
    if (selectedApp?.id) {
      setTargetAppId(selectedApp.id);
      setFilterAppId(selectedApp.id);
    } else if (applications[0]?.id && (!targetAppId || targetAppId === 'app_default')) {
      setTargetAppId(applications[0].id);
    }
  }, [selectedApp, applications]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);
    const effectiveAppId = targetAppId || selectedApp?.id || applications[0]?.id || 'app_default';
    const safeCount = Math.max(1, Math.min(100, Math.floor(Number(count) || 1)));
    const safeDays = Math.max(1, Math.floor(Number(durationDays) || 30));
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));

    setGenerating(true);
    try {
      await onGenerateKeys(effectiveAppId, safeCount, safeDays, safeLevel, (note || '').trim());
      const appName = applications.find(a => a.id === effectiveAppId)?.name || 'Default App';
      setStatusFeedback({
        type: 'success',
        message: `Generated ${safeCount} license key(s) successfully for ${appName}!`
      });
      setNote('');
      setTimeout(() => setStatusFeedback(null), 5000);
    } catch (err: any) {
      console.error("License generation error:", err);
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Failed to generate license keys.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/v1/licenses/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        onRefresh();
      } else {
        onRefresh();
      }
    } catch (err) {
      console.warn('Failed license action:', err);
      onRefresh();
    }
  };

  const copyToClipboard = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLicenses = filterAppId === 'all' 
    ? licenses 
    : licenses.filter(l => l.appId === filterAppId);

  const getAppName = (appId: string) => {
    const found = applications.find(a => a.id === appId);
    return found ? found.name : 'Default App';
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">License Key Manager</h1>
        <p className="text-slate-400 text-sm mt-1">Generate and control license keys with full action suite (Delete, Lock HWID, Unlock HWID, Ban, Freeze).</p>
      </div>

      {/* Feedback Alerts */}
      {statusFeedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-lg ${
          statusFeedback.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300' 
            : 'bg-red-950/70 border border-red-800 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-xs underline hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Generator Card */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-red-500" />
          <span>Quick License Generator</span>
        </h3>
        <form onSubmit={handleGenerate} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Target Application Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <AppWindow className="w-3.5 h-3.5 text-red-500" />
                <span>Target Application *</span>
              </label>
              <select
                value={targetAppId}
                onChange={(e) => setTargetAppId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {applications.length === 0 ? (
                  <option value="app_default">Default App</option>
                ) : (
                  applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.name} (v{app.version})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={count}
                onChange={(e) => {
                  const val = e.target.value;
                  setCount(val === '' ? ('' as any) : Number(val));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Days)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={durationDays}
                onChange={(e) => {
                  const val = e.target.value;
                  setDurationDays(val === '' ? ('' as any) : Number(val));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-1">
            {/* Access Level */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Access Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value={1}>Level 1 (Standard)</option>
                <option value={2}>Level 2 (VIP)</option>
                <option value={3}>Level 3 (Owner)</option>
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. VIP Key / Tournament"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{generating ? 'Generating...' : 'Generate Key(s)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-red-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-sm">License Keys ({filteredLicenses.length})</h3>
            <button 
              onClick={onRefresh}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Refresh licenses"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter by Application */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter App:</span>
            <select
              value={filterAppId}
              onChange={(e) => setFilterAppId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500/50"
            >
              <option value="all">All Applications</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-950/50">
                <th className="p-4">Key</th>
                <th className="p-4">Application</th>
                <th className="p-4">Status</th>
                <th className="p-4">Level</th>
                <th className="p-4">Duration</th>
                <th className="p-4">HWID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No license keys found for this application filter. Use the generator above to create some.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-200 text-xs flex items-center gap-2">
                      <span className="font-semibold">{lic.key}</span>
                      <button
                        onClick={() => copyToClipboard(lic.key)}
                        className="text-slate-400 hover:text-white"
                        title="Copy Key"
                      >
                        {copiedKey === lic.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                        {getAppName(lic.appId)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                        lic.status === 'unused' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        lic.status === 'used' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        lic.status === 'frozen' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-300">Lvl {lic.level}</td>
                    <td className="p-4 font-mono text-xs text-slate-300">{lic.durationDays}D</td>
                    <td className="p-4 font-mono text-xs text-slate-400 truncate max-w-[120px]">{lic.hwid || 'Unbound'}</td>
                    <td className="p-4 text-right space-x-1.5">
                      {lic.hwid ? (
                        <button
                          onClick={() => handleKeyAction(lic.id, 'unlock')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-all"
                          title="Unlock HWID"
                        >
                          <Unlock className="w-3 h-3 inline mr-1" /> Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleKeyAction(lic.id, 'lock')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-all"
                          title="Lock HWID"
                        >
                          <Lock className="w-3 h-3 inline mr-1" /> Lock
                        </button>
                      )}
                      {lic.status === 'frozen' ? (
                        <button
                          onClick={() => handleKeyAction(lic.id, 'unfreeze')}
                          className="px-2 py-1 bg-blue-950/50 hover:bg-blue-900/60 text-blue-400 rounded text-xs transition-all"
                          title="Unfreeze Key"
                        >
                          Unfreeze
                        </button>
                      ) : (
                        <button
                          onClick={() => handleKeyAction(lic.id, 'freeze')}
                          className="px-2 py-1 bg-blue-950/50 hover:bg-blue-900/60 text-blue-400 rounded text-xs transition-all"
                          title="Freeze Key"
                        >
                          <Snowflake className="w-3 h-3 inline mr-1" /> Freeze
                        </button>
                      )}
                      {lic.status === 'banned' ? (
                        <button
                          onClick={() => handleKeyAction(lic.id, 'unfreeze')}
                          className="px-2 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 rounded text-xs transition-all"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleKeyAction(lic.id, 'ban')}
                          className="px-2 py-1 bg-amber-950/50 hover:bg-amber-900/60 text-amber-400 rounded text-xs transition-all"
                          title="Ban Key"
                        >
                          <Ban className="w-3 h-3 inline mr-1" /> Ban
                        </button>
                      )}
                      <button
                        onClick={() => handleKeyAction(lic.id, 'delete')}
                        className="p-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded transition-all inline-block"
                        title="Delete Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
