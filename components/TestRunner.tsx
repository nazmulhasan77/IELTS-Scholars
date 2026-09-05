"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTest, objectiveScore, saveAttempt } from "../lib/test-service";
import type { IELTSTest } from "../lib/types";
import { useAuth } from "../app/providers";
import { useLanguage } from "../lib/language-context";
import LanguageSwitcher from "./LanguageSwitcher";
import WritingRunner from "./WritingRunner";

export default function TestRunner({ testId }: { testId: string }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [test, setTest] = useState<IELTSTest | null>(null);
  const [mode, setMode] = useState<"strict" | "practice" | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);
  const [submitted, setSubmitted] = useState<ReturnType<typeof objectiveScore> | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    getTest(testId).then((item) => {
      setTest(item);
      if (item) setSeconds(item.durationMinutes * 60);
    });
  }, [testId]);

  useEffect(() => {
    if (!mode || submitted || mode === "practice") return;
    const timer = window.setInterval(() => setSeconds((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [mode, submitted]);

  const words = useMemo(
    () => Object.values(answers).join(" ").trim().split(/\s+/).filter(Boolean).length,
    [answers]
  );

  if (!test) return <div className="runner-loading">{t.runner.loading}</div>;

  if (test.module === "writing") {
    return <WritingRunner test={test} />;
  }

  async function submit() {
    if (!test) return;
    const result = objectiveScore(test, answers);
    const review = test.module === "writing" || test.module === "speaking";
    await saveAttempt({
      id: crypto.randomUUID(),
      testId: test.id,
      testTitle: test.title,
      module: test.module,
      userId: user?.uid ?? "demo-scholar",
      answers,
      score: result.score,
      total: result.total,
      estimatedBand: review ? null : result.estimatedBand,
      status: review ? "pending-review" : "scored",
      submittedAt: new Date().toISOString(),
    });
    setSubmitted(result);
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      setRecordingUrl(URL.createObjectURL(new Blob(chunks, { type: "audio/webm" })));
      stream.getTracks().forEach((trk) => trk.stop());
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  if (!mode) {
    const strictCountdownText =
      language === "bn"
        ? `আসল পরীক্ষার শর্তাবলী · ${test.durationMinutes}-মিনিটের কাউন্টডাউন।`
        : `Real exam conditions · ${test.durationMinutes}-minute countdown.`;

    return (
      <div className="mode-screen">
        <div className="mode-dialog">
          <header>
            <span>▤</span>
            <div style={{ flex: 1 }}>
              <h1>{test.title}</h1>
              <p>{t.runner.modeChoose}</p>
            </div>
            <LanguageSwitcher variant="subtle" />
          </header>
          <div className="mode-options">
            <button onClick={() => setMode("strict")} type="button">
              <b>{t.runner.strictTitle}</b>
              <span>{strictCountdownText}</span>
            </button>
            <button onClick={() => setMode("practice")} type="button">
              <b>{t.runner.practiceTitle}</b>
              <span>{t.runner.practiceDesc}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="result-screen">
        <span className="result-check">✓</span>
        <p>{t.runner.testCompleted}</p>
        <h1>
          {test.module === "writing" || test.module === "speaking"
            ? t.runner.submittedForReview
            : `${t.runner.estimatedBand} ${submitted.estimatedBand}`}
        </h1>
        <p>
          {test.module === "writing" || test.module === "speaking"
            ? t.runner.reviewMsg
            : `${submitted.score} / ${submitted.total} ${t.runner.scoreMsg}`}
        </p>

        {test.sampleAnswer && (
          <div style={{ maxWidth: "680px", margin: "20px auto 10px", textAlign: "left", padding: "16px 20px", background: "rgba(14, 165, 233, 0.06)", borderRadius: "10px", border: "1px solid rgba(14, 165, 233, 0.2)" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#0369a1", fontSize: "1rem" }}>
              🌟 {language === "bn" ? "ব্যান্ড ৯ স্যাম্পল উত্তর" : "Band 9 Sample Response"}
            </h4>
            <p style={{ fontSize: "0.9rem", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "inherit", margin: 0 }}>
              {test.sampleAnswer}
            </p>
          </div>
        )}

        {(test.module === "reading" || test.module === "listening") && test.questions.some((q) => q.answer) && (
          <div style={{ maxWidth: "700px", margin: "24px auto", textAlign: "left" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(148, 163, 184, 0.3)" }}>
              📝 {language === "bn" ? "প্রশ্নভিত্তিক মূল্যায়ন ও ব্যাখ্যা" : "Question Review & Explanations"}
            </h3>
            {test.questions.map((q, idx) => {
              const userAns = (answers[q.id] ?? "").trim();
              const expected = (q.answer ?? "").trim();
              const alternatives = (q.alternativeAnswers ?? []).map((a) => a.trim().toLowerCase());
              const isCorrect = userAns.toLowerCase() === expected.toLowerCase() || alternatives.includes(userAns.toLowerCase());
              return (
                <div
                  key={q.id}
                  style={{
                    marginBottom: "12px",
                    padding: "12px 16px",
                    background: isCorrect ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${isCorrect ? "#10b981" : "#ef4444"}`,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "6px" }}>
                    {idx + 1}. {q.prompt}
                  </div>
                  <div style={{ fontSize: "0.85rem", display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    <span style={{ color: isCorrect ? "#059669" : "#dc2626", fontWeight: 500 }}>
                      {language === "bn" ? "আপনার উত্তর:" : "Your answer:"} {userAns || (language === "bn" ? "(উত্তর দেননি)" : "(unanswered)")} {isCorrect ? "✓" : "✗"}
                    </span>
                    {!isCorrect && (
                      <span style={{ color: "#059669", fontWeight: 500 }}>
                        {language === "bn" ? "সঠিক উত্তর:" : "Correct:"} {expected}
                      </span>
                    )}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: "0.82rem", opacity: 0.85, marginTop: "6px", paddingTop: "4px" }}>
                      💡 <b>{language === "bn" ? "ব্যাখ্যা:" : "Explanation:"}</b> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div>
          <a href="/history">{t.runner.viewHistory}</a>
          <a href={`/tests/${test.module}`}>{t.runner.moreTests}</a>
        </div>
      </div>
    );
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <main className={`exam-runner ${test.module}`}>
      <header>
        <a href={`/tests/${test.module}`}>{t.runner.exit}</a>
        <strong>
          IELTS Scholars <span>{test.title}</span>
        </strong>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LanguageSwitcher variant="header" />
          <time>◷ {mode === "practice" ? t.runner.practiceBadge : `${minutes}:${secs}`}</time>
          <button onClick={submit} type="button">
            {t.runner.submitBtn}
          </button>
        </div>
      </header>

      <div className="exam-instructions">
        <strong>{(t.modules[test.module as keyof typeof t.modules]?.name || test.module).toUpperCase()}</strong>
        <span>{test.description}</span>
      </div>

      <div className="exam-workspace">
        <section className="source-panel">
          <h2>{test.title}</h2>
          {test.module === "listening" &&
            (test.audioUrl ? (
              <audio controls src={test.audioUrl} />
            ) : (
              <div className="audio-placeholder">{t.runner.demoAudioTranscript}</div>
            ))}
          {test.module === "writing" && (
            <>
              <h3>{t.runner.writingTask}</h3>
              <p className="task-prompt">{test.taskPrompt}</p>
            </>
          )}
          {test.module === "speaking" && (
            <div className="speaking-parts">
              {test.speakingParts?.map((part, i) => (
                <article key={part}>
                  <span>
                    {t.runner.part} {i + 1}
                  </span>
                  <p>{part}</p>
                </article>
              ))}
            </div>
          )}
          {(test.module === "reading" || test.module === "listening") && (
            <p className="reading-passage">{test.passage}</p>
          )}
        </section>

        <section className="answer-panel">
          {test.module === "writing" ? (
            <div className="writing-box">
              <div>
                <span>{t.runner.yourResponse}</span>
                <b>
                  {words} {t.runner.wordsCount}
                </b>
              </div>
              <textarea
                onChange={(e) => setAnswers({ w1: e.target.value })}
                placeholder={t.runner.writePlaceholder}
                value={answers.w1 ?? ""}
              />
            </div>
          ) : test.module === "speaking" ? (
            <div className="recording-box">
              <span className={recording ? "record-dot live" : "record-dot"}>●</span>
              <h2>{recording ? t.runner.recordingLive : t.runner.readyRecord}</h2>
              <p>{t.runner.micInstruction}</p>
              <button onClick={toggleRecording} type="button">
                {recording ? t.runner.stopRecording : t.runner.startRecording}
              </button>
              {recordingUrl && <audio controls src={recordingUrl} />}
            </div>
          ) : (
            <div className="questions-list">
              {test.questions.map((q, index) => (
                <article key={q.id}>
                  <span>
                    {t.runner.question} {index + 1}
                  </span>
                  <h3>{q.prompt}</h3>
                  {q.options ? (
                    <div>
                      {q.options.map((option) => (
                        <label key={option}>
                          <input
                            checked={answers[q.id] === option}
                            name={q.id}
                            onChange={() => setAnswers({ ...answers, [q.id]: option })}
                            type="radio"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      placeholder={t.runner.typeAnswer}
                      value={answers[q.id] ?? ""}
                    />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="exam-footer">
        <span>
          {Object.keys(answers).length} / {test.questions.length} {t.runner.answeredOf}
        </span>
        <button onClick={submit} type="button">
          {t.runner.finishTest}
        </button>
      </footer>
    </main>
  );
}
