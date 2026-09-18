import React, { useState } from 'react';
import { Application, LicenseKey } from '../types';
import { Terminal, X, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  licenses: LicenseKey[];
}

export const ApiTesterModal: React.FC<ApiTesterModalProps> = ({ isOpen, onClose, applications, licenses }) => {
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [keyInput, setKeyInput] = useState(licenses.find(l => l.status === 'unused')?.key || '');
  const [hwidInput, setHwidInput] = useState('HWID-REDZONE-CLIENT-991');
  const [responseResult, setResponseResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTestAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseResult(null);

    const app = applications.find(a => a.id === selectedAppId);

    try {
      let res: Response;
      try {
        res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'license',
            key: keyInput,
            name: app?.name || 'Redzone',
            ownerid: app?.ownerid || 'usr_yedagf',
            hwid: hwidInput
          })
        });
      } catch {
        res = await fetch('/api/v1/client/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'license',
            key: keyInput,
            name: app?.name || 'Redzone',
            ownerid: app?.ownerid || 'usr_yedagf',
            hwid: hwidInput
          })
        });
      }
      const data = await res.json();
      setResponseResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseResult(JSON.stringify({ 
        success: false, 
        message: `Unable to connect to Redzone authentication server: ${err.message || 'Network request failed'}` 
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-950/80 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">REDZONE Auth Client API Tester</h3>
            <p className="text-xs text-slate-400">Simulate client-side license authentication requests against the backend REST endpoint.</p>
          </div>
        </div>

        <form onSubmit={handleTestAuth} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Application</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Hardware ID (HWID)</label>
              <input
                type="text"
                value={hwidInput}
                onChange={(e) => setHwidInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">License Key</label>
            <input
              type="text"
              required
              placeholder="REDZONE-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-red-950 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? 'Authenticating...' : 'Send Auth Request'}</span>
            </button>
          </div>
        </form>

        {responseResult && (
          <div className="mt-6">
            <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Response JSON:</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
              <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                <code>{responseResult}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
