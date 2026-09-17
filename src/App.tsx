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
import { ClientAuthPortal } from './components/ClientAuthPortal';
import { auth, db } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  
  // Fresh start with 0 applications and 0 license keys by default
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
      message: "REDZONE Auth system initialized via Firebase Firestore. 0 applications created.",
      appId: "system"
    }
  ]);

  const [isApiTesterOpen, setIsApiTesterOpen] = useState(false);

  // Authenticate Firebase anonymously if not signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        signInAnonymously(auth).catch((err) => console.error("Firebase auth error:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial data from server / backend
  useEffect(() => {
    fetch('/api/v1/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplications(data.apps);
          if (data.apps.length > 0) {
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
  }, []);

  const handleAddApp = async (name: string, version: string, downloadLink: string) => {
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
        setSubscriptions(prev => [
          { id: `sub_${Date.now()}`, appId: data.app.id, name: "Default Access", level: 1, defaultDays: 30 },
          ...prev
        ]);
      }
    } catch {
      const newApp: Application = {
        id: `app_${Date.now()}`,
        name,
        secret: `rz_sec_${Math.random().toString(36).substring(2, 15)}`,
        ownerid: "usr_redzone_admin",
        version,
        status: "active",
        createdAt: new Date().toISOString(),
        totalUsers: 0,
        activeLicenses: 0,
        downloadLink
      };
      setApplications(prev => [newApp, ...prev]);
      setSelectedApp(newApp);
    }
  };

  const handleGenerateKeys = async (appId: string, count: number, durationDays: number, level: number, note: string) => {
    try {
      const res = await fetch('/api/v1/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, count, durationDays, level, note })
      });
      const data = await res.json();
      if (data.success && data.keys) {
        setLicenses(prev => [...data.keys, ...prev]);
        if (selectedApp) {
          setSelectedApp({ ...selectedApp, activeLicenses: selectedApp.activeLicenses + data.keys.length });
        }
      }
    } catch {
      const generated: LicenseKey[] = [];
      for (let i = 0; i < count; i++) {
        const keyStr = `REDZONE-${durationDays}D-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        generated.push({
          id: `key_${Date.now()}_${i}`,
          key: keyStr,
          appId,
          durationDays,
          level,
          status: 'unused',
          createdAt: new Date().toISOString(),
          note
        });
      }
      setLicenses(prev => [...generated, ...prev]);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await fetch(`/api/v1/licenses/${id}`, { method: 'DELETE' });
      setLicenses(prev => prev.filter(k => k.id !== id));
    } catch {
      setLicenses(prev => prev.filter(k => k.id !== id));
    }
  };

  const handleToggleBan = async (userId: string, banned: boolean, reason: string) => {
    try {
      const res = await fetch(`/api/v1/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned, reason })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned, banReason: reason } : u));
      }
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned, banReason: reason } : u));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      {/* Sidebar / Mobile Navigation Drawer */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onOpenApiTester={() => setIsApiTesterOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
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
          {currentTab === 'client_portal' && (
            <ClientAuthPortal 
              applications={applications}
              licenses={licenses}
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
              onDeleteKey={handleDeleteKey} 
            />
          )}
          {currentTab === 'users' && (
            <UsersView 
              users={users} 
              selectedApp={selectedApp} 
              onToggleBan={handleToggleBan} 
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

      {/* API Tester Modal */}
      <ApiTesterModal 
        isOpen={isApiTesterOpen} 
        onClose={() => setIsApiTesterOpen(false)} 
        applications={applications} 
        licenses={licenses} 
      />
    </div>
  );
}
