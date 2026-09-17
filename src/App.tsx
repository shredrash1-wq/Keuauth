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

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([
    {
      id: "app_1",
      name: "RedZone Loader v2",
      secret: "rz_sec_99a8b7c6d5e4f3210",
      ownerid: "usr_redzone_admin",
      version: "2.1.0",
      status: "active",
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      totalUsers: 142,
      activeLicenses: 89,
      downloadLink: "https://redzone.auth/downloads/loader-v2.exe"
    },
    {
      id: "app_2",
      name: "Apex Vanguard Suite",
      secret: "rz_sec_1122334455667788",
      ownerid: "usr_redzone_admin",
      version: "1.0.4",
      status: "active",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      totalUsers: 54,
      activeLicenses: 41,
      downloadLink: "https://redzone.auth/downloads/vanguard.zip"
    }
  ]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(applications[0]);
  const [licenses, setLicenses] = useState<LicenseKey[]>([
    {
      id: "key_1",
      key: "REDZONE-LIFETIME-992A-44B1-X89Z",
      appId: "app_1",
      durationDays: 365,
      level: 2,
      status: "used",
      usedBy: "cyber_ninja",
      usedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      hwid: "HWID-8849-XYZ-091",
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      note: "VIP Giveaway key"
    },
    {
      id: "key_2",
      key: "REDZONE-MONTHLY-554C-22D9-K33L",
      appId: "app_1",
      durationDays: 30,
      level: 1,
      status: "unused",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      note: "Store purchase #1024"
    },
    {
      id: "key_3",
      key: "REDZONE-WEEKLY-771B-99E2-P11Q",
      appId: "app_2",
      durationDays: 7,
      level: 1,
      status: "unused",
      createdAt: new Date(Date.now()).toISOString(),
      note: "Trial key batch"
    }
  ]);
  const [users, setUsers] = useState<AuthUser[]>([
    {
      id: "u_1",
      username: "cyber_ninja",
      appId: "app_1",
      hwid: "HWID-8849-XYZ-091",
      ip: "192.168.1.105",
      created: new Date(Date.now() - 86400000 * 2).toISOString(),
      lastLogin: new Date().toISOString(),
      subscriptions: [
        {
          subscription: "VIP Lifetime",
          expiry: new Date(Date.now() + 86400000 * 360).toISOString(),
          level: 2
        }
      ],
      banned: false
    },
    {
      id: "u_2",
      username: "ghost_dev",
      appId: "app_1",
      hwid: "HWID-4421-ABC-999",
      ip: "10.0.0.42",
      created: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
      subscriptions: [
        {
          subscription: "Standard",
          expiry: new Date(Date.now() + 86400000 * 15).toISOString(),
          level: 1
        }
      ],
      banned: false
    }
  ]);
  const [subscriptions] = useState<SubscriptionPlan[]>([
    { id: "sub_1", appId: "app_1", name: "VIP Lifetime", level: 2, defaultDays: 365 },
    { id: "sub_2", appId: "app_1", name: "Standard", level: 1, defaultDays: 30 },
    { id: "sub_3", appId: "app_2", name: "Vanguard Access", level: 1, defaultDays: 30 }
  ]);
  const [webhooks] = useState<WebhookConfig[]>([
    {
      id: "wh_1",
      appId: "app_1",
      name: "Discord Bot Alerts",
      url: "https://discord.com/api/webhooks/123456789/redzone_token",
      events: ["register", "login", "key_redeem"],
      enabled: true
    }
  ]);
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: "log_1",
      timestamp: new Date().toISOString(),
      type: "auth",
      message: "User 'cyber_ninja' successfully authenticated with HWID HWID-8849-XYZ-091",
      ip: "192.168.1.105",
      appId: "app_1"
    },
    {
      id: "log_2",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: "license",
      message: "Key REDZONE-LIFETIME-992A redeemed by 'cyber_ninja'",
      ip: "192.168.1.105",
      appId: "app_1"
    }
  ]);

  const [isApiTesterOpen, setIsApiTesterOpen] = useState(false);

  // Fetch initial data from server
  useEffect(() => {
    fetch('/api/v1/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.apps?.length > 0) {
          setApplications(data.apps);
          setSelectedApp(data.apps[0]);
        }
      })
      .catch(() => {});

    fetch('/api/v1/licenses')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.licenses) {
          setLicenses(data.licenses);
        }
      })
      .catch(() => {});

    fetch('/api/v1/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          setUsers(data.users);
        }
      })
      .catch(() => {});

    fetch('/api/v1/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) {
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
