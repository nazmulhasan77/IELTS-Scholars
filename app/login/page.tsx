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

function friendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
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
  return messages[code] || (error instanceof Error ? error.message : "Authentication failed. Please try again.");
}

export default function Login() {
  const { user, demoMode } = useAuth();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

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
      setError("Enter your email address first, then choose Forgot password.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(services.auth, email.trim());
      setNotice("Password reset email sent. Check your inbox.");
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="product-logo auth-logo" href="/">
        <span>IS</span><strong>IELTS Scholars</strong>
      </Link>
      <section className="auth-card">
        {demoMode ? (
          <>
            <span className="auth-icon">⚙</span>
            <p className="mini-pill">FIREBASE SETUP</p>
            <h1>Connect your project</h1>
            <p>Add your Firebase Web App values, enable Email/Password and Google Authentication, then restart the app.</p>
            <div className="setup-steps">
              <span><b>1</b>Create Firebase project</span>
              <span><b>2</b>Enable Email and Google sign-in</span>
              <span><b>3</b>Add your authorized domains</span>
              <span><b>4</b>Deploy included rules</span>
            </div>
            <a className="primary-action" href="/dashboard">Continue in demo mode →</a>
          </>
        ) : user ? (
          <>
            {user.photoURL ? <span aria-label="Account avatar" className="auth-avatar" role="img" style={{ backgroundImage: `url(${user.photoURL})`, backgroundPosition: "center", backgroundSize: "cover" }} /> : <span className="auth-icon">✓</span>}
            <p className="mini-pill">SIGNED IN</p>
            <h1>{user.displayName || user.email}</h1>
            <p>{user.email} is connected to IELTS Scholars.</p>
            <a className="primary-action" href="/dashboard">Open dashboard →</a>
            <button className="auth-switch" onClick={async () => {
              const services = getFirebaseServices();
              if (services) await signOut(services.auth);
              window.location.assign("/");
            }} type="button">Sign out</button>
          </>
        ) : (
          <>
            <p className="mini-pill">{register ? "CREATE ACCOUNT" : "WELCOME BACK"}</p>
            <h1>{register ? "Become a Scholar" : "Sign in to continue"}</h1>
            <p>Save progress, attempts and personalised practice history.</p>
            <button className="google-button" disabled={busy} onClick={signInWithGoogle} type="button">
              <span aria-hidden="true">G</span> Continue with Google
            </button>
            <div className="auth-divider"><span>or use email</span></div>
            <form onSubmit={submit}>
              {register && <label>Full name<input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label>}
              <label>Email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
              <label>Password<input autoComplete={register ? "new-password" : "current-password"} minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              {!register && <button className="forgot-button" disabled={busy} onClick={resetPassword} type="button">Forgot password?</button>}
              {error && <p className="form-error" role="alert">{error}</p>}
              {notice && <p className="form-notice" role="status">{notice}</p>}
              <button className="primary-action" disabled={busy} type="submit">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
            </form>
            <button className="auth-switch" onClick={() => {
              setRegister(!register);
              setError("");
              setNotice("");
            }} type="button">{register ? "Already have an account? Sign in" : "New here? Create an account"}</button>
          </>
        )}
      </section>
      <p className="auth-footer">© 2026 IELTS Scholars · Independent preparation platform</p>
    </main>
  );
}
