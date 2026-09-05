"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "../../../components/AppShell";
import { listTests } from "../../../lib/test-service";
import type { IELTSTest, IELTSModule } from "../../../lib/types";
import { useLanguage } from "../../../lib/language-context";

export default function TestLibrary() {
  const params = useParams<{ module: IELTSModule }>();
  const moduleName = params.module;
  const { t } = useLanguage();
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [queryText, setQueryText] = useState("");
  const [training, setTraining] = useState<"all" | "academic" | "general">("all");

  useEffect(() => {
    if (moduleName) {
      listTests(moduleName).then(setTests);
    }
  }, [moduleName]);

  const filtered = useMemo(
    () =>
      tests.filter(
        (test) =>
          (training === "all" || test.trainingType === training) &&
          test.title.toLowerCase().includes(queryText.toLowerCase())
      ),
    [tests, training, queryText]
  );

  const filterLabels = {
    all: t.library.all,
    academic: t.library.academic,
    general: t.library.general,
  };

  const moduleTitle = t.modules[moduleName as keyof typeof t.modules]?.name || moduleName;

  return (
    <AppShell>
      <section className="product-page library-page">
        <a className="back-link" href="/dashboard">
          {t.library.backDashboard}
        </a>
        <header>
          <span className="module-badge">{moduleName?.toUpperCase()}</span>
          <h1>
            {moduleTitle} {t.library.libraryTitle}
          </h1>
          <p>{t.library.description}</p>
        </header>

        <div className="library-toolbar">
          <div>
            {(["all", "academic", "general"] as const).map((item) => (
              <button
                className={training === item ? "active" : ""}
                onClick={() => setTraining(item)}
                type="button"
                key={item}
              >
                {filterLabels[item]}
              </button>
            ))}
          </div>
          <input
            aria-label="Search tests"
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={t.library.searchPlaceholder}
            value={queryText}
          />
        </div>

        <div className="test-library-grid">
          {filtered.map((test, index) => (
            <article className="library-card" key={test.id}>
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <small>{test.collection}</small>
                    {test.difficulty && (
                      <span style={{ fontSize: "0.72rem", padding: "1px 6px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.12)", color: "#0284c7", fontWeight: 600 }}>
                        {test.difficulty}
                      </span>
                    )}
                    {test.taskBadge && (
                      <span style={{ fontSize: "0.72rem", padding: "1px 6px", borderRadius: "10px", background: "rgba(236, 72, 153, 0.12)", color: "#db2777", fontWeight: 600 }}>
                        {test.taskBadge}
                      </span>
                    )}
                  </div>
                  <h2>{test.title}</h2>
                </div>
              </div>
              <p>{test.description}</p>
              <dl>
                <div>
                  <dt>{t.library.time}</dt>
                  <dd>
                    {test.durationMinutes} {t.library.minutes}
                  </dd>
                </div>
                <div>
                  <dt>{t.library.questions}</dt>
                  <dd>{test.questions.length}</dd>
                </div>
                <div>
                  <dt>{t.library.type}</dt>
                  <dd>{test.trainingType === "academic" ? t.library.academic : test.trainingType === "general" ? t.library.general : test.trainingType}</dd>
                </div>
              </dl>
              <a href={`/test/${test.id}`}>
                {t.library.startTest} <span>→</span>
              </a>
            </article>
          ))}
        </div>

        {!filtered.length && (
          <div className="empty-state">
            <strong>{t.library.noTests}</strong>
            <p>{t.library.noTestsDesc}</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
