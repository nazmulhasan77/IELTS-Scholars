export type IELTSModule = "reading" | "listening" | "writing" | "speaking";
export type TrainingType = "academic" | "general";
export type TestStatus = "draft" | "published";
export type QuestionType = "multiple-choice" | "true-false-not-given" | "short-answer" | "essay" | "speaking-cue";

export type IELTSQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer?: string;
  points: number;
  instructions?: string;
  alternativeAnswers?: string[];
  explanation?: string;
  paragraphRef?: string;
};

export type IELTSTest = {
  id: string;
  title: string;
  module: IELTSModule;
  trainingType: TrainingType;
  collection: string;
  description: string;
  durationMinutes: number;
  status: TestStatus;
  passage?: string;
  audioUrl?: string;
  taskPrompt?: string;
  speakingParts?: string[];
  questions: IELTSQuestion[];
  taskType?: "task1" | "task2";
  taskBadge?: string;
  minWords?: number;
  imageUrl?: string;
  chartData?: {
    title: string;
    yAxisLabel?: string;
    categories: string[];
    series: { name: string; color: string; data: number[] }[];
  };
  difficulty?: string;
  sampleAnswer?: string;
  tags?: string[];
  bandRubric?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

export type Attempt = {
  id: string;
  testId: string;
  testTitle: string;
  module: IELTSModule;
  userId: string;
  answers: Record<string, string>;
  score: number;
  total: number;
  estimatedBand: number | null;
  status: "scored" | "pending-review";
  submittedAt: string;
};

export type UserRole = "student" | "admin";
