import React, { useState } from 'react';
import { LicenseKey, Application } from '../types';
import { KeyRound, Plus, Trash2, Copy, Check, Shield } from 'lucide-react';

interface LicensesViewProps {
  licenses: LicenseKey[];
  applications: Application[];
  selectedApp: Application | null;
  onGenerateKeys: (appId: string, count: number, durationDays: number, level: number, note: string) => void;
  onDeleteKey: (id: string) => void;
}

export const LicensesView: React.FC<LicensesViewProps> = ({ licenses, applications, selectedApp, onGenerateKeys, onDeleteKey }) => {
  const [count, setCount] = useState(1);
  const [durationDays, setDurationDays] = useState(30);
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const appId = selectedApp?.id || applications[0]?.id || 'app_default';

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateKeys(appId, count, durationDays, level, note);
    setNote('');
  };

  const copyToClipboard = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLicenses = licenses.filter(l => l.appId === appId);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">License Key Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Generate, revoke, and manage HWID-bound license keys for {selectedApp?.name || 'RedZone App'}.</p>
        </div>
      </div>

      {/* Generator Card */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-red-500" />
          <span>Quick License Generator</span>
        </h3>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Days)</label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Access Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value={1}>Level 1 (Standard)</option>
              <option value={2}>Level 2 (VIP)</option>
              <option value={3}>Level 3 (Owner/Developer)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Giveaway key"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Key(s)</span>
          </button>
        </form>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-red-950/40 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Active & Unused Keys ({filteredLicenses.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-950/50">
                <th className="p-4">License Key</th>
                <th className="p-4">Status</th>
                <th className="p-4">Level</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Bound HWID</th>
                <th className="p-4">Used By</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No license keys generated yet. Use the generator above to create your first key.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-200 text-xs flex items-center gap-2">
                      <span>{lic.key}</span>
                      <button
                        onClick={() => copyToClipboard(lic.key)}
                        className="text-slate-400 hover:text-white"
                        title="Copy Key"
                      >
                        {copiedKey === lic.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                        lic.status === 'unused' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        lic.status === 'used' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-300">Level {lic.level}</td>
                    <td className="p-4 font-mono text-xs text-slate-300">{lic.durationDays} Days</td>
                    <td className="p-4 font-mono text-xs text-slate-400 truncate max-w-[140px]">{lic.hwid || 'Unbound'}</td>
                    <td className="p-4 text-xs text-slate-300">{lic.usedBy || '-'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onDeleteKey(lic.id)}
                        className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-all"
                        title="Delete Key"
                      >
                        <Trash2 className="w-4 h-4" />
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
