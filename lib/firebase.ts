import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import type { Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase Web App configuration is public client configuration. Environment
// variables can override these defaults when deploying another installation.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAkQPA8gzXUp0r8oZpO3Cf15aCsAovETY8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ieltsscholars-addbc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ieltsscholars-addbc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ieltsscholars-addbc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "886802870608",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:886802870608:web:05fd04cbf211e366b2fc55",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-2RPSYP7EQN",
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let services: { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } | null = null;
let analytics: Analytics | null = null;

export function getFirebaseServices() {
  if (!firebaseConfigured || typeof window === "undefined") return null;
  if (services) return services;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  services = { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  return services;
}

export async function initializeFirebaseAnalytics() {
  if (!firebaseConfigured || typeof window === "undefined" || analytics) return analytics;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (!(await isSupported())) return null;
  const current = getFirebaseServices();
  if (!current) return null;
  analytics = getAnalytics(current.app);
  return analytics;
}
