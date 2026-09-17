import React from 'react';
import { WebhookConfig, Application } from '../types';
import { Webhook, Plus, CheckCircle, Radio } from 'lucide-react';

interface WebhooksViewProps {
  webhooks: WebhookConfig[];
  selectedApp: Application | null;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ webhooks, selectedApp }) => {
  const filtered = webhooks.filter(w => !selectedApp || w.appId === selectedApp.id);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Discord Webhooks</h1>
          <p className="text-slate-400 text-sm mt-1">Configure Discord event alerts for user registrations, logins, and key redemptions.</p>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((wh) => (
          <div key={wh.id} className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                <Webhook className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg">{wh.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                    Active
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-400 mt-1 truncate max-w-md">{wh.url}</p>
                <div className="flex items-center gap-2 mt-3">
                  {wh.events.map((ev, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 capitalize">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all">
                Test Webhook
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
