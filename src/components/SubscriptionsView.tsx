import React from 'react';
import { SubscriptionPlan, Application } from '../types';
import { CreditCard, Shield, Sparkles } from 'lucide-react';

interface SubscriptionsViewProps {
  subscriptions: SubscriptionPlan[];
  selectedApp: Application | null;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ subscriptions, selectedApp }) => {
  const filtered = subscriptions.filter(s => !selectedApp || s.appId === selectedApp.id);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Subscription Tiers</h1>
          <p className="text-slate-400 text-sm mt-1">Configure access levels and default durations for your application licenses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((sub) => (
          <div key={sub.id} className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs font-bold">
                  Level {sub.level} Access
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{sub.name}</h3>
              <p className="text-slate-400 text-xs mb-6">Grants Tier {sub.level} privileges upon key redemption with {sub.defaultDays} days default duration.</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Default Duration</span>
              <span className="text-emerald-400 font-bold">{sub.defaultDays} Days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
