import React, { useState } from 'react';
import { AuthUser, Application } from '../types';
import { Users, ShieldAlert, ShieldCheck, Search, Ban, CheckCircle, Terminal } from 'lucide-react';

interface UsersViewProps {
  users: AuthUser[];
  selectedApp: Application | null;
  onToggleBan: (userId: string, banned: boolean, reason: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ users, selectedApp, onToggleBan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [banModalUser, setBanModalUser] = useState<AuthUser | null>(null);
  const [banReason, setBanReason] = useState('Violation of terms of service');

  const filteredUsers = users.filter(u => {
    if (selectedApp && u.appId !== selectedApp.id) return false;
    if (searchTerm && !u.username.toLowerCase().includes(searchTerm.toLowerCase()) && !u.hwid?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalUser) return;
    onToggleBan(banModalUser.id, !banModalUser.banned, banReason);
    setBanModalUser(null);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Inspect registered client accounts, HWID locks, and active subscription expiration.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search username or HWID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Total Users: <span className="text-white font-bold">{filteredUsers.length}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-red-950/60 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">HWID / IP</th>
                <th className="py-4 px-6">Subscription</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Last Login</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No registered users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 text-xs font-mono">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      <p className="text-slate-300">{u.hwid || 'No HWID'}</p>
                      <p className="text-[10px] text-slate-500">{u.ip || '127.0.0.1'}</p>
                    </td>
                    <td className="py-4 px-6">
                      {u.subscriptions.map((sub, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="text-slate-200 font-medium">{sub.subscription}</span>
                          <p className="text-[10px] text-slate-500 font-mono">Exp: {new Date(sub.expiry).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-6">
                      {u.banned ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-medium">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {new Date(u.lastLogin).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          if (u.banned) {
                            onToggleBan(u.id, false, '');
                          } else {
                            setBanModalUser(u);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          u.banned
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50'
                            : 'bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/50'
                        }`}
                      >
                        {u.banned ? 'Unban User' : 'Ban User'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-950/80 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Ban User: {banModalUser.username}</h3>
            <p className="text-xs text-slate-400 mb-4">This will instantly revoke access and prevent authentication from their HWID.</p>
            <form onSubmit={handleBanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ban Reason</label>
                <input
                  type="text"
                  required
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-red-950 transition-all"
                >
                  Confirm Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
