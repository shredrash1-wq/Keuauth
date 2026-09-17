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
  ExternalLink,
  X,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenApiTester: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, onOpenApiTester, mobileOpen, setMobileOpen, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: Layers },
    { id: 'licenses', label: 'License Keys', icon: KeyRound },
    { id: 'users', label: 'Users & Passwords', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'apidocs', label: 'API & Code Snippets', icon: Code },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-950 border-r border-red-950/40 flex flex-col h-screen select-none transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Logo */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-red-950/40 bg-gradient-to-r from-red-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-950/50">
              <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wider flex items-center gap-1.5 text-lg">
                REDZONE<span className="text-red-500">AUTH</span>
              </h1>
              <p className="text-[10px] text-red-400/70 font-mono tracking-widest uppercase">KeyAuth Panel</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Developer Menu
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
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

        {/* API Tester & Logout */}
        <div className="p-4 border-t border-red-950/40 bg-slate-900/40 space-y-2">
          <button
            onClick={() => {
              onOpenApiTester();
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-red-950/60 transition-all active:scale-[0.98]"
          >
            <Terminal className="w-4 h-4" />
            <span>Client API Tester</span>
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Developer Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
