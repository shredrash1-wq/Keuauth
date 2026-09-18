import React, { useState, useEffect } from 'react';
import { AuthUser, Application } from '../types';
import { Users, Plus, Trash2, Ban, ShieldCheck, RefreshCw, KeyRound, Lock, User as UserIcon, AppWindow, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Application selection for user creation
  const [targetAppId, setTargetAppId] = useState<string>(selectedApp?.id || applications[0]?.id || 'app_default');
  
  // Filter for table
  const [filterAppId, setFilterAppId] = useState<string>(selectedApp?.id || 'all');

  useEffect(() => {
    if (selectedApp?.id) {
      setTargetAppId(selectedApp.id);
      setFilterAppId(selectedApp.id);
    } else if (applications[0]?.id && (!targetAppId || targetAppId === 'app_default')) {
      setTargetAppId(applications[0].id);
    }
  }, [selectedApp, applications]);

  const fetchUsers = async (appIdFilter?: string) => {
    try {
      const activeFilter = appIdFilter !== undefined ? appIdFilter : filterAppId;
      const url = activeFilter && activeFilter !== 'all' 
        ? `/api/v1/users?appId=${activeFilter}` 
        : '/api/v1/users';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers(filterAppId);
  }, [filterAppId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const effectiveAppId = targetAppId || selectedApp?.id || applications[0]?.id || 'app_default';

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appId: effectiveAppId, 
          username: cleanUser, 
          password: cleanPass, 
          durationDays: Number(durationDays) || 30, 
          level: Number(level) || 1 
        })
      });
      const data = await res.json();
      if (data.success) {
        setUsername('');
        setPassword('');
        setSuccessMsg(data.message || `User "${cleanUser}" created successfully!`);
        fetchUsers(filterAppId);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(data.message || 'Failed to create user account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred while creating user.');
    } finally {
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
        fetchUsers(filterAppId);
      }
    } catch (err) {
      console.warn('Failed user action:', err);
    }
  };

  const getAppName = (appId: string) => {
    const found = applications.find(a => a.id === appId);
    return found ? found.name : 'Default App';
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User & Password Accounts</h1>
        <p className="text-slate-400 text-sm mt-1">Create and manage username and password authentication credentials directly linked to your applications.</p>
      </div>

      {/* Error & Success Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs text-red-400 hover:text-white underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400 hover:text-white underline">Dismiss</button>
        </div>
      )}

      {/* Creator Card */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-red-500" />
          <span>Create User & Pass Account</span>
        </h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Target Application Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <AppWindow className="w-3.5 h-3.5 text-red-500" />
                <span>Target Application *</span>
              </label>
              <select
                value={targetAppId}
                onChange={(e) => setTargetAppId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {applications.length === 0 ? (
                  <option value="app_default">Default App</option>
                ) : (
                  applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.name} (v{app.version})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Username *</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="e.g. secret123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-1">
            {/* Duration */}
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

            {/* Level */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-red-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-sm">Registered Accounts ({users.length})</h3>
            <button 
              onClick={() => fetchUsers(filterAppId)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Refresh users"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter by Application */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter App:</span>
            <select
              value={filterAppId}
              onChange={(e) => setFilterAppId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500/50"
            >
              <option value="all">All Applications</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-950/50">
                <th className="p-4">Username</th>
                <th className="p-4">Application</th>
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
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No user accounts found for this application filter. Use the form above to create one.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-200 text-xs font-bold">{u.username}</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                        {getAppName(u.appId)}
                      </span>
                    </td>
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
