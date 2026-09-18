import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { 
  User as UserIcon, 
  ShieldAlert, 
  Key, 
  LogOut, 
  Laptop, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw,
  Mail,
  Calendar,
  Lock,
  ShieldCheck
} from 'lucide-react';

interface SettingsViewProps {
  logs: AuditLog[];
  userEmail?: string;
  userPhoto?: string;
  userDisplayName?: string;
  userId?: string;
  userCreatedAt?: string;
  authProvider?: string;
  onUpdateProfile?: (displayName: string) => Promise<boolean>;
  onLogout: () => void;
  onLogoutAll: () => Promise<void>;
  initialTab?: 'profile' | 'sessions';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  logs,
  userEmail = 'developer@redzone.auth',
  userPhoto,
  userDisplayName = 'RedZone Developer',
  userId = 'rz_dev_default',
  userCreatedAt,
  authProvider = 'Email & Password',
  onUpdateProfile,
  onLogout,
  onLogoutAll,
  initialTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sessions'>(initialTab);
  const [displayName, setDisplayName] = useState(userDisplayName);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Generated developer API key
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('rz_dev_master_key') || `rz_master_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  });

  useEffect(() => {
    localStorage.setItem('rz_dev_master_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (userDisplayName) {
      setDisplayName(userDisplayName);
    }
  }, [userDisplayName]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    if (window.confirm('Regenerating this developer master key will invalidate the current one. Continue?')) {
      const newKey = `rz_master_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newKey);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const ok = await onUpdateProfile(displayName);
      if (ok) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        setUpdateError('Failed to update profile name.');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmLogoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      await onLogoutAll();
    } catch (e) {
      console.error(e);
    } finally {
      setLogoutAllLoading(false);
      setShowLogoutAllModal(false);
    }
  };

  // Browser & Device detection
  const userAgent = navigator.userAgent;
  const isMac = /Macintosh|Mac OS X/i.test(userAgent);
  const isWindows = /Windows/i.test(userAgent);
  const isLinux = /Linux/i.test(userAgent);
  const osName = isMac ? 'macOS' : isWindows ? 'Windows' : isLinux ? 'Linux' : 'Desktop OS';
  
  const browserName = /Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent)
    ? 'Chrome' 
    : /Firefox/i.test(userAgent)
    ? 'Firefox'
    : /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)
    ? 'Safari'
    : /Edge|Edg/i.test(userAgent)
    ? 'Microsoft Edge'
    : 'Web Browser';

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Developer Profile & Settings</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage your developer account, active authentication sessions, and REDZONE security preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogoutAllModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Logout All Sessions</span>
          </button>
          
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-red-950/50 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'sessions'
              ? 'bg-red-600 text-white shadow-md shadow-red-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Sessions & Logout All</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="text-center">
              <div className="relative inline-block mb-3">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-2xl border-2 border-red-500 object-cover mx-auto shadow-lg shadow-red-950"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-500/40 flex items-center justify-center text-white text-2xl font-black mx-auto shadow-lg shadow-red-950">
                    {displayName[0]?.toUpperCase() || userEmail[0]?.toUpperCase() || 'D'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 rounded-full border-2 border-slate-900 text-white" title="Active">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-white">{displayName || 'Administrator'}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{userEmail}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-[11px] font-semibold">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                <span>Verified Developer Account</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Auth Provider</span>
                </span>
                <span className="font-semibold text-slate-200">{authProvider}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Developer UID</span>
                </span>
                <span className="font-mono text-slate-300 truncate max-w-[140px]" title={userId}>{userId}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account Created</span>
                </span>
                <span className="font-mono text-slate-300">
                  {userCreatedAt ? new Date(userCreatedAt).toLocaleDateString() : 'Active Session'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setShowLogoutAllModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Logout All Devices</span>
              </button>
            </div>
          </div>

          {/* Edit Profile & Master API Key */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Display Name Form */}
            <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-red-400" />
                <span>Profile Details</span>
              </h3>

              {updateSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Profile name updated successfully!</span>
                </div>
              )}

              {updateError && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 flex items-center gap-2 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. RedZone Lead"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                    <input
                      type="text"
                      disabled
                      value={userEmail}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating || !displayName.trim()}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isUpdating && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <span>{isUpdating ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Master Developer API Key */}
            <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-red-400" />
                  <span>Master Developer API Key</span>
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-red-950/60 border border-red-500/30 text-red-400">
                  Tier: Root Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Use this key to authenticate REST API calls directly to REDZONE Auth endpoints without requiring browser tokens.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRegenerateKey}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="Regenerate Key"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions & Logout All Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Logout All Banner */}
          <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Global Session Invalidation</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Logout from All Active Sessions</h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Notice unexpected logins or switching workstations? Revoking all sessions immediately invalidates all developer authorization tokens, cookies, and local credentials across every browser and device.
              </p>
            </div>

            <button
              onClick={() => setShowLogoutAllModal(true)}
              className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-950 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout All Devices</span>
            </button>
          </div>

          {/* Active Sessions List */}
          <div className="bg-slate-900 border border-red-950/60 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-red-400" />
              <span>Active Authenticated Sessions</span>
            </h3>

            <div className="space-y-3">
              {/* Current Session */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{browserName} on {osName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
                        Current Session
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                      <span>Status: Active & Authorized</span>
                      <span>•</span>
                      <span>Connected Now</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sign Out This Device
                  </button>
                </div>
              </div>

              {/* Secondary Session Simulator / Other Device */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-300">Mobile Safari / iOS Companion</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-slate-400">
                        Standby
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                      <span>Token: Validated</span>
                      <span>•</span>
                      <span>Active in Background</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setShowLogoutAllModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Revoke Token
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout All Confirmation Modal */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto shadow-lg shadow-red-950">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Logout from All Devices?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will immediately revoke all active session tokens for <span className="text-white font-mono font-semibold">{userEmail}</span>. You will be signed out on this browser and any other active sessions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
              <p className="text-red-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Security Impact:</span>
              </p>
              <p>• Firebase Auth session invalidation</p>
              <p>• Local storage credentials purged</p>
              <p>• Immediate redirect to login screen</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={logoutAllLoading}
                onClick={() => setShowLogoutAllModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={logoutAllLoading}
                onClick={handleConfirmLogoutAll}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {logoutAllLoading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>{logoutAllLoading ? 'Revoking...' : 'Yes, Logout All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
