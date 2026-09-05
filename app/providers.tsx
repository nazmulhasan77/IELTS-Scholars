"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, getFirebaseServices, initializeFirebaseAnalytics } from "../lib/firebase";
import type { UserRole } from "../lib/types";

import { LanguageProvider, useLanguage } from "../lib/language-context";

type AuthState = { user: User | null; role: UserRole; loading: boolean; demoMode: boolean };
const AuthContext = createContext<AuthState>({ user: null, role: "student", loading: true, demoMode: !firebaseConfigured });

export function Providers({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, role: firebaseConfigured ? "student" : "admin", loading: firebaseConfigured, demoMode: !firebaseConfigured });

  useEffect(() => {
    void initializeFirebaseAnalytics().catch(() => undefined);
    const services = getFirebaseServices();
    if (!services) return;
    return onAuthStateChanged(services.auth, async (user) => {
      let role: UserRole = "student";
      if (user) {
        try {
          const admin = await getDoc(doc(services.db, "admins", user.uid));
          if (admin.exists()) role = "admin";
        } catch {
          // Authentication remains usable if Firestore has not been created yet.
        }
      }
      setState({ user, role, loading: false, demoMode: false });
    });
  }, []);

  const value = useMemo(() => state, [state]);
  return (
    <LanguageProvider>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </LanguageProvider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { useLanguage };

