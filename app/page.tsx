"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { getFirebaseServices } from "../lib/firebase";

type DemoSession = {
  module: string;
  duration: string;
  prompt: string;
  focus: string[];
};

const modules = [
  {
    name: "Speaking",
    eyebrow: "11–14 minutes",
    description: "Practice all three parts with guided prompts and criterion-level feedback.",
    color: "violet",
    icon: "SP",
    points: ["Parts 1, 2 & 3", "Fluency insights", "Pronunciation review"],
  },
  {
    name: "Writing",
    eyebrow: "60 minutes",
    description: "Write Task 1 and Task 2 responses in an exam-style workspace.",
    color: "mint",
    icon: "WR",
    points: ["Academic & General", "Four band criteria", "Detailed corrections"],
  },
  {
    name: "Reading",
    eyebrow: "60 minutes",
    description: "Build speed across authentic question formats with focused review.",
    color: "amber",
    icon: "RD",
    points: ["40-question tests", "Highlight & notes", "Answer explanations"],
  },
  {
    name: "Listening",
    eyebrow: "30 minutes",
    description: "Train for all four sections with timed audio and transcript review.",
    color: "blue",
    icon: "LS",
    points: ["Four test sections", "Playback controls", "Instant marking"],
  },
];

const demoSessions: Record<string, DemoSession> = {
  Speaking: { module: "Speaking", duration: "3 minutes", prompt: "Describe a skill you would like to learn. Explain why it interests you and how you would begin learning it.", focus: ["Fluency", "Vocabulary", "Clear structure"] },
  Writing: { module: "Writing", duration: "10 minutes", prompt: "Some people believe online learning is more effective than classroom learning. To what extent do you agree or disagree?", focus: ["Position", "Coherence", "Grammar range"] },
  Reading: { module: "Reading", duration: "6 minutes", prompt: "Read a short academic passage and complete five questions using skimming, scanning, and evidence matching.", focus: ["Main idea", "Evidence", "Time control"] },
  Listening: { module: "Listening", duration: "5 minutes", prompt: "Listen to a short university orientation extract and complete five note-completion questions.", focus: ["Prediction", "Spelling", "Detail"] },
};

export default function Home() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  function openSession(moduleName: string) {
    setSessionLoading(true);
    setSessionError("");
    const session = demoSessions[moduleName];
    if (session) {
      setSession(session);
    } else {
      setSessionError("The practice session could not be loaded. Please try again.");
    }
    setSessionLoading(false);
  }

  function authMessage(error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const messages: Record<string, string> = {
      "auth/email-already-in-use": "An account already exists for this email.", "auth/invalid-credential": "The email or password is incorrect.",
      "auth/popup-blocked": "Your browser blocked the Google sign-in popup.", "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/unauthorized-domain": "This domain is not authorized in Firebase Authentication.", "auth/weak-password": "Use a password with at least 6 characters.",
    };
    return messages[code] || "Authentication failed. Please try again.";
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const services = getFirebaseServices();
    if (!services) return setAuthError("Firebase is not configured.");
    setAuthBusy(true); setAuthError("");
    try {
      if (register) { const credential = await createUserWithEmailAndPassword(services.auth, email.trim(), password); if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() }); }
      else await signInWithEmailAndPassword(services.auth, email.trim(), password);
      window.location.assign("/dashboard");
    } catch (error) { setAuthError(authMessage(error)); setAuthBusy(false); }
  }

  async function googleLogin() {
    const services = getFirebaseServices();
    if (!services) return setAuthError("Firebase is not configured.");
    setAuthBusy(true); setAuthError("");
    try { const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: "select_account" }); await signInWithPopup(services.auth, provider); window.location.assign("/dashboard"); }
    catch (error) { setAuthError(authMessage(error)); setAuthBusy(false); }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="IELTS Scholars home">
          <span className="brand-mark" aria-hidden="true">IS</span>
          <span>IELTS <strong>Scholars</strong></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#practice">Practice</a>
          <a href="#how-it-works">How it works</a>
          <a href="#results">Results</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          <button className="button button-ghost" onClick={() => setLoginOpen(true)} type="button">Log in</button>
          <a className="button button-dark" href="#practice">Start free</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <div className="eyebrow-pill">
            <span className="pulse-dot" />
            Complete IELTS practice, in one place
          </div>
          <h1>
            Turn every practice test into a <span>clearer path to Band 8.</span>
          </h1>
          <p className="hero-lead">
            Exam-style mock tests, precise band insights, and a personalised study plan for Speaking, Writing, Reading, and Listening.
          </p>
          <div className="hero-actions">
            <a className="button button-primary button-large" href="#practice">
              Take a free mock test <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#how-it-works">
              See how it works <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="hero-proof" aria-label="Product highlights">
            <span>✓ No credit card</span>
            <span>✓ Academic &amp; General Training</span>
            <span>✓ Instant results</span>
          </div>
        </div>

        <div className="hero-product" aria-label="IELTS Scholars dashboard preview">
          <div className="product-window">
            <div className="window-bar">
              <div className="window-brand"><span>IS</span> IELTS Scholars</div>
              <div className="window-user">SR</div>
            </div>
            <div className="window-layout">
              <aside className="mock-sidebar" aria-hidden="true">
                <span className="side-active">Overview</span>
                <span>Mock tests</span>
                <span>Feedback</span>
                <span>Study plan</span>
              </aside>
              <div className="dashboard-panel">
                <div className="dashboard-heading">
                  <div>
                    <small>Good evening, Scholar</small>
                    <h2>Your target is getting closer.</h2>
                  </div>
                  <button type="button">New test +</button>
                </div>
                <div className="score-grid">
                  <article className="overall-score">
                    <span>Estimated band</span>
                    <strong>7.5</strong>
                    <small><b>+0.5</b> this month</small>
                  </article>
                  <article className="skill-chart">
                    <div className="chart-top"><span>Skill progress</span><small>Last 30 days</small></div>
                    <div className="bars" aria-label="Speaking 7.5, Writing 7, Reading 8, Listening 7.5">
                      <i style={{ height: "72%" }}><em>SP</em></i>
                      <i style={{ height: "62%" }}><em>WR</em></i>
                      <i style={{ height: "84%" }}><em>RD</em></i>
                      <i style={{ height: "74%" }}><em>LS</em></i>
                    </div>
                  </article>
                </div>
                <article className="next-action">
                  <div className="next-icon">WR</div>
                  <div><small>Recommended next</small><strong>Writing Task 2 · Opinion essay</strong></div>
                  <span>25 min</span>
                  <button type="button">Practice</button>
                </article>
              </div>
            </div>
          </div>
          <div className="floating-card feedback-card">
            <span>Criterion feedback</span>
            <strong>Task response</strong>
            <div><i style={{ width: "78%" }} /></div>
            <small>Strong position. Add one specific example.</small>
          </div>
          <div className="floating-card streak-card">
            <span>7 day streak</span>
            <strong>Keep going 🔥</strong>
          </div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Test features">
        <span>Exam-style timing</span><i />
        <span>Criterion-based scoring</span><i />
        <span>Actionable feedback</span><i />
        <span>Progress tracking</span>
      </section>

      <section className="section modules-section" id="practice">
        <div className="section-heading">
          <div>
            <p className="kicker">Four skills. One focused system.</p>
            <h2>Practice exactly what the real exam demands.</h2>
          </div>
          <p>Choose one module for a focused session, or combine all four for a complete mock test.</p>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <article className={`module-card ${module.color}`} key={module.name}>
              <div className="module-top">
                <span className="module-icon">{module.icon}</span>
                <span className="module-time">{module.eyebrow}</span>
              </div>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <ul>
                {module.points.map((point) => <li key={point}>✓ {point}</li>)}
              </ul>
              <button className="module-link" disabled={sessionLoading} onClick={() => openSession(module.name)} type="button">
                {sessionLoading ? "Preparing…" : `Try ${module.name}`} <span>→</span>
              </button>
            </article>
          ))}
        </div>
        {sessionError && <p className="inline-error" role="alert">{sessionError}</p>}
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section how-inner">
          <div className="how-intro">
            <p className="kicker">A calmer way to prepare</p>
            <h2>Know what to improve after every attempt.</h2>
            <p>IELTS Scholars turns a practice response into a short, useful action plan—so the next session has a clear purpose.</p>
            <a className="button button-primary" href="/dashboard">Explore the dashboard <span>→</span></a>
          </div>
          <div className="steps-list">
            <article>
              <span>01</span>
              <div><h3>Choose a skill</h3><p>Pick a focused module or sit a complete exam-style mock test.</p></div>
            </article>
            <article>
              <span>02</span>
              <div><h3>Complete the test</h3><p>Work with real timing, clear instructions, and distraction-free test tools.</p></div>
            </article>
            <article>
              <span>03</span>
              <div><h3>Review and improve</h3><p>See your criterion scores, explanations, and the best next practice task.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section results-section" id="results">
        <div className="results-copy">
          <p className="kicker">Feedback you can act on</p>
          <h2>Not just a score. A reason behind it.</h2>
          <p>Break down each performance criterion, review corrections in context, and follow one focused recommendation at a time.</p>
          <ul>
            <li><span>✓</span><div><strong>Criterion-level bands</strong><small>See where your overall score comes from.</small></div></li>
            <li><span>✓</span><div><strong>Clear language corrections</strong><small>Understand the issue and a stronger alternative.</small></div></li>
            <li><span>✓</span><div><strong>Next-step practice</strong><small>Turn feedback into a realistic study task.</small></div></li>
          </ul>
        </div>
        <div className="feedback-preview">
          <div className="feedback-head">
            <div><small>Writing · Task 2</small><h3>Attempt feedback</h3></div>
            <div className="band-badge"><span>Band</span><strong>7.0</strong></div>
          </div>
          <div className="criteria-list">
            {[ ["Task response", "7.5", "82%"], ["Coherence", "7.0", "74%"], ["Vocabulary", "7.0", "74%"], ["Grammar", "6.5", "66%"] ].map(([label, score, width]) => (
              <div className="criterion" key={label}>
                <div><span>{label}</span><strong>{score}</strong></div>
                <div className="criterion-bar"><i style={{ width }} /></div>
              </div>
            ))}
          </div>
          <div className="review-note">
            <span>Priority improvement</span>
            <p>Your ideas are well organised. Use a wider range of complex sentence structures while keeping errors controlled.</p>
            <button onClick={() => openSession("Writing")} type="button">Start recommended practice →</button>
          </div>
          <small className="sample-label">Illustrative sample feedback</small>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section pricing-inner">
          <div className="pricing-heading">
            <p className="kicker">Simple plans</p>
            <h2>Start free. Upgrade when you need more practice.</h2>
            <p>Clear access, no confusing bundles. Prices shown are for the sample MVP and can be changed before launch.</p>
          </div>
          <div className="pricing-grid">
            <article className="price-card">
              <span className="price-label">Starter</span>
              <h3>Free</h3>
              <p>Explore the platform and complete focused sample tests.</p>
              <ul><li>✓ 4 sample module tests</li><li>✓ Basic answer review</li><li>✓ Progress snapshot</li></ul>
              <button className="button price-button" onClick={() => setLoginOpen(true)} type="button">Create free account</button>
            </article>
            <article className="price-card featured-price">
              <span className="popular-pill">Most focused</span>
              <span className="price-label">Scholar Pro</span>
              <h3>৳799 <small>/ month</small></h3>
              <p>For candidates preparing seriously for a target test date.</p>
              <ul><li>✓ Full mock test library</li><li>✓ Detailed criterion feedback</li><li>✓ Personalised study plan</li><li>✓ Speaking and writing review</li></ul>
              <button className="button button-primary" onClick={() => setLoginOpen(true)} type="button">Start with free access</button>
            </article>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div>
          <p className="kicker">Common questions</p>
          <h2>Before you begin.</h2>
          <p>Everything you need to know about this IELTS Scholars MVP.</p>
        </div>
        <div className="faq-list">
          <details open><summary>Does this include all four IELTS modules?<span>+</span></summary><p>Yes. The product structure covers Speaking, Writing, Reading, and Listening for Academic and General Training flows.</p></details>
          <details><summary>Are the displayed band scores official?<span>+</span></summary><p>No. Practice estimates are learning guidance and are not an official IELTS result. Final scoring logic should be validated before commercial launch.</p></details>
          <details><summary>Can I use it on a phone?<span>+</span></summary><p>Yes. The landing experience and dashboard are responsive, with touch-friendly buttons and simplified mobile layouts.</p></details>
          <details><summary>Is the account and payment system live?<span>+</span></summary><p>This first version is a working product prototype. Secure authentication, database storage, AI scoring, payments, and admin tools are the next backend milestone.</p></details>
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="cta-mark">IS</span>
          <p>YOUR NEXT BAND STARTS HERE</p>
          <h2>Practice with purpose.</h2>
          <button className="button button-mint" onClick={() => openSession("Speaking")} type="button">Start a free practice <span>→</span></button>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand footer-brand" href="#top"><span className="brand-mark">IS</span><span>IELTS <strong>Scholars</strong></span></a>
          <p>Focused practice for confident IELTS candidates.</p>
          <nav aria-label="Footer navigation"><a href="#practice">Practice</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="/dashboard">Dashboard</a></nav>
        </div>
        <div className="footer-bottom"><span>© 2026 IELTS Scholars</span><span>Independent IELTS preparation product · Not affiliated with IELTS owners</span></div>
      </footer>

      {session && (
        <div className="modal-backdrop" onMouseDown={() => setSession(null)} role="presentation">
          <section aria-labelledby="session-title" aria-modal="true" className="modal-card session-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Close practice dialog" className="modal-close" onClick={() => setSession(null)} type="button">×</button>
            <div className="modal-icon">{session.module.slice(0, 2).toUpperCase()}</div>
            <p className="kicker">Free sample · {session.duration}</p>
            <h2 id="session-title">{session.module} practice</h2>
            <p className="session-prompt">{session.prompt}</p>
            <div className="focus-box"><span>This session focuses on</span><div>{session.focus.map((item) => <b key={item}>{item}</b>)}</div></div>
            <a className="button button-primary button-wide" href={`/dashboard?module=${encodeURIComponent(session.module)}`}>Begin sample session →</a>
            <small>No account needed for this sample.</small>
          </section>
        </div>
      )}

      {loginOpen && (
        <div className="modal-backdrop" onMouseDown={() => setLoginOpen(false)} role="presentation">
          <section aria-labelledby="login-title" aria-modal="true" className="modal-card login-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Close login dialog" className="modal-close" onClick={() => setLoginOpen(false)} type="button">×</button>
            <span className="brand-mark modal-brand">IS</span>
            <p className="kicker">{register ? "Create account" : "Welcome back"}</p>
            <h2 id="login-title">{register ? "Start your IELTS journey" : "Continue to IELTS Scholars"}</h2>
            <p>Sign in to save your practice and results.</p>
            <button className="google-button" disabled={authBusy} onClick={googleLogin} type="button"><span aria-hidden="true">G</span> Continue with Google</button>
            <div className="auth-divider"><span>or use email</span></div>
            <form onSubmit={submitLogin}>
              {register && <label htmlFor="name">Full name<input autoComplete="name" id="name" onChange={(event) => setName(event.target.value)} required value={name} /></label>}
              <label htmlFor="email">Email address<input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></label>
              <label htmlFor="password">Password<input autoComplete={register ? "new-password" : "current-password"} id="password" minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              {authError && <p className="form-error" role="alert">{authError}</p>}
              <button className="button button-primary button-wide" disabled={authBusy} type="submit">{authBusy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
            </form>
            <button className="auth-switch" onClick={() => { setRegister(!register); setAuthError(""); }} type="button">{register ? "Already have an account? Sign in" : "New here? Create an account"}</button>
          </section>
        </div>
      )}
    </main>
  );
}
