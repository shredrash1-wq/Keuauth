import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Application {
  id: string;
  name: string;
  secret: string;
  ownerid: string;
  version: string;
  status: 'active' | 'maintenance' | 'disabled';
  createdAt: string;
  totalUsers: number;
  activeLicenses: number;
  downloadLink: string;
}

interface LicenseKey {
  id: string;
  key: string;
  appId: string;
  durationDays: number;
  level: number;
  status: 'unused' | 'used' | 'banned';
  usedBy?: string;
  usedAt?: string;
  hwid?: string;
  createdAt: string;
  note?: string;
}

interface AuthUser {
  id: string;
  username: string;
  appId: string;
  hwid?: string;
  ip?: string;
  created: string;
  lastLogin: string;
  subscriptions: {
    subscription: string;
    expiry: string;
    level: number;
  }[];
  banned: boolean;
  banReason?: string;
}

interface SubscriptionPlan {
  id: string;
  appId: string;
  name: string;
  level: number;
  defaultDays: number;
}

interface WebhookConfig {
  id: string;
  appId: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'license' | 'admin' | 'webhook';
  message: string;
  ip?: string;
  appId: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initial Seed Data for REDZONE Auth
  let applications: Application[] = [
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
  ];

  let licenseKeys: LicenseKey[] = [
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
  ];

  let authUsers: AuthUser[] = [
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
  ];

  let subscriptionPlans: SubscriptionPlan[] = [
    { id: "sub_1", appId: "app_1", name: "VIP Lifetime", level: 2, defaultDays: 365 },
    { id: "sub_2", appId: "app_1", name: "Standard", level: 1, defaultDays: 30 },
    { id: "sub_3", appId: "app_2", name: "Vanguard Access", level: 1, defaultDays: 30 }
  ];

  let webhooks: WebhookConfig[] = [
    {
      id: "wh_1",
      appId: "app_1",
      name: "Discord Bot Alerts",
      url: "https://discord.com/api/webhooks/123456789/redzone_token",
      events: ["register", "login", "key_redeem"],
      enabled: true
    }
  ];

  let auditLogs: AuditLog[] = [
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
  ];

  // API Routes
  app.get("/api/v1/apps", (req, res) => {
    res.json({ success: true, apps: applications });
  });

  app.post("/api/v1/apps", (req, res) => {
    const { name, version, downloadLink } = req.body;
    const newApp: Application = {
      id: `app_${Date.now()}`,
      name: name || "New RedZone App",
      secret: `rz_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      ownerid: "usr_redzone_admin",
      version: version || "1.0.0",
      status: "active",
      createdAt: new Date().toISOString(),
      totalUsers: 0,
      activeLicenses: 0,
      downloadLink: downloadLink || "https://redzone.auth/downloads/app.exe"
    };
    applications.push(newApp);
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      message: `Created application '${newApp.name}'`,
      appId: newApp.id
    });
    res.json({ success: true, app: newApp });
  });

  app.get("/api/v1/licenses", (req, res) => {
    const { appId } = req.query;
    const filtered = appId ? licenseKeys.filter(k => k.appId === appId) : licenseKeys;
    res.json({ success: true, licenses: filtered });
  });

  app.post("/api/v1/licenses/generate", (req, res) => {
    const { appId, count = 1, durationDays = 30, level = 1, note } = req.body;
    const generated: LicenseKey[] = [];
    for (let i = 0; i < count; i++) {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const keyStr = `REDZONE-${durationDays}D-${randomPart}-${randomPart2}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newKey: LicenseKey = {
        id: `key_${Date.now()}_${i}`,
        key: keyStr,
        appId: appId || applications[0]?.id || "app_1",
        durationDays: Number(durationDays),
        level: Number(level),
        status: "unused",
        createdAt: new Date().toISOString(),
        note: note || "Generated via REDZONE panel"
      };
      licenseKeys.unshift(newKey);
      generated.push(newKey);
    }
    
    // Update app license count
    const targetApp = applications.find(a => a.id === appId);
    if (targetApp) {
      targetApp.activeLicenses += generated.length;
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "license",
      message: `Generated ${count} license key(s) for app ${appId}`,
      appId: appId || "app_1"
    });

    res.json({ success: true, keys: generated });
  });

  app.delete("/api/v1/licenses/:id", (req, res) => {
    const { id } = req.params;
    licenseKeys = licenseKeys.filter(k => k.id !== id);
    res.json({ success: true });
  });

  app.get("/api/v1/users", (req, res) => {
    const { appId } = req.query;
    const filtered = appId ? authUsers.filter(u => u.appId === appId) : authUsers;
    res.json({ success: true, users: filtered });
  });

  app.post("/api/v1/users/:id/ban", (req, res) => {
    const { id } = req.params;
    const { banned, reason } = req.body;
    const user = authUsers.find(u => u.id === id);
    if (user) {
      user.banned = banned;
      user.banReason = reason || "Violated terms of service";
      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "admin",
        message: `User '${user.username}' was ${banned ? 'banned' : 'unbanned'}`,
        appId: user.appId
      });
      return res.json({ success: true, user });
    }
    res.status(404).json({ success: false, message: "User not found" });
  });

  app.get("/api/v1/subscriptions", (req, res) => {
    const { appId } = req.query;
    const filtered = appId ? subscriptionPlans.filter(s => s.appId === appId) : subscriptionPlans;
    res.json({ success: true, subscriptions: filtered });
  });

  app.get("/api/v1/webhooks", (req, res) => {
    const { appId } = req.query;
    const filtered = appId ? webhooks.filter(w => w.appId === appId) : webhooks;
    res.json({ success: true, webhooks: filtered });
  });

  app.get("/api/v1/logs", (req, res) => {
    res.json({ success: true, logs: auditLogs });
  });

  // REDZONE Auth Client API Endpoint Simulation (KeyAuth compatible REST interface)
  app.post("/api/v1/client/auth", (req, res) => {
    const { type, username, password, key, hwid, name, ownerid } = req.body;
    
    // Find app by name or default
    const app = applications.find(a => a.name.toLowerCase() === (name || "").toLowerCase()) || applications[0];
    if (!app) {
      return res.status(400).json({ success: false, message: "Invalid application credentials" });
    }

    const clientIp = req.ip || "127.0.0.1";

    if (type === "license") {
      const foundKey = licenseKeys.find(k => k.key === key && k.appId === app.id);
      if (!foundKey) {
        return res.json({ success: false, message: "The specified license key does not exist." });
      }
      if (foundKey.status === "banned") {
        return res.json({ success: false, message: "This license key has been banned." });
      }
      if (foundKey.status === "used" && foundKey.hwid && foundKey.hwid !== hwid) {
        return res.json({ success: false, message: "Hardware ID (HWID) mismatch. Key is bound to another PC." });
      }

      // Redeem or authorize
      foundKey.status = "used";
      foundKey.hwid = hwid || "HWID-DEFAULT-PC";
      foundKey.usedAt = new Date().toISOString();

      let user = authUsers.find(u => u.hwid === hwid && u.appId === app.id);
      if (!user) {
        user = {
          id: `u_${Date.now()}`,
          username: `User_${Math.floor(1000 + Math.random() * 9000)}`,
          appId: app.id,
          hwid: hwid || "HWID-DEFAULT-PC",
          ip: clientIp,
          created: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          subscriptions: [
            {
              subscription: `Level ${foundKey.level} Access`,
              expiry: new Date(Date.now() + foundKey.durationDays * 86400000).toISOString(),
              level: foundKey.level
            }
          ],
          banned: false
        };
        authUsers.push(user);
        app.totalUsers += 1;
      } else {
        user.lastLogin = new Date().toISOString();
      }

      foundKey.usedBy = user.username;

      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "auth",
        message: `Client auth successful via License Key for user '${user.username}'`,
        ip: clientIp,
        appId: app.id
      });

      return res.json({
        success: true,
        message: "Successfully authenticated with REDZONE Auth!",
        userinfo: {
          username: user.username,
          subscriptions: user.subscriptions,
          ip: clientIp,
          hwid: user.hwid,
          createdate: user.created,
          lastlogin: user.lastLogin
        }
      });
    }

    res.status(400).json({ success: false, message: "Invalid auth type specified." });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`REDZONE Auth Server running on http://localhost:${PORT}`);
  });
}

startServer();
