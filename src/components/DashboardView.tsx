import React from 'react';
import { Application, LicenseKey, AuthUser, AuditLog } from '../types';
import { Users, KeyRound, ShieldCheck, Activity, Copy, Check, ExternalLink, ArrowUpRight, Cpu } from 'lucide-react';

interface DashboardViewProps {
  selectedApp: Application | null;
  licenses: LicenseKey[];
  users: AuthUser[];
  logs: AuditLog[];
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ selectedApp, licenses, users, logs, onNavigate }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  if (!selectedApp) return <div className="p-8 text-slate-400">No application selected.</div>;

  const appLicenses = licenses.filter(l => l.appId === selectedApp.id);
  const appUsers = users.filter(u => u.appId === selectedApp.id);
  const unusedKeys = appLicenses.filter(l => l.status === 'unused').length;
  const usedKeys = appLicenses.filter(l => l.status === 'used').length;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/40 border border-red-950/60 p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-mono mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Active App: {selectedApp.name} (v{selectedApp.version})</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              REDZONE Auth Developer Console
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Manage licenses, HWID locks, subscriptions, and real-time client authentication endpoints securely.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('licenses')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all"
            >
              Generate Keys
            </button>
            <button
              onClick={() => onNavigate('apidocs')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-all"
            >
              View API Docs
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-red-950/40 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-extrabold text-white mt-2">{appUsers.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span>+12% this week</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-red-950/40 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Licenses</p>
              <p className="text-3xl font-extrabold text-white mt-2">{usedKeys}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>{unusedKeys} unused keys available</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-red-950/40 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">App Status</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-2 capitalize">{selectedApp.status}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Encrypted endpoints active</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-red-950/40 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">API Requests</p>
              <p className="text-3xl font-extrabold text-white mt-2">1,482</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span>99.99% Uptime</span>
          </div>
        </div>
      </div>

      {/* Credentials Card */}
      <div className="bg-slate-900/90 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>Application API Credentials</span>
          <span className="text-xs font-mono font-normal text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-900/50">Required for SDK / API</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">Application Name</span>
              <button onClick={() => copyToClipboard(selectedApp.name, 'name')} className="text-slate-400 hover:text-white">
                {copied === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="font-mono text-sm text-slate-200">{selectedApp.name}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">Owner ID</span>
              <button onClick={() => copyToClipboard(selectedApp.ownerid, 'ownerid')} className="text-slate-400 hover:text-white">
                {copied === 'ownerid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="font-mono text-sm text-slate-200">{selectedApp.ownerid}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">Application Secret</span>
              <button onClick={() => copyToClipboard(selectedApp.secret, 'secret')} className="text-slate-400 hover:text-white">
                {copied === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="font-mono text-sm text-red-400 truncate">{selectedApp.secret}</p>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-slate-900/90 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Recent Authentication & License Activity</h3>
          <button onClick={() => onNavigate('settings')} className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1">
            <span>View All Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${log.type === 'auth' ? 'bg-emerald-500' : log.type === 'license' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="text-slate-300 font-mono text-xs">{log.message}</span>
              </div>
              <div className="flex items-center gap-4">
                {log.ip && <span className="text-xs text-slate-500 font-mono hidden sm:inline">{log.ip}</span>}
                <span className="text-xs text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
