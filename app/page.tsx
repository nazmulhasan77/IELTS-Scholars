"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { getFirebaseServices } from "../lib/firebase";
import { useLanguage } from "../lib/language-context";
import LanguageSwitcher from "../components/LanguageSwitcher";

type DemoSession = {
  key: string;
  module: string;
  duration: string;
  prompt: string;
  focus: readonly string[];
};

export default function Home() {
  const { t, language } = useLanguage();
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

  const modules = [
    {
      key: "speaking" as const,
      color: "violet",
      icon: "SP",
      ...t.modules.speaking,
    },
    {
      key: "writing" as const,
      color: "mint",
      icon: "WR",
      ...t.modules.writing,
    },
    {
      key: "reading" as const,
      color: "amber",
      icon: "RD",
      ...t.modules.reading,
    },
    {
      key: "listening" as const,
      color: "blue",
      icon: "LS",
      ...t.modules.listening,
    },
  ];

  function openSession(moduleKey: "speaking" | "writing" | "reading" | "listening") {
    setSessionLoading(true);
    setSessionError("");
    const m = t.modules[moduleKey];
    if (m) {
      setSession({
        key: moduleKey,
        module: m.name,
        duration: m.sampleDuration,
        prompt: m.samplePrompt,
        focus: m.sampleFocus,
      });
    } else {
      setSessionError(language === "bn" ? "প্র্যাকটিস সেশন লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।" : "The practice session could not be loaded. Please try again.");
    }
    setSessionLoading(false);
  }

  function authMessage(error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const messagesEn: Record<string, string> = {
      "auth/email-already-in-use": "An account already exists for this email.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/popup-blocked": "Your browser blocked the Google sign-in popup.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/unauthorized-domain": "This domain is not authorized in Firebase Authentication.",
      "auth/weak-password": "Use a password with at least 6 characters.",
    };
    const messagesBn: Record<string, string> = {
      "auth/email-already-in-use": "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।",
      "auth/invalid-credential": "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।",
      "auth/popup-blocked": "আপনার ব্রাউজার গুগল সাইন-ইন পপআপ ব্লক করেছে।",
      "auth/popup-closed-by-user": "গুগল সাইন-ইন বাতিল করা হয়েছে।",
      "auth/unauthorized-domain": "এই ওয়েবসাইট ডোমেনটি ফায়ারবেস অথেন্টিকেশনে অনুমোদিত নয়।",
      "auth/weak-password": "কমপক্ষে ৬ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড দিন।",
    };
    const dict = language === "bn" ? messagesBn : messagesEn;
    return dict[code] || (language === "bn" ? "অথেন্টিকেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" : "Authentication failed. Please try again.");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const services = getFirebaseServices();
    if (!services) return setAuthError(language === "bn" ? "ফায়ারবেস কনফিগার করা নেই।" : "Firebase is not configured.");
    setAuthBusy(true);
    setAuthError("");
    try {
      if (register) {
        const credential = await createUserWithEmailAndPassword(services.auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(services.auth, email.trim(), password);
      }
      window.location.assign("/dashboard");
    } catch (error) {
      setAuthError(authMessage(error));
      setAuthBusy(false);
    }
  }

  async function googleLogin() {
    const services = getFirebaseServices();
    if (!services) return setAuthError(language === "bn" ? "ফায়ারবেস কনফিগার করা নেই।" : "Firebase is not configured.");
    setAuthBusy(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(services.auth, provider);
      window.location.assign("/dashboard");
    } catch (error) {
      setAuthError(authMessage(error));
      setAuthBusy(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="IELTS Scholars home">
          <span className="brand-mark" aria-hidden="true">IS</span>
          <span>IELTS <strong>Scholars</strong></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#practice">{t.landing.navPractice}</a>
          <a href="#how-it-works">{t.landing.navHowItWorks}</a>
          <a href="#results">{t.landing.navResults}</a>
          <a href="#pricing">{t.landing.navPricing}</a>
        </nav>
        <div className="header-actions">
          <LanguageSwitcher variant="subtle" />
          <button className="button button-ghost" onClick={() => setLoginOpen(true)} type="button">{t.landing.login}</button>
          <a className="button button-dark" href="#practice">{t.landing.startFree}</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <div className="eyebrow-pill">
            <span className="pulse-dot" />
            {t.landing.eyebrow}
          </div>
          <h1>
            {t.landing.heroTitlePrefix}<span>{t.landing.heroTitleHighlight}</span>
          </h1>
          <p className="hero-lead">
            {t.landing.heroLead}
          </p>
          <div className="hero-actions">
            <a className="button button-primary button-large" href="#practice">
              {t.landing.ctaMock} <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#how-it-works">
              {t.landing.ctaHowItWorks} <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="hero-proof" aria-label="Product highlights">
            <span>{t.landing.proofNoCard}</span>
            <span>{t.landing.proofTraining}</span>
            <span>{t.landing.proofResults}</span>
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
                <span className="side-active">{t.nav.overview}</span>
                <span>{t.nav.fullMock}</span>
                <span>{t.landing.criterionFeedback}</span>
                <span>{t.landing.recommendedNext}</span>
              </aside>
              <div className="dashboard-panel">
                <div className="dashboard-heading">
                  <div>
                    <small>{t.landing.previewGreeting}</small>
                    <h2>{t.landing.previewTitle}</h2>
                  </div>
                  <button type="button">{t.landing.newTest}</button>
                </div>
                <div className="score-grid">
                  <article className="overall-score">
                    <span>{t.landing.estimatedBand}</span>
                    <strong>7.5</strong>
                    <small><b>{t.landing.monthGain}</b></small>
                  </article>
                  <article className="skill-chart">
                    <div className="chart-top"><span>{t.landing.skillProgress}</span><small>{t.landing.last30Days}</small></div>
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
                  <div><small>{t.landing.recommendedNext}</small><strong>{t.landing.writingTask2Topic}</strong></div>
                  <span>{t.landing.duration25min}</span>
                  <button type="button">{t.landing.practiceBtn}</button>
                </article>
              </div>
            </div>
          </div>
          <div className="floating-card feedback-card">
            <span>{t.landing.criterionFeedback}</span>
            <strong>{t.landing.taskResponse}</strong>
            <div><i style={{ width: "78%" }} /></div>
            <small>{t.landing.feedbackTip}</small>
          </div>
          <div className="floating-card streak-card">
            <span>{t.landing.streak}</span>
            <strong>{t.landing.keepGoing}</strong>
          </div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Test features">
        <span>{t.landing.signalTiming}</span><i />
        <span>{t.landing.signalScoring}</span><i />
        <span>{t.landing.signalFeedback}</span><i />
        <span>{t.landing.signalTracking}</span>
      </section>

      <section className="section modules-section" id="practice">
        <div className="section-heading">
          <div>
            <p className="kicker">{t.landing.kickerSkills}</p>
            <h2>{t.landing.headingSkills}</h2>
          </div>
          <p>{t.landing.subSkills}</p>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <article className={`module-card ${module.color}`} key={module.key}>
              <div className="module-top">
                <span className="module-icon">{module.icon}</span>
                <span className="module-time">{module.duration}</span>
              </div>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <ul>
                {module.points.map((point) => <li key={point}>✓ {point}</li>)}
              </ul>
              <button className="module-link" disabled={sessionLoading} onClick={() => openSession(module.key)} type="button">
                {sessionLoading ? t.landing.preparing : `${t.landing.tryModule} ${module.name}`} <span>→</span>
              </button>
            </article>
          ))}
        </div>
        {sessionError && <p className="inline-error" role="alert">{sessionError}</p>}
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section how-inner">
          <div className="how-intro">
            <p className="kicker">{t.landing.kickerCalm}</p>
            <h2>{t.landing.headingImprove}</h2>
            <p>{t.landing.leadImprove}</p>
            <a className="button button-primary" href="/dashboard">{t.landing.exploreDashboard} <span>→</span></a>
          </div>
          <div className="steps-list">
            <article>
              <span>01</span>
              <div><h3>{t.landing.step1Title}</h3><p>{t.landing.step1Desc}</p></div>
            </article>
            <article>
              <span>02</span>
              <div><h3>{t.landing.step2Title}</h3><p>{t.landing.step2Desc}</p></div>
            </article>
            <article>
              <span>03</span>
              <div><h3>{t.landing.step3Title}</h3><p>{t.landing.step3Desc}</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section results-section" id="results">
        <div className="results-copy">
          <p className="kicker">{t.landing.kickerResults}</p>
          <h2>{t.landing.headingResults}</h2>
          <p>{t.landing.leadResults}</p>
          <ul>
            <li><span>✓</span><div><strong>{t.landing.bullet1Title}</strong><small>{t.landing.bullet1Sub}</small></div></li>
            <li><span>✓</span><div><strong>{t.landing.bullet2Title}</strong><small>{t.landing.bullet2Sub}</small></div></li>
            <li><span>✓</span><div><strong>{t.landing.bullet3Title}</strong><small>{t.landing.bullet3Sub}</small></div></li>
          </ul>
        </div>
        <div className="feedback-preview">
          <div className="feedback-head">
            <div><small>{t.landing.feedbackHeadWriting}</small><h3>{t.landing.feedbackHeadAttempt}</h3></div>
            <div className="band-badge"><span>{t.landing.bandLabel}</span><strong>7.0</strong></div>
          </div>
          <div className="criteria-list">
            {[
              [t.landing.critTaskResponse, "7.5", "82%"],
              [t.landing.critCoherence, "7.0", "74%"],
              [t.landing.critVocabulary, "7.0", "74%"],
              [t.landing.critGrammar, "6.5", "66%"],
            ].map(([label, score, width]) => (
              <div className="criterion" key={label}>
                <div><span>{label}</span><strong>{score}</strong></div>
                <div className="criterion-bar"><i style={{ width }} /></div>
              </div>
            ))}
          </div>
          <div className="review-note">
            <span>{t.landing.priorityImprovement}</span>
            <p>{t.landing.priorityNote}</p>
            <button onClick={() => openSession("writing")} type="button">{t.landing.startRecommended}</button>
          </div>
          <small className="sample-label">{t.landing.sampleFeedback}</small>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section pricing-inner">
          <div className="pricing-heading">
            <p className="kicker">{t.landing.kickerPricing}</p>
            <h2>{t.landing.headingPricing}</h2>
            <p>{t.landing.leadPricing}</p>
          </div>
          <div className="pricing-grid">
            <article className="price-card">
              <span className="price-label">{t.landing.planStarter}</span>
              <h3>{t.landing.planFree}</h3>
              <p>{t.landing.starterDesc}</p>
              <ul>
                <li>{t.landing.starterItem1}</li>
                <li>{t.landing.starterItem2}</li>
                <li>{t.landing.starterItem3}</li>
              </ul>
              <button className="button price-button" onClick={() => setLoginOpen(true)} type="button">{t.landing.createFreeAcc}</button>
            </article>
            <article className="price-card featured-price">
              <span className="popular-pill">{t.landing.mostFocused}</span>
              <span className="price-label">{t.landing.planPro}</span>
              <h3>{t.landing.proPrice} <small>{t.landing.perMonth}</small></h3>
              <p>{t.landing.proDesc}</p>
              <ul>
                <li>{t.landing.proItem1}</li>
                <li>{t.landing.proItem2}</li>
                <li>{t.landing.proItem3}</li>
                <li>{t.landing.proItem4}</li>
              </ul>
              <button className="button button-primary" onClick={() => setLoginOpen(true)} type="button">{t.landing.startFreeAccess}</button>
            </article>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div>
          <p className="kicker">{t.landing.kickerFaq}</p>
          <h2>{t.landing.headingFaq}</h2>
          <p>{t.landing.leadFaq}</p>
        </div>
        <div className="faq-list">
          <details open><summary>{t.landing.faq1Q}<span>+</span></summary><p>{t.landing.faq1A}</p></details>
          <details><summary>{t.landing.faq2Q}<span>+</span></summary><p>{t.landing.faq2A}</p></details>
          <details><summary>{t.landing.faq3Q}<span>+</span></summary><p>{t.landing.faq3A}</p></details>
          <details><summary>{t.landing.faq4Q}<span>+</span></summary><p>{t.landing.faq4A}</p></details>
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="cta-mark">IS</span>
          <p>{t.landing.ctaBannerKicker}</p>
          <h2>{t.landing.ctaBannerTitle}</h2>
          <button className="button button-mint" onClick={() => openSession("speaking")} type="button">{t.landing.ctaBannerBtn} <span>→</span></button>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand footer-brand" href="#top"><span className="brand-mark">IS</span><span>IELTS <strong>Scholars</strong></span></a>
          <p>{t.landing.footerTagline}</p>
          <nav aria-label="Footer navigation">
            <a href="#practice">{t.landing.navPractice}</a>
            <a href="#how-it-works">{t.landing.navHowItWorks}</a>
            <a href="#pricing">{t.landing.navPricing}</a>
            <a href="/dashboard">{t.nav.dashboard}</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>{t.landing.footerCopy}</span>
          <span>{t.landing.footerDisclaimer}</span>
        </div>
      </footer>

      {session && (
        <div className="modal-backdrop" onMouseDown={() => setSession(null)} role="presentation">
          <section aria-labelledby="session-title" aria-modal="true" className="modal-card session-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Close practice dialog" className="modal-close" onClick={() => setSession(null)} type="button">×</button>
            <div className="modal-icon">{session.module.slice(0, 2).toUpperCase()}</div>
            <p className="kicker">{t.landing.sampleModalKicker} {session.duration}</p>
            <h2 id="session-title">{session.module} {language === "bn" ? "অনুশীলন" : "practice"}</h2>
            <p className="session-prompt">{session.prompt}</p>
            <div className="focus-box">
              <span>{t.landing.sampleModalFocus}</span>
              <div>{session.focus.map((item) => <b key={item}>{item}</b>)}</div>
            </div>
            <a className="button button-primary button-wide" href={`/dashboard?module=${encodeURIComponent(session.key)}`}>
              {t.landing.beginSampleSession}
            </a>
            <small>{t.landing.noAccNeeded}</small>
          </section>
        </div>
      )}

      {loginOpen && (
        <div className="modal-backdrop" onMouseDown={() => setLoginOpen(false)} role="presentation">
          <section aria-labelledby="login-title" aria-modal="true" className="modal-card login-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Close login dialog" className="modal-close" onClick={() => setLoginOpen(false)} type="button">×</button>
            <span className="brand-mark modal-brand">IS</span>
            <p className="kicker">{register ? t.auth.createAccount : t.auth.welcomeBack}</p>
            <h2 id="login-title">{register ? t.auth.becomeScholar : t.auth.signInToContinue}</h2>
            <p>{t.auth.authSubtitle}</p>
            <button className="google-button" disabled={authBusy} onClick={googleLogin} type="button">
              <span aria-hidden="true">G</span> {t.auth.continueGoogle}
            </button>
            <div className="auth-divider"><span>{t.auth.orUseEmail}</span></div>
            <form onSubmit={submitLogin}>
              {register && (
                <label htmlFor="name">
                  {t.auth.fullName}
                  <input autoComplete="name" id="name" onChange={(event) => setName(event.target.value)} placeholder={t.auth.fullNamePlaceholder} required value={name} />
                </label>
              )}
              <label htmlFor="email">
                {t.auth.emailAddress}
                <input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
              </label>
              <label htmlFor="password">
                {t.auth.password}
                <input autoComplete={register ? "new-password" : "current-password"} id="password" minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
              </label>
              {authError && <p className="form-error" role="alert">{authError}</p>}
              <button className="button button-primary button-wide" disabled={authBusy} type="submit">
                {authBusy ? t.auth.pleaseWait : register ? t.auth.createAccount : t.auth.signInBtn}
              </button>
            </form>
            <button className="auth-switch" onClick={() => { setRegister(!register); setAuthError(""); }} type="button">
              {register ? t.auth.alreadyHaveAcc : t.auth.newHere}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
