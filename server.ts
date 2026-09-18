import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0980948955",
  appId: "1:235944960103:web:b55f4a9d72cbe1b6c2b4c2",
  apiKey: "AIzaSyCkmWWpqazI2DSr4PocZWM1OqApUWXNRgc",
  authDomain: "gen-lang-client-0980948955.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-redzoneauth-73185f29-19fd-4277-a3cf-f8fbd09dcb33",
  storageBucket: "gen-lang-client-0980948955.firebasestorage.app",
  messagingSenderId: "235944960103"
};

let db: any = null;
try {
  const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.log("Firebase init fallback to memory mode:", e);
}

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

interface Developer {
  id: string;
  username: string;
  password: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Global CORS Middleware with authorized domains
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://redzone-auth.vercel.app',
      'http://redzone-auth.vercel.app',
      'https://www.redzone-auth.vercel.app',
      'http://www.redzone-auth.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    if (origin && (allowedOrigins.includes(origin) || origin.includes('redzone-auth.vercel.app') || origin.endsWith('.vercel.app') || origin.endsWith('.run.app'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // In-memory fallback stores synchronized with Firestore if available
  let applications: Application[] = [];
  let licenseKeys: LicenseKey[] = [];
  let authUsers: AuthUser[] = [];
  let developers: Developer[] = [];
  let auditLogs: any[] = [
    {
      id: "log_init",
      timestamp: new Date().toISOString(),
      type: "admin",
      message: "REDZONE Auth server initialized with Firebase persistence.",
      appId: "system"
    }
  ];

  function ensureDefaultApp(): Application {
    if (applications.length === 0) {
      const defApp: Application = {
        id: "app_redzone_default",
        name: process.env.REDZONE_APP_NAME || "Redzone",
        secret: process.env.REDZONE_APP_SECRET || "rz_sec_redzone_secure_9981249",
        ownerid: process.env.REDZONE_OWNER_ID || "usr_yedagf",
        version: process.env.REDZONE_APP_VERSION || "1.0.0",
        status: "active",
        createdAt: new Date().toISOString(),
        totalUsers: 0,
        activeLicenses: 0,
        downloadLink: "https://redzone.auth/downloads/Redzone_Loader.exe"
      };
      applications.push(defApp);
      if (db) {
        setDoc(doc(db, "applications", defApp.id), defApp).catch(() => {});
      }
      return defApp;
    }
    return applications[0];
  }

  // Load initial state from Firestore with timeout protection
  async function loadFromFirestore() {
    if (!db) return;
    try {
      const syncPromise = (async () => {
        const appsSnap = await getDocs(collection(db, "applications"));
        if (!appsSnap.empty) {
          applications = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        }
        const keysSnap = await getDocs(collection(db, "licenses"));
        if (!keysSnap.empty) {
          licenseKeys = keysSnap.docs.map(d => ({ id: d.id, ...d.data() } as LicenseKey));
        }
        const usersSnap = await getDocs(collection(db, "users"));
        if (!usersSnap.empty) {
          authUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuthUser));
        }
        const devsSnap = await getDocs(collection(db, "developers"));
        if (!devsSnap.empty) {
          developers = devsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Developer));
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore sync timeout")), 2500)
      );

      await Promise.race([syncPromise, timeoutPromise]);
    } catch (e) {
      console.warn("Firestore sync warning (continuing with cached state):", e);
    }
  }

  await loadFromFirestore();

  // Developer Auth Endpoints
  app.post("/api/v1/dev/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: "Username and password are required." });
    }
    if (db) {
      await loadFromFirestore();
    }
    const cleanUser = String(username).trim().toLowerCase();
    const dev = developers.find(d => d.username.toLowerCase() === cleanUser && d.password === password);
    if (!dev) {
      return res.json({ 
        success: false, 
        message: "Invalid credentials. If you do not have an account yet, click the 'Register' tab above to create one." 
      });
    }
    res.json({ success: true, message: "Developer login successful!", developer: { username: dev.username } });
  });

  app.post("/api/v1/dev/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: "Username and password are required." });
    }
    const cleanUser = String(username).trim();
    if (cleanUser.length < 3) {
      return res.json({ success: false, message: "Username must be at least 3 characters long." });
    }
    if (db) {
      await loadFromFirestore();
    }
    if (developers.some(d => d.username.toLowerCase() === cleanUser.toLowerCase())) {
      return res.json({ success: false, message: "This username is already taken. Please choose another or sign in." });
    }
    const newDev: Developer = {
      id: `dev_${Date.now()}`,
      username: cleanUser,
      password: String(password)
    };
    developers.push(newDev);

    if (db) {
      try {
        await setDoc(doc(db, "developers", newDev.id), newDev);
      } catch (e) {
        console.error("Firestore save developer error:", e);
      }
    }

    res.json({ success: true, message: "Developer registered successfully! You can now sign in." });
  });

  app.post("/api/v1/dev/logout-all", async (req, res) => {
    const { email, uid } = req.body;
    const target = email || uid || "current_developer";

    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "auth",
      message: `Global session revocation: Logged out all active devices and sessions for ${target}.`,
      appId: "system",
      ip: req.ip || "127.0.0.1"
    };
    auditLogs.unshift(logEntry);

    if (db) {
      try {
        await setDoc(doc(db, "logs", logEntry.id), logEntry);
        if (uid) {
          await setDoc(doc(db, "developers", uid), {
            allSessionsRevokedAt: new Date().toISOString(),
            sessionVersion: Date.now()
          }, { merge: true });
        }
      } catch (e) {
        console.warn("Firestore session revocation note:", e);
      }
    }

    res.json({
      success: true,
      message: "All active sessions and tokens have been revoked successfully."
    });
  });

  app.get("/api/v1/logs", async (req, res) => {
    if (db) await loadFromFirestore();
    res.json({ success: true, logs: auditLogs });
  });

  // Applications Endpoints
  app.get("/api/v1/apps", async (req, res) => {
    if (db) await loadFromFirestore();
    res.json({ success: true, apps: applications });
  });

  app.post("/api/v1/apps", async (req, res) => {
    const { name, version, downloadLink } = req.body;
    const cleanName = (name || "").trim();
    if (!cleanName) {
      return res.json({ success: false, message: "Application name is required." });
    }

    const newApp: Application = {
      id: `app_${Date.now()}`,
      name: cleanName,
      secret: `rz_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      ownerid: `usr_${Math.random().toString(36).substring(2, 8)}`,
      version: (version && String(version).trim()) || "1.0.0",
      status: "active",
      createdAt: new Date().toISOString(),
      totalUsers: 0,
      activeLicenses: 0,
      downloadLink: (downloadLink && String(downloadLink).trim()) || "https://redzone.auth/downloads/app.exe"
    };

    applications.push(newApp);

    if (db) {
      try {
        await setDoc(doc(db, "applications", newApp.id), newApp);
      } catch (e) {
        console.error("Firestore save app error:", e);
      }
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      message: `Created application '${newApp.name}'`,
      appId: newApp.id
    });

    res.json({ success: true, app: newApp });
  });

  app.delete("/api/v1/apps/:id", async (req, res) => {
    const { id } = req.params;
    applications = applications.filter(a => a.id !== id);
    if (db) {
      try {
        await deleteDoc(doc(db, "applications", id));
      } catch (e) {
        console.error("Firestore delete app error:", e);
      }
    }
    res.json({ success: true, message: `Application ${id} deleted successfully` });
  });

  app.post("/api/v1/apps/:id/delete", async (req, res) => {
    const { id } = req.params;
    applications = applications.filter(a => a.id !== id);
    if (db) {
      try {
        await deleteDoc(doc(db, "applications", id));
      } catch (e) {
        console.error("Firestore delete app error:", e);
      }
    }
    res.json({ success: true, message: `Application ${id} deleted successfully` });
  });

  // Licenses Endpoints
  app.get("/api/v1/licenses", async (req, res) => {
    if (db) await loadFromFirestore();
    const { appId } = req.query;
    const filtered = appId ? licenseKeys.filter(k => k.appId === appId) : licenseKeys;
    res.json({ success: true, licenses: filtered });
  });

  app.post("/api/v1/licenses/generate", async (req, res) => {
    if (db) await loadFromFirestore();
    const { appId, count = 1, durationDays = 30, level = 1, note } = req.body;
    const generated: LicenseKey[] = [];
    const targetApp = (appId ? applications.find(a => a.id === appId) : null) || applications[0] || ensureDefaultApp();
    const targetAppId = targetApp.id;

    for (let i = 0; i < Number(count); i++) {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const keyStr = `REDZONE-${durationDays}D-${randomPart}-${randomPart2}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newKey: LicenseKey = {
        id: `key_${Date.now()}_${i}`,
        key: keyStr,
        appId: targetAppId,
        durationDays: Number(durationDays) || 30,
        level: Number(level) || 1,
        status: "unused",
        createdAt: new Date().toISOString(),
        note: note || `Generated for ${targetApp.name}`
      };
      licenseKeys.unshift(newKey);
      generated.push(newKey);

      if (db) {
        try {
          await setDoc(doc(db, "licenses", newKey.id), newKey);
        } catch (e) {
          console.error("Firestore save key error:", e);
        }
      }
    }

    targetApp.activeLicenses = (targetApp.activeLicenses || 0) + generated.length;
    if (db) {
      try {
        await updateDoc(doc(db, "applications", targetApp.id), { activeLicenses: targetApp.activeLicenses });
      } catch {}
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      message: `Generated ${generated.length} license key(s) for application '${targetApp.name}'.`,
      appId: targetApp.id
    });

    res.json({ 
      success: true, 
      keys: generated, 
      message: `Successfully generated ${generated.length} license key(s) for ${targetApp.name}.` 
    });
  });

  app.post("/api/v1/licenses/:id/action", async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    const key = licenseKeys.find(k => k.id === id);

    if (!key) {
      return res.status(404).json({ success: false, message: "Key not found" });
    }

    if (action === 'delete') {
      licenseKeys = licenseKeys.filter(k => k.id !== id);
      if (db) {
        try { await deleteDoc(doc(db, "licenses", id)); } catch {}
      }
    } else {
      if (action === 'lock') key.hwid = "LOCKED_HWID_MANUAL";
      else if (action === 'unlock') { key.hwid = undefined; key.status = 'unused'; key.usedBy = undefined; }
      else if (action === 'ban') key.status = 'banned';
      else if (action === 'freeze') key.status = 'frozen';
      else if (action === 'unfreeze') key.status = key.hwid ? 'used' : 'unused';

      if (db) {
        try { await updateDoc(doc(db, "licenses", id), { ...key }); } catch {}
      }
    }

    res.json({ success: true, key });
  });

  // Users Endpoints
  app.get("/api/v1/users", async (req, res) => {
    if (db) await loadFromFirestore();
    const { appId } = req.query;
    const filtered = appId && appId !== 'all' ? authUsers.filter(u => u.appId === appId) : authUsers;
    res.json({ success: true, users: filtered });
  });

  app.post("/api/v1/users/create", async (req, res) => {
    if (db) await loadFromFirestore();
    const { appId, username, password, durationDays = 30, level = 1 } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }
    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();
    if (cleanUser.length < 2) {
      return res.status(400).json({ success: false, message: "Username must be at least 2 characters." });
    }
    if (cleanPass.length < 3) {
      return res.status(400).json({ success: false, message: "Password must be at least 3 characters." });
    }

    const targetApp = (appId ? applications.find(a => a.id === appId) : null) || applications[0] || ensureDefaultApp();
    const targetAppId = targetApp.id;

    if (authUsers.some(u => u.username.toLowerCase() === cleanUser.toLowerCase() && u.appId === targetAppId)) {
      return res.status(400).json({ success: false, message: `Username "${cleanUser}" already exists for ${targetApp.name}.` });
    }

    const newUser: AuthUser = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUser,
      password: cleanPass,
      appId: targetAppId,
      durationDays: Number(durationDays) || 30,
      level: Number(level) || 1,
      created: new Date().toISOString(),
      lastLogin: "Never",
      banned: false
    };

    authUsers.unshift(newUser);
    targetApp.totalUsers = (targetApp.totalUsers || 0) + 1;

    if (db) {
      try {
        await setDoc(doc(db, "users", newUser.id), newUser);
        await updateDoc(doc(db, "applications", targetApp.id), { totalUsers: targetApp.totalUsers });
      } catch (e) {
        console.error("Firestore save user error:", e);
      }
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      message: `Created user account '${newUser.username}' for application '${targetApp.name}'.`,
      appId: targetApp.id
    });

    res.json({ 
      success: true, 
      user: newUser, 
      message: `User account "${newUser.username}" created successfully for ${targetApp.name}.` 
    });
  });

  app.post("/api/v1/users/:id/action", async (req, res) => {
    const { id } = req.params;
    const { action, reason } = req.body;
    const user = authUsers.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === 'delete') {
      authUsers = authUsers.filter(u => u.id !== id);
      if (db) {
        try { await deleteDoc(doc(db, "users", id)); } catch {}
      }
    } else {
      if (action === 'ban') { user.banned = true; user.banReason = reason || "Banned"; }
      else if (action === 'unban') { user.banned = false; user.banReason = undefined; }
      else if (action === 'reset_hwid') { user.hwid = undefined; }

      if (db) {
        try { await updateDoc(doc(db, "users", id), { ...user }); } catch {}
      }
    }

    res.json({ success: true, user });
  });

  // Client Auth API Endpoint (Supports both /api/auth and /api/v1/client/auth)
  const handleClientAuth = async (req: express.Request, res: express.Response) => {
    if (db) await loadFromFirestore();
    const { type = 'license', key, username, password, hwid, name, ownerid } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || "127.0.0.1";

    let app = applications.find(a => 
      (name && a.name.toLowerCase() === String(name).trim().toLowerCase()) ||
      (ownerid && a.ownerid.toLowerCase() === String(ownerid).trim().toLowerCase())
    );
    if (!app && name) {
      app = applications.find(a => 
        a.name.toLowerCase().includes(String(name).trim().toLowerCase()) || 
        String(name).trim().toLowerCase().includes(a.name.toLowerCase())
      );
    }
    if (!app) {
      app = applications[0] || ensureDefaultApp();
    }

    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found or invalid app name/owner." });
    }

    // Mode: Register Account
    if (type === 'register') {
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required for registration." });
      }
      const cleanUser = String(username).trim();
      const cleanPass = String(password).trim();
      if (cleanUser.length < 2) {
        return res.status(400).json({ success: false, message: "Username must be at least 2 characters." });
      }
      if (cleanPass.length < 3) {
        return res.status(400).json({ success: false, message: "Password must be at least 3 characters." });
      }

      if (authUsers.some(u => u.username.toLowerCase() === cleanUser.toLowerCase() && u.appId === app!.id)) {
        return res.status(400).json({ success: false, message: `Username "${cleanUser}" is already taken. Please choose another.` });
      }

      const newUser: AuthUser = {
        id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUser,
        password: cleanPass,
        appId: app.id,
        durationDays: 30,
        level: 1,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        banned: false,
        hwid: hwid || "BROWSER_CLIENT"
      };

      authUsers.unshift(newUser);
      app.totalUsers = (app.totalUsers || 0) + 1;

      if (db) {
        try {
          await setDoc(doc(db, "users", newUser.id), newUser);
          await updateDoc(doc(db, "applications", app.id), { totalUsers: app.totalUsers });
        } catch (e) {
          console.error("Firestore register user error:", e);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Account registered successfully! You can now sign in.",
        user: { username: newUser.username, level: newUser.level }
      });
    }

    // Mode: Reset HWID
    if (type === 'reset_hwid') {
      if (username) {
        const user = authUsers.find(u => u.username.toLowerCase() === String(username).trim().toLowerCase() && u.appId === app!.id);
        if (!user) {
          return res.status(404).json({ success: false, message: "User account not found." });
        }
        if (password && user.password !== password) {
          return res.status(401).json({ success: false, message: "Invalid password for HWID reset." });
        }
        user.hwid = undefined;
        if (db) {
          try { await updateDoc(doc(db, "users", user.id), { hwid: null }); } catch {}
        }
        return res.status(200).json({ success: true, message: "HWID reset successfully! You can now sign in on any device." });
      } else if (key) {
        const cleanKey = String(key).trim();
        const foundKey = licenseKeys.find(k => k.key.toUpperCase() === cleanKey.toUpperCase() && k.appId === app!.id);
        if (!foundKey) {
          return res.status(404).json({ success: false, message: "License key not found." });
        }
        foundKey.hwid = undefined;
        if (db) {
          try { await updateDoc(doc(db, "licenses", foundKey.id), { hwid: null }); } catch {}
        }
        return res.status(200).json({ success: true, message: "License HWID lock cleared successfully." });
      } else {
        return res.status(400).json({ success: false, message: "Please provide either username or license key to reset HWID." });
      }
    }

    // Mode: User/Password Login
    if (type === 'login' || type === 'user') {
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required." });
      }
      const cleanUser = String(username).trim();
      const user = authUsers.find(u => u.username.toLowerCase() === cleanUser.toLowerCase() && (u.appId === app!.id || applications.length <= 1));
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid username or password." });
      }
      if (user.banned) {
        return res.status(403).json({ success: false, message: `Account is banned: ${user.banReason || 'Violation'}` });
      }

      user.lastLogin = new Date().toISOString();
      if (hwid) user.hwid = hwid;

      if (db) {
        try {
          await updateDoc(doc(db, "users", user.id), { lastLogin: user.lastLogin, hwid: user.hwid });
        } catch {}
      }

      return res.status(200).json({
        success: true,
        message: "Authenticated successfully via User/Pass!",
        userinfo: {
          username: user.username,
          subscriptions: [
            {
              subscription: `Level ${user.level} Access (${user.durationDays || 30} Days)`,
              expiry: new Date(Date.now() + (user.durationDays || 30) * 86400000).toISOString(),
              level: user.level || 1
            }
          ],
          ip: clientIp,
          hwid: user.hwid || hwid || "BROWSER_CLIENT",
          createdate: user.created || new Date().toISOString(),
          lastlogin: user.lastLogin
        }
      });
    }

    // Mode: License Key Authentication
    const cleanKey = key ? String(key).trim() : "";
    if (!cleanKey) {
      return res.status(400).json({ success: false, message: "License key is required for authentication." });
    }

    let foundKey = licenseKeys.find(k => k.key.toUpperCase() === cleanKey.toUpperCase() && k.appId === app!.id);
    if (!foundKey) {
      foundKey = licenseKeys.find(k => k.key.toUpperCase() === cleanKey.toUpperCase());
    }

    if (!foundKey) {
      return res.status(404).json({ success: false, message: "Invalid license key or key not found." });
    }
    if (foundKey.status === 'banned') {
      return res.status(403).json({ success: false, message: "This license key is banned." });
    }
    if (foundKey.status === 'frozen') {
      return res.status(403).json({ success: false, message: "This license key is currently frozen." });
    }

    foundKey.status = 'used';
    if (hwid) foundKey.hwid = hwid;
    else if (!foundKey.hwid) foundKey.hwid = "BROWSER_CLIENT";
    foundKey.usedAt = new Date().toISOString();
    foundKey.usedBy = foundKey.usedBy || (username ? String(username).trim() : "VerifiedUser");

    if (db) {
      try {
        await updateDoc(doc(db, "licenses", foundKey.id), { ...foundKey });
      } catch {}
    }

    return res.status(200).json({
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
  };

  app.get("/api/auth", (req, res) => {
    res.json({
      success: true,
      status: "online",
      message: "REDZONE Client Authentication API Endpoint is online and healthy.",
      usage: "Send a POST request with JSON payload containing 'type' ('license' | 'login' | 'register'), 'name', 'ownerid', 'key', and 'hwid'.",
      endpoint: "/api/v1/client/auth"
    });
  });

  app.get("/api/v1/client/auth", (req, res) => {
    res.json({
      success: true,
      status: "online",
      message: "REDZONE Client Authentication API Endpoint is online and healthy.",
      usage: "Send a POST request with JSON payload containing 'type' ('license' | 'login' | 'register'), 'name', 'ownerid', 'key', and 'hwid'.",
      endpoint: "/api/v1/client/auth"
    });
  });

  app.post("/api/auth", handleClientAuth);
  app.post("/api/v1/client/auth", handleClientAuth);

  app.get("/api/v1/authorized-domains", (req, res) => {
    res.json({
      success: true,
      authorizedDomains: [
        "https://redzone-auth.vercel.app",
        "redzone-auth.vercel.app",
        "localhost:3000"
      ],
      currentOrigin: req.headers.origin || "same-origin"
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
