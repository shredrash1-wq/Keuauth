import React from 'react';
import { Application } from '../types';
import { Menu, ChevronDown, Plus, Bell, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  applications: Application[];
  selectedApp: Application | null;
  setSelectedApp: (app: Application) => void;
  onNewAppClick: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ applications, selectedApp, setSelectedApp, onNewAppClick, onOpenMobileMenu }) => {
  return (
    <header className="h-18 bg-slate-950/80 backdrop-blur-md border-b border-red-950/40 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Menu Button & Application Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-red-950/60 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5 text-red-500" />
        </button>

        <div className="relative group">
          <select
            value={selectedApp?.id || ''}
            onChange={(e) => {
              const found = applications.find(a => a.id === e.target.value);
              if (found) setSelectedApp(found);
            }}
            className="appearance-none bg-slate-900 border border-red-950/60 hover:border-red-500/50 text-slate-200 font-medium text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all cursor-pointer shadow-inner max-w-[160px] sm:max-w-none truncate"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id} className="bg-slate-900 text-slate-200">
                {app.name} (v{app.version})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button
          onClick={onNewAppClick}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-red-950/60 hover:border-red-500/40 text-slate-300 rounded-xl text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-red-500" />
          <span>New App</span>
        </button>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden md:flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-medium text-emerald-400">REDZONE API: Operational</span>
        </div>

        <div className="hidden sm:block h-5 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-red-950/60 text-slate-300 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-white shadow-md shadow-red-950 text-xs sm:text-sm">
              RZ
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200">Administrator</p>
              <p className="text-[10px] text-slate-400 font-mono">owner@redzone.auth</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
