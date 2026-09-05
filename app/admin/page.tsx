"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "../../components/AppShell";
import { deleteTest, firebaseConfigured, listTests, saveTest, seedSampleTests, uploadTestAudio } from "../../lib/test-service";
import type { IELTSQuestion, IELTSTest, IELTSModule, QuestionType } from "../../lib/types";
import { useAuth } from "../providers";
import { useLanguage } from "../../lib/language-context";

const blank = (): IELTSTest => ({
  id: "",
  title: "",
  module: "reading",
  trainingType: "academic",
  collection: "Custom Tests",
  description: "",
  durationMinutes: 20,
  status: "draft",
  passage: "",
  audioUrl: "",
  taskPrompt: "",
  speakingParts: ["", "", ""],
  questions: [],
});

export default function AdminPage() {
  const { role, loading, demoMode } = useAuth();
  const { t, language } = useLanguage();
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [editing, setEditing] = useState<IELTSTest | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function refresh() {
    setTests(await listTests(undefined, true));
  }

  useEffect(() => {
    let active = true;
    void listTests(undefined, true).then((items) => {
      if (active) setTests(items);
    });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      published: tests.filter((test) => test.status === "published").length,
      drafts: tests.filter((test) => test.status === "draft").length,
      questions: tests.reduce((n, test) => n + test.questions.length, 0),
    }),
    [tests]
  );

  if (loading) return <div className="runner-loading">{language === "bn" ? "প্রশাসক প্রবেশাধিকার যাচাই করা হচ্ছে…" : "Checking administrator access…"}</div>;

  if (role !== "admin")
    return (
      <AppShell>
        <div className="access-denied">
          <h1>{t.admin.accessDenied}</h1>
          <p>{t.admin.accessDeniedDesc}</p>
          <a href="/login">{language === "bn" ? "সাইন ইন করুন →" : "Sign in →"}</a>
        </div>
      </AppShell>
    );

  function update<K extends keyof IELTSTest>(key: K, value: IELTSTest[K]) {
    if (editing) setEditing({ ...editing, [key]: value });
  }

  function addQuestion() {
    if (!editing) return;
    const q: IELTSQuestion = {
      id: crypto.randomUUID(),
      type: "multiple-choice",
      prompt: "",
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
      points: 1,
    };
    update("questions", [...editing.questions, q]);
  }

  function updateQuestion(id: string, field: keyof IELTSQuestion, value: unknown) {
    if (!editing) return;
    update(
      "questions",
      editing.questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const id =
      editing.id ||
      editing.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString().slice(-4);
    await saveTest({ ...editing, id });
    setSaving(false);
    setEditing(null);
    setNotice(t.admin.savedNotice);
    refresh();
  }

  return (
    <AppShell>
      <section className="product-page admin-page">
        <header className="admin-header">
          <div>
            <span className="mini-pill">{t.admin.controlCenter}</span>
            <h1>{t.admin.title}</h1>
            <p>{t.admin.subtitle}</p>
          </div>
          <button onClick={() => setEditing(blank())} type="button">
            {t.admin.createBtn}
          </button>
        </header>

        {demoMode && (
          <div className="admin-notice">
            <b>{t.admin.demoNotice}</b>{" "}
            <button
              onClick={async () => {
                await seedSampleTests();
                refresh();
              }}
              type="button"
            >
              {t.admin.resetSample}
            </button>
          </div>
        )}

        {notice && <div className="success-notice">✓ {notice}</div>}

        <div className="admin-stats">
          <article>
            <span>{t.admin.totalTests}</span>
            <strong>{tests.length}</strong>
          </article>
          <article>
            <span>{t.admin.published}</span>
            <strong>{counts.published}</strong>
          </article>
          <article>
            <span>{t.admin.drafts}</span>
            <strong>{counts.drafts}</strong>
          </article>
          <article>
            <span>{t.admin.questions}</span>
            <strong>{counts.questions}</strong>
          </article>
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>{t.admin.colTest}</span>
            <span>{t.admin.colModule}</span>
            <span>{t.admin.colQuestions}</span>
            <span>{t.admin.colStatus}</span>
            <span>{t.admin.colActions}</span>
          </div>
          {tests.map((test) => (
            <div className="admin-row" key={test.id}>
              <span>
                <b>{test.title}</b>
                <small>{test.collection}</small>
              </span>
              <span className={`module-tag ${test.module}`}>
                {t.modules[test.module as keyof typeof t.modules]?.name || test.module}
              </span>
              <span>{test.questions.length}</span>
              <span className={`status-tag ${test.status}`}>
                {test.status === "published" ? t.admin.published : t.admin.drafts}
              </span>
              <span>
                <button onClick={() => setEditing(test)} type="button">
                  {t.admin.edit}
                </button>
                <a href={`/test/${test.id}`}>{t.admin.preview}</a>
                <button
                  className="danger"
                  onClick={async () => {
                    if (confirm(t.admin.deleteConfirm)) {
                      await deleteTest(test.id);
                      refresh();
                    }
                  }}
                  type="button"
                >
                  {t.admin.delete}
                </button>
              </span>
            </div>
          ))}
        </div>

        {editing && (
          <div className="builder-backdrop">
            <form className="test-builder" onSubmit={submit}>
              <header>
                <div>
                  <span>{editing.id ? t.admin.editTest : t.admin.newTest}</span>
                  <h2>{editing.title || t.admin.untitledTest}</h2>
                </div>
                <button aria-label="Close editor" onClick={() => setEditing(null)} type="button">
                  ×
                </button>
              </header>

              <div className="builder-body">
                <section className="builder-section">
                  <h3>{t.admin.basicInfo}</h3>
                  <div className="form-grid">
                    <label className="wide">
                      {t.admin.fieldTitle}
                      <input onChange={(e) => update("title", e.target.value)} required value={editing.title} />
                    </label>
                    <label>
                      {t.admin.fieldModule}
                      <select onChange={(e) => update("module", e.target.value as IELTSModule)} value={editing.module}>
                        <option value="reading">{t.modules.reading.name}</option>
                        <option value="listening">{t.modules.listening.name}</option>
                        <option value="writing">{t.modules.writing.name}</option>
                        <option value="speaking">{t.modules.speaking.name}</option>
                      </select>
                    </label>
                    <label>
                      {t.admin.fieldTraining}
                      <select onChange={(e) => update("trainingType", e.target.value as "academic" | "general")} value={editing.trainingType}>
                        <option value="academic">{t.library.academic}</option>
                        <option value="general">{t.library.general}</option>
                      </select>
                    </label>
                    <label>
                      {t.admin.fieldDuration}
                      <input min="1" onChange={(e) => update("durationMinutes", Number(e.target.value))} type="number" value={editing.durationMinutes} />
                    </label>
                    <label>
                      {t.admin.fieldStatus}
                      <select onChange={(e) => update("status", e.target.value as "draft" | "published")} value={editing.status}>
                        <option value="draft">{t.admin.drafts}</option>
                        <option value="published">{t.admin.published}</option>
                      </select>
                    </label>
                    <label className="wide">
                      {t.admin.fieldCollection}
                      <input onChange={(e) => update("collection", e.target.value)} value={editing.collection} />
                    </label>
                    <label className="wide">
                      {t.admin.fieldDescription}
                      <textarea onChange={(e) => update("description", e.target.value)} value={editing.description} />
                    </label>
                  </div>
                </section>

                {(editing.module === "reading" || editing.module === "listening") && (
                  <section className="builder-section">
                    <h3>{editing.module === "reading" ? t.admin.readingPassage : t.admin.transcriptAudio}</h3>
                    <label>
                      {t.admin.passageTranscript}
                      <textarea className="large-input" onChange={(e) => update("passage", e.target.value)} value={editing.passage ?? ""} />
                    </label>
                    {editing.module === "listening" && (
                      <>
                        <label>
                          {t.admin.audioUrl}
                          <input onChange={(e) => update("audioUrl", e.target.value)} placeholder="https://…" value={editing.audioUrl ?? ""} />
                        </label>
                        <label className="upload-field">
                          {t.admin.uploadAudio}
                          <input
                            accept="audio/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSaving(true);
                                update("audioUrl", await uploadTestAudio(file, editing.id || "new-test"));
                                setSaving(false);
                              }
                            }}
                            type="file"
                          />
                        </label>
                      </>
                    )}
                  </section>
                )}

                {editing.module === "writing" && (
                  <section className="builder-section">
                    <h3>{t.admin.writingPrompt}</h3>
                    <label>
                      {t.admin.taskInstructions}
                      <textarea className="large-input" onChange={(e) => update("taskPrompt", e.target.value)} value={editing.taskPrompt ?? ""} />
                    </label>
                  </section>
                )}

                {editing.module === "speaking" && (
                  <section className="builder-section">
                    <h3>{t.admin.speakingParts}</h3>
                    {(editing.speakingParts ?? ["", "", ""]).map((part, i) => (
                      <label key={i}>
                        {t.runner.part} {i + 1}
                        <textarea
                          onChange={(e) => {
                            const parts = [...(editing.speakingParts ?? [])];
                            parts[i] = e.target.value;
                            update("speakingParts", parts);
                          }}
                          value={part}
                        />
                      </label>
                    ))}
                  </section>
                )}

                {(editing.module === "reading" || editing.module === "listening") && (
                  <section className="builder-section">
                    <div className="question-heading">
                      <div>
                        <h3>{t.admin.questionsHeading}</h3>
                        <p>{t.admin.questionsSub}</p>
                      </div>
                      <button onClick={addQuestion} type="button">
                        {t.admin.addQuestion}
                      </button>
                    </div>
                    {editing.questions.map((q, i) => (
                      <article className="question-builder" key={q.id}>
                        <div>
                          <strong>
                            {t.runner.question} {i + 1}
                          </strong>
                          <button onClick={() => update("questions", editing.questions.filter((item) => item.id !== q.id))} type="button">
                            {t.admin.removeQuestion}
                          </button>
                        </div>
                        <label>
                          {t.admin.questionText}
                          <textarea onChange={(e) => updateQuestion(q.id, "prompt", e.target.value)} value={q.prompt} />
                        </label>
                        <div className="form-grid">
                          <label>
                            {t.admin.fieldType}
                            <select onChange={(e) => updateQuestion(q.id, "type", e.target.value as QuestionType)} value={q.type}>
                              <option value="multiple-choice">Multiple choice</option>
                              <option value="true-false-not-given">True / False / Not Given</option>
                              <option value="short-answer">Short answer</option>
                            </select>
                          </label>
                          <label>
                            {t.admin.fieldPoints}
                            <input min="1" onChange={(e) => updateQuestion(q.id, "points", Number(e.target.value))} type="number" value={q.points} />
                          </label>
                          <label className="wide">
                            {t.admin.fieldOptions}
                            <textarea
                              disabled={q.type === "short-answer"}
                              onChange={(e) => updateQuestion(q.id, "options", e.target.value.split("\n").filter(Boolean))}
                              value={(q.options ?? []).join("\n")}
                            />
                          </label>
                          <label className="wide">
                            {t.admin.fieldAnswer}
                            <input onChange={(e) => updateQuestion(q.id, "answer", e.target.value)} required value={q.answer ?? ""} />
                          </label>
                        </div>
                      </article>
                    ))}
                  </section>
                )}
              </div>

              <footer>
                <button onClick={() => setEditing(null)} type="button">
                  {t.admin.cancel}
                </button>
                <button disabled={saving} type="submit">
                  {saving ? t.admin.saving : firebaseConfigured ? t.admin.saveFirebase : t.admin.saveDemo}
                </button>
              </footer>
            </form>
          </div>
        )}
      </section>
    </AppShell>
  );
}
