import React, { useState } from 'react';
import { Application } from '../types';
import { KeyRound, ShieldCheck, Download, LogOut, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ClientAuthPortalProps {
  applications: Application[];
}

export const ClientAuthPortal: React.FC<ClientAuthPortalProps> = ({ applications }) => {
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [licenseKey, setLicenseKey] = useState('');
  const [hwid, setHwid] = useState('HWID-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{
    username: string;
    subscriptions: { subscription: string; expiry: string; level: number }[];
    ip: string;
    hwid: string;
    createdate: string;
    lastlogin: string;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const app = applications.find(a => a.id === selectedAppId);

    try {
      const res = await fetch('/api/v1/client/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'license',
          key: licenseKey,
          name: app?.name || 'RedZone Loader v2',
          ownerid: app?.ownerid || 'usr_redzone_admin',
          hwid: hwid
        })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.userinfo);
      } else {
        setError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setError('Failed to connect to REDZONE Auth server.');
    } finally {
      setLoading(false);
    }
  };

  const currentApp = applications.find(a => a.id === selectedAppId);

  if (session) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Welcome, {session.username}!</h1>
                <p className="text-xs text-emerald-400 font-mono">REDZONE Auth Client Session Active</p>
              </div>
            </div>
            <button
              onClick={() => setSession(null)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Hardware ID (HWID)</span>
              <span className="font-mono text-xs text-slate-200 break-all">{session.hwid}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Client IP Address</span>
              <span className="font-mono text-xs text-slate-200">{session.ip}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Subscriptions</h3>
            {session.subscriptions.map((sub, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-xl border border-red-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white text-sm">{sub.subscription}</p>
                  <p className="text-xs text-slate-400 font-mono">Expires: {new Date(sub.expiry).toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-mono font-bold self-start sm:self-auto">
                  Level {sub.level} Access
                </span>
              </div>
            ))}
          </div>

          {currentApp?.downloadLink && (
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Application Loader Build Ready</p>
                <p className="text-xs text-slate-400">Download the protected binary for {currentApp.name}</p>
              </div>
              <a
                href={currentApp.downloadLink}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-950 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Loader</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-md mx-auto min-h-[80vh] flex flex-col justify-center">
      <div className="bg-slate-900 border border-red-950/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto mb-3 shadow-lg shadow-red-950">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">REDZONE Client Auth</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your license key to authenticate and access software.</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Application</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name} (v{app.version})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">License Key</label>
            <input
              type="text"
              required
              placeholder="REDZONE-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Hardware ID (HWID)</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={hwid}
                onChange={(e) => setHwid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <button
                type="button"
                onClick={() => setHwid('HWID-' + Math.random().toString(36).substring(2, 8).toUpperCase())}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                title="Regenerate HWID"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Authenticate License'}
          </button>
        </form>
      </div>
    </div>
  );
};
