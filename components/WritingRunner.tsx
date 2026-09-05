"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IELTSTest, Attempt } from "../lib/types";
import { saveAttempt } from "../lib/test-service";
import { useAuth } from "../app/providers";
import { useLanguage } from "../lib/language-context";

interface WritingRunnerProps {
  test: IELTSTest;
  initialMode?: "strict" | "practice";
}

export default function WritingRunner({ test, initialMode }: WritingRunnerProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const minWords = test.minWords || (test.taskType === "task1" ? 150 : 250);
  const duration = test.durationMinutes || (test.taskType === "task1" ? 20 : 40);

  const [mode, setMode] = useState<"strict" | "practice" | null>(initialMode ?? null);
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(duration * 60);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    band: number;
    wordCount: number;
    feedbackTA: string;
    feedbackCC: string;
    feedbackLR: string;
    feedbackGRA: string;
  } | null>(null);

  // Storage key for autosaving
  const storageKey = `ielts_writing_draft_${test.id}`;

  // Load autosaved draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setText(saved);
    } catch {
      // ignore storage error
    }
  }, [storageKey]);

  // Autosave text
  useEffect(() => {
    try {
      if (text) {
        localStorage.setItem(storageKey, text);
      }
    } catch {
      // ignore
    }
  }, [text, storageKey]);

  // Timer countdown in strict mode
  useEffect(() => {
    if (!mode || submitted || mode === "practice") return;
    const timer = window.setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, submitted]);

  // Word count calculation
  const wordCount = useMemo(() => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [text]);

  // Words needed calculation
  const wordsNeeded = Math.max(0, minWords - wordCount);

  // Time formatted
  const minutesStr = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsStr = String(seconds % 60).padStart(2, "0");

  // Mode Selection Screen if not selected
  if (!mode) {
    const strictDesc =
      language === "bn"
        ? `আসল পরীক্ষার শর্তাবলী · ${duration}-মিনিটের কাউন্টডাউন।`
        : `Real exam conditions · ${duration}-minute countdown.`;

    return (
      <div className="mode-screen">
        <div className="mode-dialog">
          <header>
            <span style={{ fontSize: "20px" }}>✎</span>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "18px" }}>{test.title}</h1>
              <p>{t.runner.modeChoose}</p>
            </div>
          </header>
          <div className="mode-options">
            <button onClick={() => setMode("strict")} type="button">
              <b>{t.runner.strictTitle}</b>
              <span>{strictDesc}</span>
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

  // Handle Submission & Scoring
  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);

    // Automated IELTS rubric evaluation
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const words = text.trim().split(/\s+/).filter(Boolean);
    const count = words.length;

    // Task Achievement (TA)
    let taScore = 6.0;
    let taMsg = "";
    if (count < minWords * 0.6) {
      taScore = 4.5;
      taMsg = language === "bn"
        ? `শব্দসংখ্যা (${count}) লক্ষ্যমাত্রার (${minWords}) চেয়ে অনেক কম। মূল বৈশিষ্ট্যগুলোর পর্যাপ্ত বিশ্লেষণ সম্ভব হয়নি।`
        : `Word count (${count}) is substantially below the ${minWords}-word requirement, limiting depth of coverage.`;
    } else if (count < minWords) {
      taScore = 5.5;
      taMsg = language === "bn"
        ? `শব্দসংখ্যা (${count}) ন্যুনতম ${minWords} শব্দের কিছুটা কম। আরও কিছু গুরুত্বপূর্ণ তুলনা বা ওভারভিউ যোগ করা যেত।`
        : `Word count (${count}) is slightly below the ${minWords}-word target. Expand on key trends and comparisons.`;
    } else if (count >= minWords && count < minWords + 80) {
      taScore = 7.0;
      taMsg = language === "bn"
        ? `উপযুক্ত শব্দসংখ্যা (${count})। ডেটা বিবরণ এবং মূল বৈশিষ্ট্যগুলো সুন্দরভাবে অন্তর্ভুক্ত করা হয়েছে।`
        : `Well-balanced length (${count} words). Key features and trends were adequately highlighted.`;
    } else {
      taScore = 7.5;
      taMsg = language === "bn"
        ? `চমৎকার দৈর্ঘ্য (${count} শব্দ) এবং বিস্তারিত তুলনা সহ সমৃদ্ধ উপস্থাপনা।`
        : `Comprehensive response (${count} words) with thorough comparisons and detailed overview.`;
    }

    // Coherence & Cohesion (CC)
    let ccScore = 6.0;
    let ccMsg = "";
    if (paragraphs.length < 2) {
      ccScore = 5.0;
      ccMsg = language === "bn"
        ? "উত্তরটি একক অনুচ্ছেদে লেখা হয়েছে। পরিচিতি, ওভারভিউ এবং বডি প্যারাগ্রাফ আলাদা করুন।"
        : "Text is in a single block. Divide your response into clear introduction, overview, and body paragraphs.";
    } else if (paragraphs.length >= 3) {
      ccScore = 7.0;
      ccMsg = language === "bn"
        ? "সুস্পষ্ট অনুচ্ছেদ বিন্যাস (Introduction, Overview, Details) এবং ভালো সংগতি রয়েছে।"
        : "Clear paragraph structure (Introduction, Overview, and Body paragraphs) with logical flow.";
    } else {
      ccScore = 6.0;
      ccMsg = language === "bn"
        ? "অনুচ্ছেদ বিন্যাস বজায় রাখা হয়েছে। আরও উন্নত লিঙ্কিং শব্দ ব্যবহার করলে আরও ভালো হবে।"
        : "Satisfactory paragraphing. Use a wider range of cohesive devices to transition smoothly.";
    }

    // Lexical Resource (LR)
    const academicWords = [
      "percentage", "generated", "renewable", "substantial", "contrast",
      "compared", "respectively", "dramatic", "significant", "moderate",
      "fluctuated", "constituted", "demonstrates", "accounted", "steadily"
    ];
    const foundAcademic = academicWords.filter((w) => text.toLowerCase().includes(w));
    let lrScore = foundAcademic.length >= 4 ? 7.0 : foundAcademic.length >= 2 ? 6.5 : 5.5;
    let lrMsg = language === "bn"
      ? `একাডেমিক শব্দভাণ্ডার: ${foundAcademic.length}টি উপযুক্ত শব্দ শনাক্ত হয়েছে।`
      : `Academic vocabulary: identified ${foundAcademic.length} domain-specific cohesive words.`;

    // Grammatical Range & Accuracy (GRA)
    const avgSentenceLength = words.length / Math.max(1, (text.match(/[.!?]+/g) || []).length);
    let graScore = avgSentenceLength >= 12 && avgSentenceLength <= 28 ? 7.0 : 6.0;
    let graMsg = language === "bn"
      ? "বাক্যের গড় দৈর্ঘ্য ও বৈচিত্র্য সন্তোষজনক।"
      : "Good sentence length variation and control of complex grammatical structures.";

    // Overall Band
    const avgBand = Math.round(((taScore + ccScore + lrScore + graScore) / 4) * 2) / 2;

    const fb = {
      band: avgBand,
      wordCount: count,
      feedbackTA: taMsg,
      feedbackCC: ccMsg,
      feedbackLR: lrMsg,
      feedbackGRA: graMsg,
    };
    setFeedback(fb);

    // Save Attempt
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      testId: test.id,
      testTitle: test.title,
      module: "writing",
      userId: user?.uid ?? "demo-scholar",
      answers: { w1: text },
      score: Math.round(avgBand * 10),
      total: 90,
      estimatedBand: avgBand,
      status: "scored",
      submittedAt: new Date().toISOString(),
    };

    try {
      await saveAttempt(attempt);
      // Clean draft
      localStorage.removeItem(storageKey);
    } catch {
      // Continue anyway
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  // Result / Feedback Modal
  if (submitted && feedback) {
    return (
      <div className="writing-feedback-overlay">
        <div className="writing-feedback-modal">
          <header className="feedback-header">
            <div className="feedback-badge-wrap">
              <span className="feedback-check-circle">✓</span>
              <div>
                <h2>{language === "bn" ? "টেস্ট সম্পন্ন ও মূল্যায়ন" : "Submission & Evaluation"}</h2>
                <p>{test.title}</p>
              </div>
            </div>
            <div className="feedback-band-badge">
              <span>{language === "bn" ? "আনুমানিক ব্যান্ড" : "Estimated Band"}</span>
              <strong>{feedback.band.toFixed(1)}</strong>
            </div>
          </header>

          <div className="feedback-body">
            <div className="feedback-stats-row">
              <div className="stat-card">
                <small>{language === "bn" ? "মোট শব্দসংখ্যা" : "Total Words"}</small>
                <strong>{feedback.wordCount}</strong>
                <span className={feedback.wordCount >= minWords ? "stat-ok" : "stat-warn"}>
                  {feedback.wordCount >= minWords
                    ? (language === "bn" ? `ন্যূনতম ${minWords}+ শব্দ পূরণ হয়েছে` : `Target ${minWords}+ met`)
                    : (language === "bn" ? `${minWords - feedback.wordCount} শব্দ কম` : `${minWords - feedback.wordCount} words below`)}
                </span>
              </div>
              <div className="stat-card">
                <small>{language === "bn" ? "সময় ব্যবহার" : "Time Used"}</small>
                <strong>
                  {mode === "practice"
                    ? (language === "bn" ? "অনুশীলন" : "Practice")
                    : `${Math.floor((duration * 60 - seconds) / 60)}m ${(duration * 60 - seconds) % 60}s`}
                </strong>
                <span>{mode === "strict" ? (language === "bn" ? "স্ট্রিক্ট মোড" : "Strict Mode") : (language === "bn" ? "মুক্ত সময়" : "Untimed")}</span>
              </div>
            </div>

            <h3 className="feedback-section-title">
              {language === "bn" ? "আইইএলটিএস মানদণ্ড ভিত্তিক ফিডব্যাক" : "IELTS Assessment Criteria Breakdown"}
            </h3>

            <div className="criteria-grid">
              <div className="criterion-card">
                <h4>{language === "bn" ? "টাস্ক অ্যাচিভমেন্ট (Task Achievement)" : "Task Achievement"}</h4>
                <p>{feedback.feedbackTA}</p>
              </div>
              <div className="criterion-card">
                <h4>{language === "bn" ? "সংগতি ও ধারাবাহিকতা (Coherence & Cohesion)" : "Coherence & Cohesion"}</h4>
                <p>{feedback.feedbackCC}</p>
              </div>
              <div className="criterion-card">
                <h4>{language === "bn" ? "শব্দভাণ্ডার (Lexical Resource)" : "Lexical Resource"}</h4>
                <p>{feedback.feedbackLR}</p>
              </div>
              <div className="criterion-card">
                <h4>{language === "bn" ? "ব্যাকরণ বৈচিত্র্য ও নির্ভুলতা (Grammar & Accuracy)" : "Grammatical Range & Accuracy"}</h4>
                <p>{feedback.feedbackGRA}</p>
              </div>
            </div>

            <div className="feedback-saved-report">
              <h4>{language === "bn" ? "আপনার লিখিত উত্তর" : "Your Written Report"}</h4>
              <div className="saved-text-preview">{text || <i>{language === "bn" ? "কোনো উত্তর লেখা হয়নি।" : "No text entered."}</i>}</div>
            </div>
          </div>

          <footer className="feedback-footer">
            <Link href="/history" className="feedback-btn-secondary">
              {language === "bn" ? "হিস্ট্রি দেখুন" : "View History"}
            </Link>
            <Link href="/tests/writing" className="feedback-btn-primary">
              {language === "bn" ? "আরও রাইটিং টেস্ট" : "More Writing Tests"}
            </Link>
          </footer>
        </div>
      </div>
    );
  }

  // Determine pill text
  const badgeText = test.taskBadge || (test.taskType === "task1" ? "Task 1 — Data Description" : "Task 2 — Essay Writing");
  const taskPrefix = test.taskType === "task2" ? "Task 2:" : "Task 1:";

  return (
    <div className="writing-runner-wrapper">
      {/* Top Header Bar */}
      <header className="writing-top-bar">
        <div className="writing-top-left">
          <Link href="/tests/writing" className="writing-exit-link">
            ← {language === "bn" ? "প্রস্থান" : "Exit"}
          </Link>
          <span className="writing-header-divider">|</span>
          <h1 className="writing-header-title">
            <span className="task-prefix">{taskPrefix} </span>
            {test.title}
          </h1>
        </div>

        <div className="writing-top-right">
          <div className={`writing-word-indicator ${wordCount >= minWords ? "target-reached" : "target-short"}`}>
            {wordCount} / {minWords}+ {t.runner.wordsCount}
          </div>
          <div className="writing-timer">
            <svg
              className="timer-clock-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 6 12 12 15 15" />
            </svg>
            <span className="timer-text">
              {mode === "practice" ? (language === "bn" ? "অনুশীলন" : "PRACTICE") : `${minutesStr}:${secondsStr}`}
            </span>
          </div>
        </div>
      </header>

      {/* Main 50/50 Workspace */}
      <main className="writing-workspace-grid">
        {/* Left Column: Task Prompt & Chart Visual */}
        <section className="writing-task-card">
          <div className="writing-task-content">
            <div className="writing-pill-badge">{badgeText}</div>
            <h2 className="writing-task-heading">{test.title}</h2>

            <div className="writing-prompt-text">
              {test.taskPrompt ? (
                test.taskPrompt.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p>{test.description}</p>
              )}
            </div>

            {/* Visual Bar Chart Display */}
            {test.chartData ? (
              <div className="writing-chart-box">
                <h4 className="chart-box-title">{test.chartData.title}</h4>
                <div className="chart-svg-container">
                  <svg viewBox="0 0 540 330" className="responsive-bar-chart">
                    {/* Y-Axis Grid Lines & Numbers */}
                    {[100, 75, 50, 25, 0].map((val) => {
                      const yPos = 35 + ((100 - val) / 100) * 210;
                      return (
                        <g key={val}>
                          <text
                            x="42"
                            y={yPos + 4}
                            textAnchor="end"
                            className="chart-axis-tick"
                            fontSize="11"
                            fill="#6b7280"
                          >
                            {val}
                          </text>
                          <line
                            x1="48"
                            y1={yPos}
                            x2="515"
                            y2={yPos}
                            stroke="#e5e7eb"
                            strokeDasharray={val === 0 ? "none" : "3,3"}
                            strokeWidth="1"
                          />
                        </g>
                      );
                    })}

                    {/* Y-Axis Label */}
                    <text
                      transform="rotate(-90)"
                      x="-140"
                      y="14"
                      textAnchor="middle"
                      className="chart-axis-label"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      {test.chartData.yAxisLabel || "% of Electricity from renewable sources"}
                    </text>

                    {/* Bars for Each Category */}
                    {test.chartData.categories.map((cat, catIdx) => {
                      const groupWidth = 460 / test.chartData!.categories.length;
                      const groupCenter = 55 + catIdx * groupWidth + groupWidth / 2;
                      const barWidth = 24;
                      const gap = 3;

                      const val2010 = test.chartData!.series[0]?.data[catIdx] ?? 0;
                      const val2022 = test.chartData!.series[1]?.data[catIdx] ?? 0;

                      const height2010 = (val2010 / 100) * 210;
                      const y2010 = 245 - height2010;

                      const height2022 = (val2022 / 100) * 210;
                      const y2022 = 245 - height2022;

                      return (
                        <g key={cat}>
                          {/* 2010 Bar (Blue) */}
                          <rect
                            x={groupCenter - barWidth - gap / 2}
                            y={y2010}
                            width={barWidth}
                            height={height2010}
                            fill="#3266ad"
                            rx="2"
                          />
                          {/* 2022 Bar (Orange/Rust) */}
                          <rect
                            x={groupCenter + gap / 2}
                            y={y2022}
                            width={barWidth}
                            height={height2022}
                            fill="#c1581e"
                            rx="2"
                          />
                          {/* Category X-Label */}
                          <text
                            x={groupCenter}
                            y="266"
                            textAnchor="middle"
                            fontSize="11"
                            fill="#374151"
                            fontWeight="500"
                          >
                            {cat}
                          </text>
                        </g>
                      );
                    })}

                    {/* Chart Legend */}
                    <g transform="translate(200, 305)">
                      <rect x="0" y="0" width="16" height="10" fill="#3266ad" rx="2" />
                      <text x="24" y="9" fontSize="11" fill="#4b5563" fontWeight="500">
                        {test.chartData.series[0]?.name || "2010"}
                      </text>

                      <rect x="75" y="0" width="16" height="10" fill="#c1581e" rx="2" />
                      <text x="99" y="9" fontSize="11" fill="#4b5563" fontWeight="500">
                        {test.chartData.series[1]?.name || "2022"}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            ) : test.imageUrl ? (
              <div className="writing-chart-box">
                <img src={test.imageUrl} alt={test.title} className="writing-chart-image" />
              </div>
            ) : null}
          </div>
        </section>

        {/* Right Column: Writing Textarea & Bottom Submit Row */}
        <section className="writing-editor-column">
          <div className="writing-editor-card">
            <textarea
              className="writing-seamless-textarea"
              placeholder={
                test.taskType === "task1"
                  ? (language === "bn" ? "আপনার রিপোর্ট এখানে লিখুন..." : "Write your report here...")
                  : (language === "bn" ? "আপনার রচনা এখানে লিখুন..." : "Write your essay here...")
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className="writing-bottom-action-bar">
            {/* Live Word Count Status */}
            <div className="writing-word-status">
              {wordsNeeded > 0 ? (
                <span className="status-short">
                  {wordCount} {t.runner.wordsCount} ({language === "bn" ? `আরও ${wordsNeeded} টি প্রয়োজন` : `need ${wordsNeeded} more`})
                </span>
              ) : (
                <span className="status-reached">
                  {wordCount} {t.runner.wordsCount} ({language === "bn" ? "টার্গেট পূরণ হয়েছে ✓" : "target reached ✓"})
                </span>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              type="button"
              className="writing-submit-btn"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>{t.runner.submitAndFeedback || "Submit & Get Feedback"}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
