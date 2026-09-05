"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseServices } from "../../lib/firebase";
import { useAuth } from "../providers";
import { useLanguage } from "../../lib/language-context";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function Login() {
  const { user, demoMode } = useAuth();
  const { t, language } = useLanguage();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function friendlyAuthError(err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
    const messagesEn: Record<string, string> = {
      "auth/account-exists-with-different-credential": "This email already uses another sign-in method.",
      "auth/email-already-in-use": "An account already exists for this email.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/network-request-failed": "Network error. Check your connection and try again.",
      "auth/popup-blocked": "Your browser blocked the Google sign-in popup.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
      "auth/weak-password": "Use a stronger password with at least 6 characters.",
    };
    const messagesBn: Record<string, string> = {
      "auth/account-exists-with-different-credential": "এই ইমেইলে অন্য সাইন-ইন পদ্ধতি যুক্ত আছে।",
      "auth/email-already-in-use": "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি আছে।",
      "auth/invalid-credential": "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।",
      "auth/invalid-email": "সঠিক ইমেইল ঠিকানা প্রদান করুন।",
      "auth/network-request-failed": "নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।",
      "auth/popup-blocked": "আপনার ব্রাউজার গুগল সাইন-ইন পপআপ ব্লক করেছে।",
      "auth/popup-closed-by-user": "গুগল সাইন-ইন বাতিল করা হয়েছে।",
      "auth/too-many-requests": "অতিরিক্ত বার চেষ্টা করা হয়েছে। কিছুক্ষণ অপেক্ষা করুন।",
      "auth/unauthorized-domain": "এই ওয়েবসাইট ডোমেনটি ফায়ারবেস অথেন্টিকেশনে অনুমোদিত নয়।",
      "auth/weak-password": "কমপক্ষে ৬ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড দিন।",
    };
    const dict = language === "bn" ? messagesBn : messagesEn;
    return dict[code] || (err instanceof Error ? err.message : language === "bn" ? "অথেন্টিকেশন ব্যর্থ হয়েছে।" : "Authentication failed. Please try again.");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const services = getFirebaseServices();
    if (!services) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (register) {
        const credential = await createUserWithEmailAndPassword(services.auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(services.auth, email.trim(), password);
      }
      window.location.assign("/dashboard");
    } catch (authError) {
      setError(friendlyAuthError(authError));
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    const services = getFirebaseServices();
    if (!services) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(services.auth, provider);
      window.location.assign("/dashboard");
    } catch (authError) {
      setError(friendlyAuthError(authError));
      setBusy(false);
    }
  }

  async function resetPassword() {
    const services = getFirebaseServices();
    if (!services) return;
    if (!email.trim()) {
      setError(t.auth.forgotEmailAlert);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(services.auth, email.trim());
      setNotice(t.auth.resetSent);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div style={{ position: "absolute", top: "28px", right: "30px" }}>
        <LanguageSwitcher variant="header" />
      </div>

      <Link className="product-logo auth-logo" href="/">
        <span>IS</span>
        <strong>{t.nav.brand}</strong>
      </Link>

      <section className="auth-card">
        {demoMode ? (
          <>
            <span className="auth-icon">⚙</span>
            <p className="mini-pill">{t.auth.firebaseSetup}</p>
            <h1>{t.auth.connectProject}</h1>
            <p>{t.auth.connectDesc}</p>
            <div className="setup-steps">
              <span>
                <b>1</b>
                {t.auth.step1}
              </span>
              <span>
                <b>2</b>
                {t.auth.step2}
              </span>
              <span>
                <b>3</b>
                {t.auth.step3}
              </span>
              <span>
                <b>4</b>
                {t.auth.step4}
              </span>
            </div>
            <a className="primary-action" href="/dashboard">
              {t.auth.continueDemo}
            </a>
          </>
        ) : user ? (
          <>
            {user.photoURL ? (
              <span
                aria-label="Account avatar"
                className="auth-avatar"
                role="img"
                style={{ backgroundImage: `url(${user.photoURL})`, backgroundPosition: "center", backgroundSize: "cover" }}
              />
            ) : (
              <span className="auth-icon">✓</span>
            )}
            <p className="mini-pill">{t.auth.signedIn}</p>
            <h1>{user.displayName || user.email}</h1>
            <p>
              {user.email} {t.auth.connectedTo}
            </p>
            <a className="primary-action" href="/dashboard">
              {t.auth.openDashboard}
            </a>
            <button
              className="auth-switch"
              onClick={async () => {
                const services = getFirebaseServices();
                if (services) await signOut(services.auth);
                window.location.assign("/");
              }}
              type="button"
            >
              {t.auth.signOut}
            </button>
          </>
        ) : (
          <>
            <p className="mini-pill">{register ? t.auth.createAccount.toUpperCase() : t.auth.welcomeBack.toUpperCase()}</p>
            <h1>{register ? t.auth.becomeScholar : t.auth.signInToContinue}</h1>
            <p>{t.auth.authSubtitle}</p>
            <button className="google-button" disabled={busy} onClick={signInWithGoogle} type="button">
              <span aria-hidden="true">G</span> {t.auth.continueGoogle}
            </button>
            <div className="auth-divider">
              <span>{t.auth.orUseEmail}</span>
            </div>
            <form onSubmit={submit}>
              {register && (
                <label>
                  {t.auth.fullName}
                  <input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} />
                </label>
              )}
              <label>
                {t.auth.emailAddress}
                <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </label>
              <label>
                {t.auth.password}
                <input autoComplete={register ? "new-password" : "current-password"} minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
              </label>
              {!register && (
                <button className="forgot-button" disabled={busy} onClick={resetPassword} type="button">
                  {t.auth.forgotPassword}
                </button>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              {notice && <p className="form-notice" role="status">{notice}</p>}
              <button className="primary-action" disabled={busy} type="submit">
                {busy ? t.auth.pleaseWait : register ? t.auth.createAccount : t.auth.signInBtn}
              </button>
            </form>
            <button
              className="auth-switch"
              onClick={() => {
                setRegister(!register);
                setError("");
                setNotice("");
              }}
              type="button"
            >
              {register ? t.auth.alreadyHaveAcc : t.auth.newHere}
            </button>
          </>
        )}
      </section>
      <p className="auth-footer">{t.auth.footerNote}</p>
    </main>
  );
}
