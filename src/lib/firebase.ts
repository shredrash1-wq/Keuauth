import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0980948955",
  appId: "1:235944960103:web:b55f4a9d72cbe1b6c2b4c2",
  apiKey: "AIzaSyCkmWWpqazI2DSr4PocZWM1OqApUWXNRgc",
  authDomain: "gen-lang-client-0980948955.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-redzoneauth-73185f29-19fd-4277-a3cf-f8fbd09dcb33",
  storageBucket: "gen-lang-client-0980948955.firebasestorage.app",
  messagingSenderId: "235944960103"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
