"use client";

import AppShell from "../../components/AppShell";
import { useLanguage } from "../../lib/language-context";

export default function Mock() {
  const { t } = useLanguage();

  const mockModules = [
    { slug: "reading" as const, tone: "blue", icon: "▤", name: t.modules.reading.name },
    { slug: "listening" as const, tone: "orange", icon: "◌", name: t.modules.listening.name },
    { slug: "writing" as const, tone: "pink", icon: "✎", name: t.modules.writing.name },
    { slug: "speaking" as const, tone: "green", icon: "◉", name: t.modules.speaking.name },
  ];

  return (
    <AppShell>
      <section className="product-page mock-page">
        <a className="back-link" href="/dashboard">
          {t.mock.backDashboard}
        </a>
        <header>
          <span className="module-badge">{t.mock.badge}</span>
          <h1>
            {t.mock.title} <strong>{t.mock.titleStrong}</strong>
          </h1>
          <p>{t.mock.subtitle}</p>
          <div>
            <span>{t.mock.progress}</span>
            <b>0 / 4</b>
            <i />
          </div>
        </header>
        <div className="mock-module-grid">
          {mockModules.map((m, i) => (
            <article key={m.slug}>
              <div>
                <span className={`mock-icon ${m.tone}`}>{m.icon}</span>
                <small>
                  {t.mock.moduleNum} {i + 1}
                </small>
              </div>
              <h2>{m.name}</h2>
              <a className={m.tone} href={`/tests/${m.slug}`}>
                {t.mock.start} {m.name} →
              </a>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
