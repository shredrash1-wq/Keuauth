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
      message: "REDZONE Auth server initialized. Ready for requests.",
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
    
    const targetApp = applications.find(a => a.id === appId);
    if (targetApp) {
      targetApp.activeLicenses += generated.length;
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "license",
      message: `Generated ${count} license key(s)`,
      appId: appId || "system"
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

    // Default app if none created yet
    let app = applications.find(a => a.name.toLowerCase() === (name || "").toLowerCase()) || applications[0];
    if (!app && applications.length === 0) {
      app = {
        id: "app_default",
        name: name || "RedZone Default App",
        secret: "rz_sec_default",
        ownerid: ownerid || "usr_redzone",
        version: "1.0.0",
        status: "active",
        createdAt: new Date().toISOString(),
        totalUsers: 0,
        activeLicenses: 0,
        downloadLink: "https://redzone.auth/downloads/loader.exe"
      };
      applications.push(app);
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

      return res.json({ success: true, message: "Account registered successfully!" });
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

    if (type === "license") {
      const foundKey = licenseKeys.find(k => k.key === key && k.appId === app.id);
      if (!foundKey && licenseKeys.length === 0) {
        // Auto-accept key for testing if 0 keys created yet
        const virtualKey: LicenseKey = {
          id: `key_${Date.now()}`,
          key: key || "REDZONE-TEST-KEY",
          appId: app.id,
          durationDays: 30,
          level: 1,
          status: "used",
          usedBy: "tester",
          createdAt: new Date().toISOString()
        };
        licenseKeys.push(virtualKey);
      }

      const validKey = licenseKeys.find(k => k.key === key && k.appId === app.id) || licenseKeys[0];
      if (!validKey) {
        return res.json({ success: false, message: "The specified license key does not exist." });
      }
      if (validKey.status === "banned") {
        return res.json({ success: false, message: "This license key is banned." });
      }

      validKey.status = "used";
      validKey.hwid = hwid || "HWID-PC";
      validKey.usedAt = new Date().toISOString();

      let user = authUsers.find(u => u.hwid === hwid && u.appId === app.id);
      if (!user) {
        user = {
          id: `u_${Date.now()}`,
          username: validKey.usedBy || `User_${Math.floor(1000 + Math.random() * 9000)}`,
          appId: app.id,
          hwid: hwid || "HWID-PC",
          ip: clientIp,
          created: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          subscriptions: [
            {
              subscription: `Level ${validKey.level} Access`,
              expiry: new Date(Date.now() + validKey.durationDays * 86400000).toISOString(),
              level: validKey.level
            }
          ],
          banned: false
        };
        authUsers.push(user);
        app.totalUsers += 1;
      } else {
        user.lastLogin = new Date().toISOString();
      }

      validKey.usedBy = user.username;

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
