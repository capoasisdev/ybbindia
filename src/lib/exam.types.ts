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

async function loadSettings(supabase: any): Promise<SettingsMap> {
  const { data } = await supabase.from("settings").select("key, value");
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

async function loadEnrolment(supabase: any, userId: string) {
  const { data } = await supabase
    .from("enrolments")
    .select("id, course_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
