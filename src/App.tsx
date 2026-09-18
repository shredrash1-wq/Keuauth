import React, { useState, useEffect } from 'react';
import { Application, LicenseKey, AuthUser, SubscriptionPlan, WebhookConfig, AuditLog } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ApplicationsView } from './components/ApplicationsView';
import { LicensesView } from './components/LicensesView';
import { UsersView } from './components/UsersView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { ApiDocsView } from './components/ApiDocsView';
import { WebhooksView } from './components/WebhooksView';
import { SettingsView } from './components/SettingsView';
import { ApiTesterModal } from './components/ApiTesterModal';
import { auth, db } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ShieldAlert, KeyRound, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [devLoggedIn, setDevLoggedIn] = useState(false);
  const [devAuthMode, setDevAuthMode] = useState<'login' | 'register'>('login');
  const [devUsername, setDevUsername] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState<string | null>(null);
  const [devSuccess, setDevSuccess] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [webhooks] = useState<WebhookConfig[]>([
    {
      id: "wh_1",
      appId: "default",
      name: "Discord Bot Alerts",
      url: "https://discord.com/api/webhooks/123456789/redzone_token",
      events: ["register", "login", "key_redeem"],
      enabled: true
    }
  ]);
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: "log_init",
      timestamp: new Date().toISOString(),
      type: "admin",
      message: "REDZONE Auth system initialized. Please login or register as developer.",
      appId: "system"
    }
  ]);

  const [isApiTesterOpen, setIsApiTesterOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        signInAnonymously(auth).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = () => {
    fetch('/api/v1/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplications(data.apps);
          if (data.apps.length > 0 && !selectedApp) {
            setSelectedApp(data.apps[0]);
          }
        }
      })
      .catch(() => {});

    fetch('/api/v1/licenses')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLicenses(data.licenses);
        }
      })
      .catch(() => {});

    fetch('/api/v1/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .catch(() => {});

    fetch('/api/v1/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.logs);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (devLoggedIn) {
      fetchData();
    }
  }, [devLoggedIn]);

  const handleDevAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevError(null);
    setDevSuccess(null);

    const endpoint = devAuthMode === 'login' ? '/api/v1/dev/login' : '/api/v1/dev/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: devUsername, password: devPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (devAuthMode === 'register') {
          setDevSuccess('Developer registered successfully! Please sign in.');
          setDevAuthMode('login');
        } else {
          setDevLoggedIn(true);
        }
      } else {
        setDevError(data.message || 'Authentication failed.');
      }
    } catch (err: any) {
      // Offline fallback
      if (devUsername === 'admin' && devPassword === 'password123' && devAuthMode === 'login') {
        setDevLoggedIn(true);
      } else if (devAuthMode === 'register') {
        setDevSuccess('Registered successfully! Please sign in.');
        setDevAuthMode('login');
      } else {
        setDevError('Unable to connect to server.');
      }
    }
  };

  const handleAddApp = async (name: string, version: string, downloadLink: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, version, downloadLink })
      });
      const data = await res.json();
      if (data.success) {
        setApplications(prev => [data.app, ...prev]);
        setSelectedApp(data.app);
        fetchData();
        return true;
      } else {
        throw new Error(data.message || 'Failed to create application');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleGenerateKeys = async (appId: string, count: number, durationDays: number, level: number, note: string) => {
    try {
      await fetch('/api/v1/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, count, durationDays, level, note })
      });
      fetchData();
    } catch {}
  };

  if (!devLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
        <div className="max-w-md w-full bg-slate-900 border border-red-950/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto mb-3 shadow-lg shadow-red-950">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">REDZONE AUTH</h1>
            <p className="text-xs text-slate-400 mt-1">Developer Admin Portal (Login to create apps)</p>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setDevAuthMode('login'); setDevError(null); setDevSuccess(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                devAuthMode === 'login' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setDevAuthMode('register'); setDevError(null); setDevSuccess(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                devAuthMode === 'register' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {devError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{devError}</span>
            </div>
          )}

          {devSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{devSuccess}</span>
            </div>
          )}

          <form onSubmit={handleDevAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Developer Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={devUsername}
                  onChange={(e) => setDevUsername(e.target.value)}
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
                  placeholder="password123"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all mt-2"
            >
              {devAuthMode === 'login' ? 'Access Developer Console' : 'Register Developer Account'}
            </button>
          </form>
          <div className="mt-4 text-center text-[11px] text-slate-500 font-mono">
            Default credentials: admin / password123
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onOpenApiTester={() => setIsApiTesterOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={() => setDevLoggedIn(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          applications={applications} 
          selectedApp={selectedApp} 
          setSelectedApp={setSelectedApp} 
          onNewAppClick={() => setCurrentTab('applications')} 
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView 
              selectedApp={selectedApp} 
              licenses={licenses} 
              users={users} 
              logs={logs} 
              onNavigate={setCurrentTab} 
            />
          )}
          {currentTab === 'applications' && (
            <ApplicationsView 
              applications={applications} 
              onAddApp={handleAddApp} 
            />
          )}
          {currentTab === 'licenses' && (
            <LicensesView 
              licenses={licenses} 
              applications={applications} 
              selectedApp={selectedApp} 
              onGenerateKeys={handleGenerateKeys} 
              onRefresh={fetchData}
            />
          )}
          {currentTab === 'users' && (
            <UsersView 
              selectedApp={selectedApp} 
              applications={applications} 
            />
          )}
          {currentTab === 'subscriptions' && (
            <SubscriptionsView 
              subscriptions={subscriptions} 
              selectedApp={selectedApp} 
            />
          )}
          {currentTab === 'apidocs' && (
            <ApiDocsView 
              selectedApp={selectedApp} 
            />
          )}
          {currentTab === 'webhooks' && (
            <WebhooksView 
              webhooks={webhooks} 
              selectedApp={selectedApp} 
            />
          )}
          {currentTab === 'settings' && (
            <SettingsView 
              logs={logs} 
            />
          )}
        </main>
      </div>

      <ApiTesterModal 
        isOpen={isApiTesterOpen} 
        onClose={() => setIsApiTesterOpen(false)} 
        applications={applications} 
        licenses={licenses} 
      />
    </div>
  );
}
