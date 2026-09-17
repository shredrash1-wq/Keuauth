import React from 'react';
import { AuditLog } from '../types';
import { Settings, ShieldAlert, Key, Database, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  logs: AuditLog[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ logs }) => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Settings & Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Configure REDZONE Auth administrator preferences and audit log history.</p>
      </div>

      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-red-500" />
          <span>REDZONE Database & Storage</span>
        </h3>
        <p className="text-slate-400 text-xs">
          REDZONE Auth is running with persistent memory storage and active SQLite/Express secure backend handlers.
        </p>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
            Status: Synchronized & Secure
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Complete Audit Log History</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${log.type === 'auth' ? 'bg-emerald-500' : log.type === 'license' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="text-slate-200 font-mono">{log.message}</span>
              </div>
              <div className="flex items-center gap-4">
                {log.ip && <span className="text-slate-500 font-mono">{log.ip}</span>}
                <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
