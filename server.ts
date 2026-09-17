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
  password?: string;
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

  // Global CORS Middleware for external frontend domains (like Vercel)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  let applications: Application[] = [
    {
      id: "app_default",
      name: "RedZone Core App",
      secret: "rz_sec_default_secret_99",
      ownerid: "usr_redzone",
      version: "1.0.0",
      status: "active",
      createdAt: new Date().toISOString(),
      totalUsers: 1,
      activeLicenses: 5,
      downloadLink: "https://redzone.auth/downloads/loader.exe"
    }
  ];

  let licenseKeys: LicenseKey[] = [
    {
      id: "key_default_1",
      key: "REDZONE-LIFETIME-2026-PRO",
      appId: "app_default",
      durationDays: 365,
      level: 2,
      status: "unused",
      createdAt: new Date().toISOString(),
      note: "Default pre-generated key"
    }
  ];

  let authUsers: AuthUser[] = [
    {
      id: "u_default",
      username: "admin",
      password: "password123",
      appId: "app_default",
      hwid: "HWID-TEST-PC",
      ip: "127.0.0.1",
      created: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      subscriptions: [
        {
          subscription: "VIP Lifetime Access",
          expiry: new Date(Date.now() + 365 * 86400000).toISOString(),
          level: 2
        }
      ],
      banned: false
    }
  ];

  let subscriptionPlans: SubscriptionPlan[] = [
    { id: "sub_1", appId: "app_default", name: "VIP Lifetime Access", level: 2, defaultDays: 365 },
    { id: "sub_2", appId: "app_default", name: "Standard Access", level: 1, defaultDays: 30 }
  ];

  let webhooks: WebhookConfig[] = [];
  let auditLogs: AuditLog[] = [
    {
      id: "log_init",
      timestamp: new Date().toISOString(),
      type: "admin",
      message: "REDZONE Auth server initialized with default app and test account (admin / password123).",
      appId: "system"
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
      name: name || "RedZone Core App",
      secret: `rz_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      ownerid: `usr_${Math.random().toString(36).substring(2, 8)}`,
      version: version || "1.0.0",
      status: "active",
      createdAt: new Date().toISOString(),
      totalUsers: 0,
      activeLicenses: 0,
      downloadLink: downloadLink || "https://redzone.auth/downloads/app.exe"
    };
    applications.push(newApp);

    subscriptionPlans.push({
      id: `sub_${Date.now()}`,
      appId: newApp.id,
      name: "Default Access",
      level: 1,
      defaultDays: 30
    });

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
    const targetAppId = appId || applications[0]?.id || "app_default";

    for (let i = 0; i < count; i++) {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const keyStr = `REDZONE-${durationDays}D-${randomPart}-${randomPart2}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newKey: LicenseKey = {
        id: `key_${Date.now()}_${i}`,
        key: keyStr,
        appId: targetAppId,
        durationDays: Number(durationDays),
        level: Number(level),
        status: "unused",
        createdAt: new Date().toISOString(),
        note: note || "Generated via REDZONE panel"
      };
      licenseKeys.unshift(newKey);
      generated.push(newKey);
    }
    
    const targetApp = applications.find(a => a.id === targetAppId);
    if (targetApp) {
      targetApp.activeLicenses += generated.length;
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "license",
      message: `Generated ${count} license key(s)`,
      appId: targetAppId
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

  // REDZONE Auth Client API Endpoint Simulation (KeyAuth compatible REST interface for Web, C++, C#, Python, PHP)
  app.post("/api/v1/client/auth", (req, res) => {
    const { type, key, username, password, hwid, name, ownerid } = req.body;
    const clientIp = req.ip || "127.0.0.1";

    let app = applications.find(a => a.name.toLowerCase() === (name || "").toLowerCase()) || applications[0];
    if (!app) {
      app = applications[0];
    }

    if (type === "register") {
      if (!username || !password) {
        return res.json({ success: false, message: "Username and password are required for registration." });
      }
      const existing = authUsers.find(u => u.username === username && u.appId === app.id);
      if (existing) {
        return res.json({ success: false, message: "Username is already taken." });
      }

      const newUser: AuthUser = {
        id: `u_${Date.now()}`,
        username,
        password,
        appId: app.id,
        hwid: hwid || "HWID-DEFAULT",
        ip: clientIp,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        subscriptions: [
          {
            subscription: "Standard Access",
            expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
            level: 1
          }
        ],
        banned: false
      };
      authUsers.push(newUser);
      app.totalUsers += 1;

      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "auth",
        message: `New user account registered: '${username}'`,
        ip: clientIp,
        appId: app.id
      });

      return res.json({ success: true, message: "Account registered successfully! You can now sign in." });
    }

    if (type === "login") {
      if (!username || !password) {
        return res.json({ success: false, message: "Username and password are required for login." });
      }
      const user = authUsers.find(u => u.username === username && u.appId === app.id);
      if (!user || user.password !== password) {
        return res.json({ success: false, message: "Invalid username or password." });
      }
      if (user.banned) {
        return res.json({ success: false, message: `Account is banned: ${user.banReason}` });
      }

      // HWID Lock validation if user already bound to another HWID
      if (user.hwid && hwid && user.hwid !== hwid) {
        return res.json({ success: false, message: "Hardware ID (HWID) mismatch. Account is locked to another PC. Please reset HWID." });
      }

      user.lastLogin = new Date().toISOString();
      if (hwid) user.hwid = hwid;

      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "auth",
        message: `User '${username}' logged in successfully`,
        ip: clientIp,
        appId: app.id
      });

      return res.json({
        success: true,
        message: "Logged in successfully!",
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

    if (type === "reset_hwid") {
      if (!username || !password) {
        return res.json({ success: false, message: "Username and password are required to reset HWID." });
      }
      const user = authUsers.find(u => u.username === username && u.appId === app.id);
      if (!user || user.password !== password) {
        return res.json({ success: false, message: "Invalid username or password." });
      }

      user.hwid = hwid || "HWID-NEW-PC";
      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "auth",
        message: `HWID reset successfully for user '${username}'`,
        ip: clientIp,
        appId: app.id
      });

      return res.json({ success: true, message: "Hardware ID (HWID) reset successfully! You can now log in from this PC." });
    }

    if (type === "license") {
      const foundKey = licenseKeys.find(k => k.key === key && k.appId === app.id);
      if (!foundKey) {
        return res.json({ success: false, message: "The specified license key does not exist or is invalid." });
      }
      if (foundKey.status === "banned") {
        return res.json({ success: false, message: "This license key has been banned." });
      }
      if (foundKey.status === "used" && foundKey.hwid && foundKey.hwid !== hwid) {
        return res.json({ success: false, message: "Hardware ID (HWID) mismatch. Key is bound to another PC." });
      }

      foundKey.status = "used";
      foundKey.hwid = hwid || "HWID-PC";
      foundKey.usedAt = new Date().toISOString();

      let user = authUsers.find(u => u.hwid === hwid && u.appId === app.id);
      if (!user) {
        user = {
          id: `u_${Date.now()}`,
          username: foundKey.usedBy || `User_${Math.floor(1000 + Math.random() * 9000)}`,
          appId: app.id,
          hwid: hwid || "HWID-PC",
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
        message: `License key authenticated for user '${user.username}'`,
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
