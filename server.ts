import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForPreviewMode12345",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0980948955.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0980948955",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0980948955.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

let db: any = null;
try {
  const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(firebaseApp);
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

  // In-memory fallback stores synchronized with Firestore if available
  let applications: Application[] = [];
  let licenseKeys: LicenseKey[] = [];
  let authUsers: AuthUser[] = [];
  let developers: Developer[] = [
    { id: "dev_admin", username: "admin", password: "password123" }
  ];
  let auditLogs: any[] = [
    {
      id: "log_init",
      timestamp: new Date().toISOString(),
      type: "admin",
      message: "REDZONE Auth server initialized with Firebase persistence.",
      appId: "system"
    }
  ];

  // Load initial state from Firestore
  async function loadFromFirestore() {
    if (!db) return;
    try {
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
    } catch (e) {
      console.error("Error loading from Firestore:", e);
    }
  }

  await loadFromFirestore();

  // Developer Auth Endpoints
  app.post("/api/v1/dev/login", async (req, res) => {
    const { username, password } = req.body;
    if (db) {
      await loadFromFirestore();
    }
    const dev = developers.find(d => d.username === username && d.password === password);
    if (!dev) {
      return res.json({ success: false, message: "Invalid developer username or password." });
    }
    res.json({ success: true, message: "Developer login successful!", developer: { username: dev.username } });
  });

  app.post("/api/v1/dev/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: "Username and password required." });
    }
    if (developers.some(d => d.username === username)) {
      return res.json({ success: false, message: "Developer username already exists." });
    }
    const newDev: Developer = {
      id: `dev_${Date.now()}`,
      username,
      password
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

  // Applications Endpoints
  app.get("/api/v1/apps", async (req, res) => {
    if (db) await loadFromFirestore();
    res.json({ success: true, apps: applications });
  });

  app.post("/api/v1/apps", async (req, res) => {
    const { name, version, downloadLink } = req.body;
    if (!name) {
      return res.json({ success: false, message: "Application name is required." });
    }

    const newApp: Application = {
      id: `app_${Date.now()}`,
      name: name.trim(),
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

  // Licenses Endpoints
  app.get("/api/v1/licenses", async (req, res) => {
    if (db) await loadFromFirestore();
    const { appId } = req.query;
    const filtered = appId ? licenseKeys.filter(k => k.appId === appId) : licenseKeys;
    res.json({ success: true, licenses: filtered });
  });

  app.post("/api/v1/licenses/generate", async (req, res) => {
    const { appId, count = 1, durationDays = 30, level = 1, note } = req.body;
    const generated: LicenseKey[] = [];
    const targetAppId = appId || applications[0]?.id || "app_default";

    for (let i = 0; i < Number(count); i++) {
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

      if (db) {
        try {
          await setDoc(doc(db, "licenses", newKey.id), newKey);
        } catch (e) {
          console.error("Firestore save key error:", e);
        }
      }
    }

    const targetApp = applications.find(a => a.id === targetAppId);
    if (targetApp) {
      targetApp.activeLicenses += generated.length;
      if (db) {
        try {
          await updateDoc(doc(db, "applications", targetApp.id), { activeLicenses: targetApp.activeLicenses });
        } catch {}
      }
    }

    res.json({ success: true, keys: generated });
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
    const filtered = appId ? authUsers.filter(u => u.appId === appId) : authUsers;
    res.json({ success: true, users: filtered });
  });

  app.post("/api/v1/users/create", async (req, res) => {
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
    if (db) {
      try {
        await setDoc(doc(db, "users", newUser.id), newUser);
      } catch (e) {
        console.error("Firestore save user error:", e);
      }
    }

    res.json({ success: true, user: newUser });
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

  // Client Auth API Endpoint (KeyAuth compatible REST interface)
  app.post("/api/v1/client/auth", async (req, res) => {
    if (db) await loadFromFirestore();
    const { type, key, username, password, hwid, name } = req.body;
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

    // License key auth
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
    if (hwid) foundKey.hwid = hwid;
    else if (!foundKey.hwid) foundKey.hwid = "BROWSER_CLIENT";
    foundKey.usedAt = new Date().toISOString();
    foundKey.usedBy = foundKey.usedBy || "ClientUser";

    if (db) {
      try {
        await updateDoc(doc(db, "licenses", foundKey.id), { ...foundKey });
      } catch {}
    }

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
