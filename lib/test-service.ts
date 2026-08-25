"use client";

import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseConfigured, getFirebaseServices } from "./firebase";
import { SAMPLE_TESTS } from "./sample-data";
import type { Attempt, IELTSTest, IELTSModule } from "./types";

const TEST_KEY = "ielts-scholars-demo-tests";
const ATTEMPT_KEY = "ielts-scholars-demo-attempts";

function localTests(): IELTSTest[] {
  if (typeof window === "undefined") return SAMPLE_TESTS;
  const stored = window.localStorage.getItem(TEST_KEY);
  return stored ? JSON.parse(stored) : SAMPLE_TESTS;
}

export async function listTests(module?: IELTSModule, includeDrafts = false): Promise<IELTSTest[]> {
  const services = getFirebaseServices();
  if (!services) return localTests().filter((test) => (!module || test.module === module) && (includeDrafts || test.status === "published"));
  const constraints = includeDrafts ? [orderBy("updatedAt", "desc")] : [where("status", "==", "published")];
  const snapshot = await getDocs(query(collection(services.db, "tests"), ...constraints));
  const tests = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as IELTSTest));
  const resolved = tests.length ? tests : SAMPLE_TESTS;
  return resolved.filter((test) => !module || test.module === module);
}

export async function getTest(id: string): Promise<IELTSTest | null> {
  const services = getFirebaseServices();
  if (!services) return localTests().find((test) => test.id === id) ?? null;
  const snapshot = await getDoc(doc(services.db, "tests", id));
  if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as IELTSTest;
  return SAMPLE_TESTS.find((test) => test.id === id) ?? null;
}

export async function saveTest(test: IELTSTest): Promise<void> {
  const now = new Date().toISOString();
  const record = { ...test, updatedAt: now, createdAt: test.createdAt ?? now };
  const services = getFirebaseServices();
  if (!services) {
    const items = localTests();
    const index = items.findIndex((item) => item.id === test.id);
    if (index >= 0) items[index] = record; else items.unshift(record);
    window.localStorage.setItem(TEST_KEY, JSON.stringify(items));
    return;
  }
  await setDoc(doc(services.db, "tests", test.id), record);
}

export async function deleteTest(id: string): Promise<void> {
  const services = getFirebaseServices();
  if (!services) {
    window.localStorage.setItem(TEST_KEY, JSON.stringify(localTests().filter((test) => test.id !== id)));
    return;
  }
  await deleteDoc(doc(services.db, "tests", id));
}

export async function seedSampleTests(): Promise<void> {
  await Promise.all(SAMPLE_TESTS.map(saveTest));
}

export async function uploadTestAudio(file: File, testId: string): Promise<string> {
  const services = getFirebaseServices();
  if (!services) return URL.createObjectURL(file);
  const target = ref(services.storage, `test-audio/${testId}/${Date.now()}-${file.name}`);
  await uploadBytes(target, file, { contentType: file.type });
  return getDownloadURL(target);
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  const services = getFirebaseServices();
  if (!services) {
    const current: Attempt[] = JSON.parse(window.localStorage.getItem(ATTEMPT_KEY) ?? "[]");
    window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify([attempt, ...current]));
    return;
  }
  await setDoc(doc(services.db, "attempts", attempt.id), attempt);
}

export async function listAttempts(userId: string): Promise<Attempt[]> {
  const services = getFirebaseServices();
  if (!services) return JSON.parse(window.localStorage.getItem(ATTEMPT_KEY) ?? "[]");
  const snapshot = await getDocs(query(collection(services.db, "attempts"), where("userId", "==", userId)));
  return snapshot.docs.map((item) => item.data() as Attempt).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function objectiveScore(test: IELTSTest, answers: Record<string, string>) {
  const objective = test.questions.filter((question) => question.answer);
  const score = objective.reduce((sum, question) => {
    const actual = (answers[question.id] ?? "").trim().toLowerCase();
    const expected = (question.answer ?? "").trim().toLowerCase();
    return sum + (actual === expected ? question.points : 0);
  }, 0);
  const total = objective.reduce((sum, question) => sum + question.points, 0);
  const ratio = total ? score / total : 0;
  const estimatedBand = total ? Math.max(1, Math.min(9, Math.round((1 + ratio * 8) * 2) / 2)) : null;
  return { score, total, estimatedBand };
}

export { firebaseConfigured };
