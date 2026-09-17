import React, { useState, useEffect } from 'react';
import { AuthUser, Application } from '../types';
import { Users, Plus, Trash2, Ban, ShieldCheck, RefreshCw, KeyRound, Lock, User as UserIcon } from 'lucide-react';

interface UsersViewProps {
  selectedApp: Application | null;
  applications: Application[];
}

export const UsersView: React.FC<UsersViewProps> = ({ selectedApp, applications }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);

  const appId = selectedApp?.id || applications[0]?.id || '';

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/v1/users?appId=${appId}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {}
  };

  useEffect(() => {
    if (appId) {
      fetchUsers();
    }
  }, [appId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !appId) return;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, username, password, durationDays, level })
      });
      const data = await res.json();
      if (data.success) {
        setUsername('');
        setPassword('');
        fetchUsers();
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (id: string, action: string, reason?: string) => {
    try {
      const res = await fetch(`/api/v1/users/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch {}
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User & Password Accounts</h1>
        <p className="text-slate-400 text-sm mt-1">Create and manage username/password accounts that function like licenses for {selectedApp?.name || 'RedZone App'}.</p>
      </div>

      {/* Creator Card */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-red-500" />
          <span>Create User & Pass Account</span>
        </h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Days)</label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Access Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value={1}>Level 1 (Standard)</option>
              <option value={2}>Level 2 (VIP)</option>
              <option value={3}>Level 3 (Owner)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-red-950/40 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Registered User Accounts ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-950/50">
                <th className="p-4">Username</th>
                <th className="p-4">Status</th>
                <th className="p-4">Level</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Bound HWID</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No user accounts created yet for this application.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-200 text-xs font-bold">{u.username}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                        u.banned ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {u.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-300">Level {u.level}</td>
                    <td className="p-4 font-mono text-xs text-slate-300">{u.durationDays} Days</td>
                    <td className="p-4 font-mono text-xs text-slate-400 truncate max-w-[140px]">{u.hwid || 'Unbound'}</td>
                    <td className="p-4 text-xs text-slate-400 font-mono">{u.lastLogin}</td>
                    <td className="p-4 text-right space-x-2">
                      {u.hwid && (
                        <button
                          onClick={() => handleUserAction(u.id, 'reset_hwid')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-all"
                          title="Reset HWID"
                        >
                          Reset HWID
                        </button>
                      )}
                      {u.banned ? (
                        <button
                          onClick={() => handleUserAction(u.id, 'unban')}
                          className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 rounded text-xs font-medium transition-all"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(u.id, 'ban', 'Violation')}
                          className="px-2.5 py-1 bg-amber-950/50 hover:bg-amber-900/60 text-amber-400 rounded text-xs font-medium transition-all"
                        >
                          Ban
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(u.id, 'delete')}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded transition-all inline-block"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
