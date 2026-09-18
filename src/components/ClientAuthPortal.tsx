import React, { useState } from 'react';
import { Application } from '../types';
import { KeyRound, ShieldCheck, Download, LogOut, RefreshCw, User, Lock, AlertCircle, CheckCircle2, Cpu, Copy, Check, Globe, Server, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientAuthPortalProps {
  applications: Application[];
  licenses: any[];
}

const DEFAULT_CLOUD_RUN_ENDPOINT = 'https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth';

export const ClientAuthPortal: React.FC<ClientAuthPortalProps> = ({ applications, licenses }) => {
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [authMode, setAuthMode] = useState<'license' | 'login' | 'register' | 'reset_hwid'>('license');
  const [licenseKey, setLicenseKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [showEndpointSettings, setShowEndpointSettings] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState(() => {
    return localStorage.getItem('redzone_custom_auth_endpoint') || '';
  });
  const [hwid, setHwid] = useState(() => {
    const saved = localStorage.getItem('redzone_hwid');
    if (saved) return saved;
    const generated = 'HWID-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('redzone_hwid', generated);
    return generated;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [session, setSession] = useState<{
    username: string;
    subscriptions: { subscription: string; expiry: string; level: number }[];
    ip: string;
    hwid: string;
    createdate: string;
    lastlogin: string;
  } | null>(() => {
    const savedSession = sessionStorage.getItem('redzone_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const activeEndpointUrl = customEndpoint.trim() || DEFAULT_CLOUD_RUN_ENDPOINT;

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(activeEndpointUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleSaveEndpoint = (url: string) => {
    setCustomEndpoint(url);
    if (url.trim()) {
      localStorage.setItem('redzone_custom_auth_endpoint', url.trim());
    } else {
      localStorage.removeItem('redzone_custom_auth_endpoint');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const app = applications.find(a => a.id === selectedAppId) || applications[0];
    const payload = {
      type: authMode,
      key: licenseKey.trim(),
      username: username.trim(),
      password: password,
      name: app?.name || 'Redzone',
      ownerid: app?.ownerid || 'usr_yedagf',
      hwid: hwid
    };

    try {
      let res: Response;

      // If user specified custom endpoint, use it directly
      if (customEndpoint.trim()) {
        res = await fetch(customEndpoint.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Primary call to secure proxy /api/auth
        try {
          res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (networkErr: any) {
          // Fallback directly to client auth route or Cloud Run endpoint
          try {
            res = await fetch('/api/v1/client/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch {
            // Direct Cloud Run CORS fallback
            res = await fetch(DEFAULT_CLOUD_RUN_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload)
            });
          }
        }

        // If /api/auth returned 404 (e.g. standalone routing edge case), try /api/v1/client/auth
        if (res.status === 404) {
          try {
            const fallbackRes = await fetch('/api/v1/client/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (fallbackRes.ok || fallbackRes.status < 500) {
              res = fallbackRes;
            }
          } catch {}
        }
      }

      let data: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server returned status code ${res.status}`);
      }

      if (res.ok && data.success) {
        if (authMode === 'register') {
          setSuccessMsg(data.message || 'Account registered successfully! Please sign in.');
          setAuthMode('login');
          setPassword('');
        } else if (authMode === 'reset_hwid') {
          setSuccessMsg(data.message || 'HWID reset successfully! You can now sign in.');
          setAuthMode('login');
          setPassword('');
        } else {
          const userSession = data.userinfo || {
            username: username || 'VerifiedUser',
            subscriptions: [{ subscription: 'Standard Access', expiry: new Date(Date.now() + 30 * 86400000).toISOString(), level: 1 }],
            ip: '127.0.0.1',
            hwid: hwid,
            createdate: new Date().toISOString(),
            lastlogin: new Date().toISOString()
          };
          setSession(userSession);
          sessionStorage.setItem('redzone_session', JSON.stringify(userSession));
        }
      } else {
        // Clear specific error messages returned by server
        if (data.message) {
          setError(data.message);
        } else if (res.status === 404) {
          setError('Invalid license key or application not found on server.');
        } else if (res.status === 401 || res.status === 403) {
          setError('Authentication rejected: Invalid credentials or key is banned/frozen.');
        } else if (res.status >= 500) {
          setError(`Redzone authentication server error (${res.status}): Please try again later.`);
        } else {
          setError(`Authentication failed (HTTP ${res.status}).`);
        }
      }
    } catch (err: any) {
      setError(`Unable to connect to Redzone authentication server. Make sure your API Endpoint URL is set to: ${DEFAULT_CLOUD_RUN_ENDPOINT}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setSession(null);
    sessionStorage.removeItem('redzone_session');
    setLicenseKey('');
    setPassword('');
  };

  const currentApp = applications.find(a => a.id === selectedAppId) || applications[0];

  if (session) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Welcome, {session.username}!</h1>
                <p className="text-xs text-emerald-400 font-mono">REDZONE Auth Client Session Active</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Hardware ID (HWID)</span>
              <span className="font-mono text-xs text-slate-200 break-all">{session.hwid}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Client IP Address</span>
              <span className="font-mono text-xs text-slate-200">{session.ip}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Subscriptions</h3>
            {session.subscriptions && session.subscriptions.map((sub, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-xl border border-red-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white text-sm">{sub.subscription}</p>
                  <p className="text-xs text-slate-400 font-mono">Expires: {new Date(sub.expiry).toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-mono font-bold self-start sm:self-auto">
                  Level {sub.level} Access
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Application Loader Build Ready</p>
              <p className="text-xs text-slate-400">Download the protected binary for {currentApp?.name || 'RedZone Core App'}</p>
            </div>
            <a
              href={currentApp?.downloadLink || "https://redzone.auth/downloads/loader.exe"}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-950 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Loader</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-md mx-auto min-h-[80vh] flex flex-col justify-center">
      <div className="bg-slate-900 border border-red-950/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto mb-3 shadow-lg shadow-red-950">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">REDZONE Client Auth</h1>
          <p className="text-xs text-slate-400 mt-1">Secure KeyAuth & User Account Portal</p>
        </div>

        {/* API Endpoint Banner & Switcher */}
        <div className="mb-5 bg-slate-950/80 rounded-xl border border-red-950/80 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Auth API Endpoint</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-800 transition-all cursor-pointer"
                title="Copy API Endpoint URL"
              >
                {copiedEndpoint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedEndpoint ? 'Copied' : 'Copy URL'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowEndpointSettings(!showEndpointSettings)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
                title="Configure custom endpoint URL"
              >
                {showEndpointSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="font-mono text-[11px] text-emerald-400 truncate select-all">
            {activeEndpointUrl}
          </p>

          {showEndpointSettings && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="block text-[11px] font-medium text-slate-400">
                Custom Authentication API URL (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={DEFAULT_CLOUD_RUN_ENDPOINT}
                  value={customEndpoint}
                  onChange={(e) => handleSaveEndpoint(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {customEndpoint && (
                  <button
                    type="button"
                    onClick={() => handleSaveEndpoint('')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => { setAuthMode('license'); setError(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg font-bold transition-all ${
              authMode === 'license' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            License
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg font-bold transition-all ${
              authMode === 'login' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg font-bold transition-all ${
              authMode === 'register' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('reset_hwid'); setError(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg font-bold transition-all ${
              authMode === 'reset_hwid' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reset HWID
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Application</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {applications.length === 0 ? (
                <option value="default">RedZone Core App</option>
              ) : (
                applications.map(app => (
                  <option key={app.id} value={app.id}>{app.name} (v{app.version})</option>
                ))
              )}
            </select>
          </div>

          {authMode === 'license' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">License Key</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="REDZONE-LIFETIME-2026-PRO"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>
          )}

          {(authMode === 'login' || authMode === 'register' || authMode === 'reset_hwid') && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter username (e.g. admin)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password (e.g. password123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Hardware ID (HWID)</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={hwid}
                onChange={(e) => setHwid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  const newHwid = 'HWID-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
                  setHwid(newHwid);
                  localStorage.setItem('redzone_hwid', newHwid);
                }}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                title="Regenerate HWID"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>
              {loading ? 'Processing...' : authMode === 'register' ? 'Register Account' : authMode === 'login' ? 'Sign In' : authMode === 'reset_hwid' ? 'Reset HWID' : 'Authenticate License'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
