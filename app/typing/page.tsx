"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import { useLanguage } from "../../lib/language-context";

const texts = {
  easy: "practice makes progress every single day",
  medium: "The chart illustrates a gradual increase in international student enrolment.",
  ielts: "Some people believe that public transport should be free for everyone in large cities.",
};

export default function Typing() {
  const { t } = useLanguage();
  const [difficulty, setDifficulty] = useState<keyof typeof texts>("medium");
  const [limit, setLimit] = useState(60);
  const [typed, setTyped] = useState("");
  const [time, setTime] = useState(60);
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!started || time <= 0) return;
    const interval = setInterval(() => setTime((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [started, time]);

  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const elapsed = Math.max(1, limit - time);
  const wpm = Math.round(words / (elapsed / 60));
  const accuracy = useMemo(
    () =>
      typed.length
        ? Math.round(([...typed].filter((c, i) => c === texts[difficulty][i]).length / typed.length) * 100)
        : 100,
    [typed, difficulty]
  );

  const difficultyLabels: Record<keyof typeof texts, string> = {
    easy: t.typing.easy,
    medium: t.typing.medium,
    ielts: t.typing.ieltsWriting,
  };

  return (
    <AppShell>
      <section className="product-page typing-page">
        <header>
          <div className="typing-title">
            <span>⌨</span>
            <div>
              <h1>{t.typing.title}</h1>
              <p>{t.typing.subtitle}</p>
            </div>
          </div>
          <small>{t.typing.instructions}</small>
        </header>

        <div className="typing-controls">
          <div>
            {(Object.keys(texts) as (keyof typeof texts)[]).map((d) => (
              <button
                className={difficulty === d ? "active" : ""}
                onClick={() => {
                  setDifficulty(d);
                  setTyped("");
                  setStarted(false);
                  setTime(limit);
                }}
                type="button"
                key={d}
              >
                {difficultyLabels[d]}
              </button>
            ))}
          </div>
          <div>
            {[15, 30, 60, 120].map((n) => (
              <button
                className={limit === n ? "active" : ""}
                onClick={() => {
                  setLimit(n);
                  setTyped("");
                  setStarted(false);
                  setTime(n);
                }}
                type="button"
                key={n}
              >
                {n}s
              </button>
            ))}
          </div>
        </div>

        <div className="typing-stats">
          <span>
            <small>{t.typing.wpm}</small>
            <strong>{wpm}</strong>
          </span>
          <span>
            <small>{t.typing.acc}</small>
            <strong>
              {accuracy}
              <i>%</i>
            </strong>
          </span>
          <span>
            <small>{t.typing.time}</small>
            <strong>
              {time}
              <i>s</i>
            </strong>
          </span>
          <span>
            <small>{t.typing.words}</small>
            <strong>{words}</strong>
          </span>
        </div>

        <div className="typing-stage" onClick={() => inputRef.current?.focus()}>
          <p>
            {[...texts[difficulty]].map((char, i) => (
              <span
                className={
                  i < typed.length
                    ? typed[i] === char
                      ? "correct"
                      : "wrong"
                    : i === typed.length
                    ? "current"
                    : ""
                }
                key={i}
              >
                {char}
              </span>
            ))}
          </p>
          <input
            autoFocus
            onChange={(e) => {
              setTyped(e.target.value.slice(0, texts[difficulty].length));
              setStarted(true);
            }}
            ref={inputRef}
            value={typed}
          />
          <small>{time === 0 ? t.typing.timeUp : t.typing.startTyping}</small>
        </div>
      </section>
    </AppShell>
  );
}
