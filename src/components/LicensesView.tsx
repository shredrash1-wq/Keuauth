import React, { useState } from 'react';
import { LicenseKey, Application } from '../types';
import { KeyRound, Plus, Copy, Check, Trash2, Search, Filter, Download } from 'lucide-react';

interface LicensesViewProps {
  licenses: LicenseKey[];
  applications: Application[];
  selectedApp: Application | null;
  onGenerateKeys: (appId: string, count: number, durationDays: number, level: number, note: string) => void;
  onDeleteKey: (id: string) => void;
}

export const LicensesView: React.FC<LicensesViewProps> = ({ licenses, applications, selectedApp, onGenerateKeys, onDeleteKey }) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [count, setCount] = useState(5);
  const [durationDays, setDurationDays] = useState(30);
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used' | 'banned'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredLicenses = licenses.filter(k => {
    if (selectedApp && k.appId !== selectedApp.id) return false;
    if (statusFilter !== 'all' && k.status !== statusFilter) return false;
    if (searchTerm && !k.key.toLowerCase().includes(searchTerm.toLowerCase()) && !k.note?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    onGenerateKeys(selectedApp.id, count, durationDays, level, note);
    setShowGenerateModal(false);
    setNote('');
  };

  const copyKeyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportAllKeys = () => {
    const text = filteredLicenses.map(k => `${k.key} | Days: ${k.durationDays} | Level: ${k.level} | Status: ${k.status}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redzone-keys-${selectedApp?.name || 'export'}.txt`;
    a.click();
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">License Key Management</h1>
          <p className="text-slate-400 text-sm mt-1">Generate, track, and revoke REDZONE Auth software license keys.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportAllKeys}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-red-950/60 text-slate-300 font-medium text-sm rounded-xl transition-all"
          >
            <Download className="w-4 h-4 text-red-500" />
            <span>Export Keys</span>
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Keys</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search key or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'unused', 'used', 'banned'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-red-600/20 border border-red-500/40 text-red-400 shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-red-950/60 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">License Key</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Level</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Used By / HWID</th>
                <th className="py-4 px-6">Note</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No license keys found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{k.key}</span>
                        <button onClick={() => copyKeyText(k.key)} className="text-slate-400 hover:text-white">
                          {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{k.durationDays} Days</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-mono font-bold">
                        Lvl {k.level}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
                        k.status === 'unused' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' :
                        k.status === 'used' ? 'bg-blue-950/40 text-blue-400 border border-blue-500/30' :
                        'bg-red-950/40 text-red-400 border border-red-500/30'
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                      {k.usedBy ? (
                        <div>
                          <p className="text-slate-200 font-bold">{k.usedBy}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{k.hwid || 'No HWID'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600">Unclaimed</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs italic">{k.note || '-'}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onDeleteKey(k.id)}
                        className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-red-400 transition-colors"
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

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-950/80 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Generate REDZONE License Keys</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Application</label>
                <input
                  type="text"
                  disabled
                  value={selectedApp?.name || 'Selected App'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">License Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <option value={1}>Level 1 (Standard)</option>
                  <option value={2}>Level 2 (VIP / Pro)</option>
                  <option value={3}>Level 3 (Enterprise / Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Note / Batch Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Discord Giveaway Batch #4"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-red-950 transition-all"
                >
                  Generate {count} Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
