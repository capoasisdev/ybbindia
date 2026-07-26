export type ExamQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  marks: number;
};

export type ExamAttemptSummary = {
  id: string;
  attemptNumber: number;
  status: string;
  scorePercent: number | null;
  isPassed: boolean | null;
  endedAt: string | null;
  startedAt: string;
};

export type ExamOverview = {
  enrolled: boolean;
  config: {
    questionCount: number;
    durationMinutes: number;
    passPercent: number;
    maxAttempts: number;
    waitHours: number;
  };
  eligibility: {
    canStart: boolean;
    reasons: string[];
    lessonsCompleted: number;
    lessonsTotal: number;
    assignmentsApproved: number;
    assignmentsTotal: number;
    attemptsUsed: number;
    nextAttemptAt: string | null;
  };
  activeAttempt: { id: string; expiresAt: string } | null;
  attempts: ExamAttemptSummary[];
  passed: boolean;
};


export type ExamPaper = {
  attemptId: string;
  expiresAt: string;
  questions: ExamQuestion[];
  answers: Record<string, string>;
};

export type ExamResult = {
  scorePercent: number;
  score: number;
  totalMarks: number;
  isPassed: boolean;
  passPercent: number;
};
