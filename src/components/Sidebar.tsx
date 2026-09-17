import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  KeyRound, 
  Users, 
  CreditCard, 
  Code, 
  Webhook, 
  Settings, 
  ShieldAlert,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenApiTester: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, onOpenApiTester }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: Layers },
    { id: 'licenses', label: 'License Keys', icon: KeyRound },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'apidocs', label: 'API & Code Snippets', icon: Code },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-red-950/40 flex flex-col h-screen select-none sticky top-0">
      {/* Brand Logo */}
      <div className="h-18 px-6 flex items-center gap-3 border-b border-red-950/40 bg-gradient-to-r from-red-950/20 to-transparent">
        <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-950/50">
          <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wider flex items-center gap-1.5 text-lg">
            REDZONE<span className="text-red-500">AUTH</span>
          </h1>
          <p className="text-[10px] text-red-400/70 font-mono tracking-widest uppercase">Secured Licensing</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-red-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-glow" />
              )}
            </button>
          );
        })}
      </div>

      {/* API Tester Quick Launcher */}
      <div className="p-4 border-t border-red-950/40 bg-slate-900/40">
        <button
          onClick={onOpenApiTester}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-red-950/60 transition-all active:scale-[0.98]"
        >
          <Terminal className="w-4 h-4" />
          <span>Client API Tester</span>
        </button>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
          <span>API v1.2 Active</span>
          <a 
            href="https://github.com/KeyAuth/KeyAuth-Source-Code" 
            target="_blank" 
            rel="noreferrer"
            className="hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <span>KeyAuth Ref</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
};
