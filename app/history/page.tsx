"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { listAttempts } from "../../lib/test-service";
import type { Attempt } from "../../lib/types";
import { useAuth } from "../providers";
import { useLanguage } from "../../lib/language-context";

export default function History() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    listAttempts(user?.uid ?? "demo-scholar").then(setAttempts);
  }, [user]);

  const locale = language === "bn" ? "bn-BD" : "en-GB";

  return (
    <AppShell>
      <section className="product-page simple-page">
        <span className="mini-pill">{t.history.attemptHistory}</span>
        <h1>{t.history.title}</h1>
        <p>{t.history.description}</p>
        <div className="history-list">
          {attempts.map((a) => (
            <article key={a.id}>
              <span className={`history-icon ${a.module}`}>{a.module.slice(0, 2).toUpperCase()}</span>
              <div>
                <small>{(t.modules[a.module as keyof typeof t.modules]?.name || a.module).toUpperCase()}</small>
                <h2>{a.testTitle}</h2>
                <p>{new Date(a.submittedAt).toLocaleString(locale)}</p>
              </div>
              <div>
                <strong>
                  {a.status === "pending-review" ? t.history.pending : `${t.history.band} ${a.estimatedBand}`}
                </strong>
                <span>
                  {a.status === "scored"
                    ? `${a.score}/${a.total} ${t.history.correct}`
                    : t.history.examinerReview}
                </span>
              </div>
            </article>
          ))}
          {!attempts.length && (
            <div className="empty-state">
              <strong>{t.history.noAttempts}</strong>
              <p>{t.history.emptyNotice}</p>
              <a href="/dashboard">{t.history.startPractising}</a>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
