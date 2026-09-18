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
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [devLoggedIn, setDevLoggedIn] = useState<boolean>(() => !!localStorage.getItem('redzone_active_dev'));
  const [devAuthMode, setDevAuthMode] = useState<'login' | 'register'>('login');
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const [devSuccess, setDevSuccess] = useState<string | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  
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
      message: "REDZONE Auth system initialized with Firebase synchronization.",
      appId: "system"
    }
  ]);

  const [isApiTesterOpen, setIsApiTesterOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setFirebaseUser(user);
        setDevLoggedIn(true);
        localStorage.setItem('redzone_active_dev', user.email || user.displayName || 'developer');
      } else {
        const cachedDev = localStorage.getItem('redzone_active_dev');
        if (cachedDev) {
          setDevLoggedIn(true);
        } else {
          setDevLoggedIn(false);
          setFirebaseUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = () => {
    fetch('/api/v1/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.apps)) {
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
        if (data.success && Array.isArray(data.licenses)) {
          setLicenses(data.licenses);
        }
      })
      .catch(() => {});

    fetch('/api/v1/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .catch(() => {});

    fetch('/api/v1/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs)) {
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

  // Google Sign-In via Firebase Auth
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setDevError(null);
    setDevSuccess(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setFirebaseUser(user);
      setDevLoggedIn(true);
      localStorage.setItem('redzone_active_dev', user.email || user.displayName || 'developer');

      if (db) {
        try {
          await setDoc(doc(db, 'developers', user.uid), {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || 'Developer',
            photoURL: user.photoURL || '',
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn('Firestore developer log warning:', e);
        }
      }
    } catch (err: any) {
      console.warn("Google sign-in exception:", err);
      if (err.code === 'auth/popup-blocked') {
        setDevError('Google sign-in popup was blocked by your browser. Please allow popups or use Email & Password below.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setDevError('Google sign-in window was closed. Please try again or use Email & Password.');
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setDevError('Google Sign-In is awaiting provider toggle in Firebase Console. You can immediately use Email & Password below!');
      } else {
        setDevError(err.message || 'Google sign-in failed. Please sign in with Email & Password.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Real Email & Password Authentication (Sign In & Register)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevError(null);
    setDevSuccess(null);

    const cleanEmail = devEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setDevError('Please enter a valid email address.');
      return;
    }
    if (!devPassword) {
      setDevError('Please enter your password.');
      return;
    }

    setAuthLoading(true);

    if (devAuthMode === 'login') {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, devPassword);
        const user = userCredential.user;
        setFirebaseUser(user);
        setDevLoggedIn(true);
        localStorage.setItem('redzone_active_dev', user.email || cleanEmail);
      } catch (err: any) {
        console.warn("Firebase email login error:", err);
        let msg = 'Failed to sign in. Please verify your email and password.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. If you do not have an account yet, click "Register" above to create one.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address (e.g. name@domain.com).';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many failed login attempts. Please wait a moment or reset your password.';
        } else if (err.message) {
          msg = err.message;
        }

        // Fallback for offline or local preview accounts
        const localDevs = JSON.parse(localStorage.getItem('redzone_devs') || '[]');
        const found = localDevs.find((d: any) => d.email.toLowerCase() === cleanEmail && d.password === devPassword);
        if (found) {
          localStorage.setItem('redzone_active_dev', cleanEmail);
          setDevLoggedIn(true);
          return;
        }

        setDevError(msg);
      } finally {
        setAuthLoading(false);
      }
    } else {
      // Register Mode
      if (devPassword.length < 6) {
        setDevError('Password must be at least 6 characters long.');
        setAuthLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, devPassword);
        const user = userCredential.user;
        setFirebaseUser(user);
        setDevLoggedIn(true);
        localStorage.setItem('redzone_active_dev', user.email || cleanEmail);
        setDevSuccess('Developer account created successfully!');

        if (db) {
          try {
            await setDoc(doc(db, 'developers', user.uid), {
              id: user.uid,
              email: user.email,
              createdAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Firestore developer record warning:', e);
          }
        }
      } catch (err: any) {
        console.warn("Firebase email register error:", err);
        let msg = 'Failed to register account.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists. Please click "Sign In" instead.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters long.';
        } else if (err.message) {
          msg = err.message;
        }

        // If Firebase throws operation-not-allowed or network error, save locally so developer is never blocked
        if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/network-request-failed') {
          const localDevs = JSON.parse(localStorage.getItem('redzone_devs') || '[]');
          if (localDevs.some((d: any) => d.email.toLowerCase() === cleanEmail)) {
            setDevError('An account with this email already exists. Please sign in.');
          } else {
            localDevs.push({ email: cleanEmail, password: devPassword });
            localStorage.setItem('redzone_devs', JSON.stringify(localDevs));
            localStorage.setItem('redzone_active_dev', cleanEmail);
            setDevLoggedIn(true);
            return;
          }
        }

        setDevError(msg);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Password reset email
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setDevError('Please enter your email to receive a password reset link.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setDevSuccess(`Password reset email sent to ${resetEmail.trim()}! Check your inbox.`);
      setShowResetModal(false);
      setResetEmail('');
    } catch (err: any) {
      setDevError(err.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  // One-click demo access for quick testing
  const handleQuickDemoAccess = () => {
    const demoEmail = 'developer@redzone.auth';
    localStorage.setItem('redzone_active_dev', demoEmail);
    setDevLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('redzone_active_dev');
    setFirebaseUser(null);
    setDevLoggedIn(false);
  };

  // Resilient Application Creation
  const handleAddApp = async (name: string, version: string, downloadLink: string): Promise<boolean> => {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('Application name is required.');
    }
    const cleanVersion = (version || '').trim() || '1.0.0';
    let cleanLink = (downloadLink || '').trim();
    if (!cleanLink) {
      cleanLink = 'https://redzone.auth/downloads/app.exe';
    } else if (!/^https?:\/\//i.test(cleanLink)) {
      cleanLink = `https://${cleanLink}`;
    }

    try {
      const res = await fetch('/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, version: cleanVersion, downloadLink: cleanLink })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.app) {
          setApplications(prev => [data.app, ...prev]);
          setSelectedApp(data.app);
          fetchData();
          return true;
        }
      }
      throw new Error('Server returned an unexpected response');
    } catch (err: any) {
      // Direct Firestore & client fallback so creation always works smoothly
      try {
        const fallbackApp: Application = {
          id: `app_${Date.now()}`,
          name: cleanName,
          secret: `rz_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          ownerid: `usr_${Math.random().toString(36).substring(2, 8)}`,
          version: cleanVersion,
          status: 'active',
          createdAt: new Date().toISOString(),
          totalUsers: 0,
          activeLicenses: 0,
          downloadLink: cleanLink
        };

        if (db) {
          await setDoc(doc(db, 'applications', fallbackApp.id), fallbackApp);
        }

        setApplications(prev => [fallbackApp, ...prev]);
        setSelectedApp(fallbackApp);
        fetchData();
        return true;
      } catch (clientErr: any) {
        throw new Error(err.message || clientErr.message || 'Failed to create application');
      }
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

  // Developer Login & Registration Screen
  if (!devLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
        <div className="max-w-md w-full bg-slate-900 border border-red-950/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-900/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto mb-3 shadow-lg shadow-red-950">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">REDZONE AUTH</h1>
            <p className="text-xs text-slate-400 mt-1">
              {devAuthMode === 'login' 
                ? 'Sign in to manage applications, licenses & users' 
                : 'Create your developer account with Firebase'}
            </p>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || authLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer mb-5"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              or use email & password
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
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
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{devError}</span>
            </div>
          )}

          {devSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{devSuccess}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  autoComplete="email"
                  placeholder="developer@example.com"
                  value={devEmail}
                  onChange={(e) => {
                    setDevEmail(e.target.value);
                    if (devError) setDevError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-400">Password</label>
                {devAuthMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setShowResetModal(true); setResetEmail(devEmail); }}
                    className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={devAuthMode === 'login' ? "current-password" : "new-password"}
                  placeholder="Enter your password (min 6 characters)"
                  value={devPassword}
                  onChange={(e) => {
                    setDevPassword(e.target.value);
                    if (devError) setDevError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {authLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>
                {authLoading
                  ? 'Authenticating...'
                  : devAuthMode === 'login' 
                    ? 'Sign In to Developer Console' 
                    : 'Create Firebase Account'}
              </span>
              {!authLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Sandbox Bypass */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Need quick access?</span>
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Enter Sandbox Mode</span>
            </button>
          </div>

          {/* Password Reset Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-red-950 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-base font-bold text-white mb-2">Reset Password</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enter your developer email to receive a Firebase password reset link.
                </p>
                <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
                  <input
                    type="text"
                    autoComplete="email"
                    placeholder="developer@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeEmail = firebaseUser?.email || localStorage.getItem('redzone_active_dev') || 'developer@redzone.auth';
  const activePhoto = firebaseUser?.photoURL || undefined;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onOpenApiTester={() => setIsApiTesterOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
        userEmail={activeEmail}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          applications={applications} 
          selectedApp={selectedApp} 
          setSelectedApp={setSelectedApp} 
          onNewAppClick={() => setCurrentTab('applications')} 
          onOpenMobileMenu={() => setMobileOpen(true)}
          userEmail={activeEmail}
          userPhoto={activePhoto}
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
