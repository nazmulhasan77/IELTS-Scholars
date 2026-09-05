"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { listAttempts, listTests } from "../../lib/test-service";
import type { Attempt, IELTSTest, IELTSModule } from "../../lib/types";
import { useAuth } from "../providers";
import { useLanguage } from "../../lib/language-context";

export default function Dashboard() {
  const { user, demoMode } = useAuth();
  const { t, language } = useLanguage();
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const modules: { key: IELTSModule; label: string; icon: string; tone: string }[] = [
    { key: "speaking", label: t.modules.speaking.name, icon: "◉", tone: "green" },
    { key: "writing", label: t.modules.writing.name, icon: "✎", tone: "pink" },
    { key: "reading", label: t.modules.reading.name, icon: "▤", tone: "blue" },
    { key: "listening", label: t.modules.listening.name, icon: "◌", tone: "orange" },
  ];

  useEffect(() => {
    listTests().then(setTests);
    listAttempts(user?.uid ?? "demo-scholar").then(setAttempts);
  }, [user]);

  const best = useMemo(
    () => attempts.filter((a) => a.estimatedBand).reduce((m, a) => Math.max(m, a.estimatedBand ?? 0), 0),
    [attempts]
  );

  const formattedDate = useMemo(() => {
    const locale = language === "bn" ? "bn-BD" : "en-GB";
    return new Date().toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
  }, [language]);

  const userName = user?.displayName?.split(" ")[0] ?? (language === "bn" ? "শিক্ষার্থী" : "Scholar");

  return (
    <AppShell>
      <section className="product-page dashboard-page">
        <header className="product-header">
          <div>
            <span className="mini-pill">{t.dashboard.studentDashboard}</span>
            <h1>
              {t.dashboard.greeting} <strong>{userName}</strong>
            </h1>
            <p>{formattedDate}</p>
          </div>
          <div className="header-chips">
            <span>
              {t.dashboard.exam} <b>{t.dashboard.notSet}</b>
            </span>
            <span>
              {t.dashboard.target} <b>{best || t.dashboard.notSet}</b>
            </span>
            <a href="/login">{demoMode ? t.dashboard.connectFirebase : t.dashboard.profile}</a>
          </div>
        </header>

        <div className="full-mock-banner">
          <div className="mock-icons">
            <span>▤</span>
            <span>✎</span>
            <span>◌</span>
            <span>◉</span>
          </div>
          <div>
            <small>{t.dashboard.completeMockTest}</small>
            <h2>{t.dashboard.fullMockTitle}</h2>
            <p>{t.dashboard.fullMockDesc}</p>
          </div>
          <a href="/mock">{t.dashboard.startFullMock}</a>
        </div>

        <div className="section-title">
          <div>
            <small>{t.dashboard.individualPractice}</small>
            <h2>{t.dashboard.chooseWhereToImprove}</h2>
          </div>
          <a href="/history">{t.dashboard.viewHistory}</a>
        </div>

        <div className="dashboard-layout">
          <div className="module-practice-grid">
            {modules.map((module) => {
              const count = tests.filter((t) => t.module === module.key).length;
              const last = attempts.find((a) => a.module === module.key);
              const countLabel =
                language === "bn"
                  ? `${count} ${t.dashboard.publishedTests} ${t.dashboard.testSingular}`
                  : `${count} ${t.dashboard.publishedTests} ${count === 1 ? t.dashboard.testSingular : t.dashboard.testPlural}`;

              return (
                <a className={`practice-card ${module.tone}`} href={`/tests/${module.key}`} key={module.key}>
                  <div>
                    <span className="practice-icon">{module.icon}</span>
                    <small>
                      {last?.estimatedBand
                        ? `${t.dashboard.lastBand} ${last.estimatedBand}`
                        : t.dashboard.readyToStart}
                    </small>
                  </div>
                  <h3>{module.label}</h3>
                  <p>{countLabel}</p>
                  <footer>
                    {t.dashboard.practice} <span>↗</span>
                  </footer>
                </a>
              );
            })}
          </div>

          <aside className="streak-card-large">
            <div>
              <span>{t.dashboard.practiceStreak}</span>
              <strong>
                {attempts.length ? "1" : "0"}{" "}
                <small>{attempts.length === 1 ? t.dashboard.daySingular : t.dashboard.dayPlural}</small>
              </strong>
            </div>
            <div className="calendar-grid">
              {Array.from({ length: 28 }, (_, i) => (
                <i className={attempts.length && i === 23 ? "done" : ""} key={i}>
                  {i + 1}
                </i>
              ))}
            </div>
            <p>
              {attempts.length} {t.dashboard.completedAttempts}
            </p>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
