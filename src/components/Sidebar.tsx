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
  Terminal, 
  LogOut, 
  ShieldAlert,
  User
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenApiTester: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
  onLogoutAll?: () => void;
  userEmail?: string;
  onOpenProfile?: (tab?: 'profile' | 'sessions') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  onOpenApiTester, 
  mobileOpen, 
  setMobileOpen, 
  onLogout, 
  onLogoutAll,
  userEmail,
  onOpenProfile
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: Layers },
    { id: 'licenses', label: 'License Keys', icon: KeyRound },
    { id: 'users', label: 'Users & Passwords', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'apidocs', label: 'API & Code Snippets', icon: Code },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'settings', label: 'Profile & Settings', icon: Settings },
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
                REDZONE <span className="text-red-500 text-xs px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800">AUTH</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tighter">CLOUD LICENSING ENGINE</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Control Center
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-950/60'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                )}
              </button>
            );
          })}
        </div>

        {/* API Tester & Logout Bottom Section */}
        <div className="p-4 border-t border-red-950/40 bg-slate-900/40 space-y-2.5">
          {userEmail && (
            <button
              onClick={() => {
                if (onOpenProfile) onOpenProfile('profile');
                else setCurrentTab('settings');
                setMobileOpen(false);
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-red-950 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-red-400 transition-colors">Developer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-300 font-mono truncate">{userEmail}</p>
            </button>
          )}

          <button
            onClick={() => {
              onOpenApiTester();
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Client API Tester</span>
          </button>
          
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
              title="Sign out current browser"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>

            {onLogoutAll && (
              <button
                onClick={() => {
                  onLogoutAll();
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
                title="Revoke tokens & logout all active sessions"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Logout All</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
