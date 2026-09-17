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
  status: 'unused' | 'used' | 'banned' | 'frozen';
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
  durationDays: number;
  level: number;
  hwid?: string;
  ip?: string;
  created: string;
  lastLogin: string;
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

  // Global CORS Middleware
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Fresh Start: 0 applications initially until developer logs in and creates one
  let applications: Application[] = [];
  let licenseKeys: LicenseKey[] = [];
  let authUsers: AuthUser[] = [];
  let subscriptionPlans: SubscriptionPlan[] = [];
  let webhooks: WebhookConfig[] = [];
  let auditLogs: AuditLog[] = [
    {
      id: "log_init",
      timestamp: new Date().toISOString(),
      type: "admin",
      message: "REDZONE Auth server initialized. Please register or login as developer to create applications.",
      appId: "system"
    }
  ];

  // Developer Admin Accounts (for panel login)
  let developers: { username: string; password: string }[] = [
    { username: "admin", password: "password123" }
  ];

  // Developer Auth Endpoints
  app.post("/api/v1/dev/login", (req, res) => {
    const { username, password } = req.body;
    const dev = developers.find(d => d.username === username && d.password === password);
    if (!dev) {
      return res.json({ success: false, message: "Invalid developer username or password." });
    }
    res.json({ success: true, message: "Developer login successful!" });
  });

  app.post("/api/v1/dev/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: "Username and password required." });
    }
    if (developers.some(d => d.username === username)) {
      return res.json({ success: false, message: "Developer username already exists." });
    }
    developers.push({ username, password });
    res.json({ success: true, message: "Developer registered successfully!" });
  });

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

  // Advanced License Key actions: delete, lock, unlock, ban, freeze
  app.post("/api/v1/licenses/:id/action", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'delete' | 'lock' | 'unlock' | 'ban' | 'freeze' | 'unfreeze'
    const key = licenseKeys.find(k => k.id === id);

    if (!key) {
      return res.status(404).json({ success: false, message: "Key not found" });
    }

    if (action === 'delete') {
      licenseKeys = licenseKeys.filter(k => k.id !== id);
    } else if (action === 'lock') {
      key.hwid = "LOCKED_HWID_MANUAL";
    } else if (action === 'unlock') {
      key.hwid = undefined;
      key.status = 'unused';
      key.usedBy = undefined;
    } else if (action === 'ban') {
      key.status = 'banned';
    } else if (action === 'freeze') {
      key.status = 'frozen';
    } else if (action === 'unfreeze') {
      key.status = key.hwid ? 'used' : 'unused';
    }

    res.json({ success: true, key });
  });

  app.delete("/api/v1/licenses/:id", (req, res) => {
    const { id } = req.params;
    licenseKeys = licenseKeys.filter(k => k.id !== id);
    res.json({ success: true });
  });

  // User / Pass Creator Endpoints
  app.get("/api/v1/users", (req, res) => {
    const { appId } = req.query;
    const filtered = appId ? authUsers.filter(u => u.appId === appId) : authUsers;
    res.json({ success: true, users: filtered });
  });

  app.post("/api/v1/users/create", (req, res) => {
    const { appId, username, password, durationDays = 30, level = 1 } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: "Username and password required." });
    }
    const targetAppId = appId || applications[0]?.id;
    if (authUsers.some(u => u.username === username && u.appId === targetAppId)) {
      return res.json({ success: false, message: "Username already exists for this application." });
    }

    const newUser: AuthUser = {
      id: `u_${Date.now()}`,
      username,
      password,
      appId: targetAppId,
      durationDays: Number(durationDays),
      level: Number(level),
      created: new Date().toISOString(),
      lastLogin: "Never",
      banned: false
    };

    authUsers.unshift(newUser);
    const app = applications.find(a => a.id === targetAppId);
    if (app) app.totalUsers += 1;

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      message: `Created user account '${username}' with ${durationDays} days access`,
      appId: targetAppId
    });

    res.json({ success: true, user: newUser });
  });

  app.post("/api/v1/users/:id/action", (req, res) => {
    const { id } = req.params;
    const { action, reason } = req.body; // 'delete' | 'ban' | 'unban' | 'reset_hwid'
    const user = authUsers.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === 'delete') {
      authUsers = authUsers.filter(u => u.id !== id);
    } else if (action === 'ban') {
      user.banned = true;
      user.banReason = reason || "Banned by developer";
    } else if (action === 'unban') {
      user.banned = false;
      user.banReason = undefined;
    } else if (action === 'reset_hwid') {
      user.hwid = undefined;
    }

    res.json({ success: true, user });
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

  // REDZONE Auth Client API Endpoint (KeyAuth compatible: supports license keys & user/pass, no HWID mandatory)
  app.post("/api/v1/client/auth", (req, res) => {
    const { type, key, username, password, hwid, name, ownerid } = req.body;
    const clientIp = req.ip || "127.0.0.1";

    let app = applications.find(a => a.name.toLowerCase() === (name || "").toLowerCase());
    if (!app && name) {
      app = applications.find(a => a.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (!app) {
      app = applications[0];
    }

    if (!app) {
      return res.json({ success: false, message: "Application not found or invalid app name." });
    }

    // 1. User & Pass Login / Validation
    if (type === 'login' || type === 'user') {
      if (!username || !password) {
        return res.json({ success: false, message: "Username and password required." });
      }
      const user = authUsers.find(u => u.username === username && u.appId === app.id);
      if (!user || user.password !== password) {
        return res.json({ success: false, message: "Invalid username or password." });
      }
      if (user.banned) {
        return res.json({ success: false, message: `Account is banned: ${user.banReason || 'Violation'}` });
      }

      user.lastLogin = new Date().toISOString();
      if (hwid) user.hwid = hwid;

      return res.json({
        success: true,
        message: "Authenticated successfully via User/Pass!",
        userinfo: {
          username: user.username,
          subscriptions: [
            {
              subscription: `Level ${user.level} Access`,
              expiry: new Date(Date.now() + user.durationDays * 86400000).toISOString(),
              level: user.level
            }
          ],
          ip: clientIp,
          hwid: user.hwid || "N/A",
          createdate: user.created,
          lastlogin: user.lastLogin
        }
      });
    }

    // 2. License Key Validation (Matches user JS snippet: type: 'license', key, name, ownerid)
    const foundKey = licenseKeys.find(k => k.key === key && k.appId === app.id);
    if (!foundKey) {
      return res.json({ success: false, message: "Invalid license key or key not found." });
    }
    if (foundKey.status === 'banned') {
      return res.json({ success: false, message: "This license key is banned." });
    }
    if (foundKey.status === 'frozen') {
      return res.json({ success: false, message: "This license key is currently frozen." });
    }

    foundKey.status = 'used';
    if (hwid) {
      foundKey.hwid = hwid;
    } else if (!foundKey.hwid) {
      foundKey.hwid = "BROWSER_CLIENT";
    }
    foundKey.usedAt = new Date().toISOString();
    foundKey.usedBy = foundKey.usedBy || "ClientUser";

    return res.json({
      success: true,
      message: "Successfully authenticated with REDZONE Auth!",
      userinfo: {
        username: foundKey.usedBy,
        subscriptions: [
          {
            subscription: `Level ${foundKey.level} Access (${foundKey.durationDays} Days)`,
            expiry: new Date(Date.now() + foundKey.durationDays * 86400000).toISOString(),
            level: foundKey.level
          }
        ],
        ip: clientIp,
        hwid: foundKey.hwid,
        createdate: foundKey.createdAt,
        lastlogin: new Date().toISOString()
      }
    });
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
