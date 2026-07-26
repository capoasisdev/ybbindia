import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readBool, readNumber, type SettingsMap } from "@/domain/settings";

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

/** Exam rules, eligibility checks and the learner's attempt history. */
export const getExamOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamOverview> => {
    const { supabase, userId } = context;
    const settings = await loadSettings(supabase);

    const config = {
      questionCount: readNumber(settings, "exam_question_count"),
      durationMinutes: readNumber(settings, "exam_duration_minutes"),
      passPercent: readNumber(settings, "exam_pass_percent"),
      maxAttempts: readNumber(settings, "exam_max_attempts"),
      waitHours: readNumber(settings, "exam_wait_hours"),
    };

    const enrolment = await loadEnrolment(supabase, userId);
    if (!enrolment) {
      return {
        enrolled: false,
        config,
        eligibility: {
          canStart: false,
          reasons: ["You are not enrolled in the programme."],
          lessonsCompleted: 0,
          lessonsTotal: 0,
          assignmentsApproved: 0,
          assignmentsTotal: 0,
          attemptsUsed: 0,
          nextAttemptAt: null,
        },
        activeAttempt: null,
        attempts: [],
        passed: false,
      };
    }

    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", enrolment.course_id)
      .eq("is_published", true);
    const moduleIds = (modules ?? []).map((m: any) => m.id);

    let lessonsTotal = 0;
    let lessonIds: string[] = [];
    if (moduleIds.length > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds)
        .eq("is_published", true);
      lessonIds = (lessons ?? []).map((l: any) => l.id);
      lessonsTotal = lessonIds.length;
    }

    const [progressRes, assignmentsRes, submissionsRes, attemptsRes] = await Promise.all([
      lessonIds.length
        ? supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("user_id", userId)
            .eq("is_complete", true)
            .in("lesson_id", lessonIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("assignments")
        .select("id")
        .eq("course_id", enrolment.course_id)
        .eq("is_published", true)
        .eq("is_compulsory", true),
      supabase.from("submissions").select("assignment_id, status").eq("user_id", userId),
      supabase
        .from("exam_attempts")
        .select("id, attempt_number, status, score_percent, is_passed, ended_at, started_at, expires_at")
        .eq("user_id", userId)
        .order("attempt_number", { ascending: false }),
    ]);

    const lessonsCompleted = (progressRes.data ?? []).length;
    const compulsory = assignmentsRes.data ?? [];
    const approvedIds = new Set(
      (submissionsRes.data ?? [])
        .filter((s: any) => s.status === "approved")
        .map((s: any) => s.assignment_id),
    );
    const assignmentsApproved = compulsory.filter((a: any) => approvedIds.has(a.id)).length;

    const attemptRows = attemptsRes.data ?? [];
    const now = Date.now();
    const active = attemptRows.find(
      (a: any) => a.status === "in_progress" && new Date(a.expires_at).getTime() > now,
    );
    const finished = attemptRows.filter((a: any) => a.status !== "in_progress");
    const passed = finished.some((a: any) => a.is_passed);

    const lastEnded = finished
      .map((a: any) => (a.ended_at ? new Date(a.ended_at).getTime() : 0))
      .sort((a: number, b: number) => b - a)[0];
    const nextAttemptAt =
      lastEnded && !passed
        ? new Date(lastEnded + config.waitHours * 3600_000).toISOString()
        : null;

    const reasons: string[] = [];
    if (readBool(settings, "exam_require_all_lessons") && lessonsCompleted < lessonsTotal) {
      reasons.push(`Complete all ${lessonsTotal} lessons (${lessonsCompleted} done).`);
    }
    if (readBool(settings, "exam_require_assignments") && assignmentsApproved < compulsory.length) {
      reasons.push(
        `All ${compulsory.length} compulsory assignments must be approved (${assignmentsApproved} approved).`,
      );
    }
    if (passed) reasons.push("You have already passed the examination.");
    if (finished.length >= config.maxAttempts && !passed) {
      reasons.push("You have used all available attempts — contact support.");
    }
    if (nextAttemptAt && new Date(nextAttemptAt).getTime() > now) {
      reasons.push(`Cooling-off period ends ${new Date(nextAttemptAt).toLocaleString("en-IN")}.`);
    }

    return {
      enrolled: true,
      config,
      eligibility: {
        canStart: reasons.length === 0,
        reasons,
        lessonsCompleted,
        lessonsTotal,
        assignmentsApproved,
        assignmentsTotal: compulsory.length,
        attemptsUsed: finished.length,
        nextAttemptAt,
      },
      activeAttempt: active ? { id: active.id, expiresAt: active.expires_at } : null,
      attempts: attemptRows.map((a: any) => ({
        id: a.id,
        attemptNumber: a.attempt_number,
        status: a.status,
        scorePercent: a.score_percent === null ? null : Number(a.score_percent),
        isPassed: a.is_passed,
        endedAt: a.ended_at,
        startedAt: a.started_at,
      })),
      passed,
    };
  });

export type ExamPaper = {
  attemptId: string;
  expiresAt: string;
  questions: ExamQuestion[];
  answers: Record<string, string>;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Starts a timed attempt with a randomised question snapshot. */
export const startExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamPaper> => {
    const { supabase, userId } = context;
    const overview = await getExamOverview();
    if (overview.activeAttempt) {
      return await loadPaper(supabase, userId, overview.activeAttempt.id);
    }
    if (!overview.eligibility.canStart) {
      throw new Error(overview.eligibility.reasons[0] ?? "You cannot start the exam yet");
    }

    const enrolment = await loadEnrolment(supabase, userId);
    if (!enrolment) throw new Error("You are not enrolled in the programme");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bank } = await supabaseAdmin
      .from("questions")
      .select("id, prompt, options, marks")
      .eq("course_id", enrolment.course_id)
      .eq("is_archived", false);

    const pool = bank ?? [];
    if (pool.length === 0) throw new Error("The question bank is empty");

    const selected = shuffle(pool).slice(0, overview.config.questionCount);
    const snapshot = selected.map((q: any) => ({
      id: q.id,
      prompt: q.prompt,
      options: shuffle((q.options as any[]) ?? []),
      marks: q.marks ?? 1,
    }));

    const expiresAt = new Date(Date.now() + overview.config.durationMinutes * 60_000).toISOString();

    const { data: inserted, error } = await supabase
      .from("exam_attempts")
      .insert({
        user_id: userId,
        course_id: enrolment.course_id,
        attempt_number: overview.eligibility.attemptsUsed + 1,
        status: "in_progress",
        question_count: snapshot.length,
        duration_minutes: overview.config.durationMinutes,
        pass_percent: overview.config.passPercent,
        expires_at: expiresAt,
        question_snapshot: snapshot,
        answers: {},
      })
      .select("id, expires_at, question_snapshot, answers")
      .single();
    if (error) throw new Error(error.message);

    return {
      attemptId: inserted.id,
      expiresAt: inserted.expires_at,
      questions: snapshot,
      answers: {},
    };
  });

async function loadPaper(supabase: any, userId: string, attemptId: string): Promise<ExamPaper> {
  const { data } = await supabase
    .from("exam_attempts")
    .select("id, user_id, expires_at, question_snapshot, answers, status")
    .eq("id", attemptId)
    .maybeSingle();
  if (!data || data.user_id !== userId) throw new Error("Attempt not found");
  return {
    attemptId: data.id,
    expiresAt: data.expires_at,
    questions: (data.question_snapshot as ExamQuestion[]) ?? [],
    answers: (data.answers as Record<string, string>) ?? {},
  };
}

/** Reloads an in-progress attempt (resume after refresh). */
export const resumeExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attemptId: string }) => input)
  .handler(async ({ data, context }): Promise<ExamPaper> =>
    loadPaper(context.supabase, context.userId, data.attemptId),
  );

/** Autosaves selected answers without grading. */
export const saveExamAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attemptId: string; answers: Record<string, string> }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("exam_attempts")
      .update({ answers: data.answers })
      .eq("id", data.attemptId)
      .eq("user_id", userId)
      .eq("status", "in_progress");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ExamResult = {
  scorePercent: number;
  score: number;
  totalMarks: number;
  isPassed: boolean;
  passPercent: number;
};

/** Grades and closes an attempt. Safe to call on timeout. */
export const submitExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { attemptId: string; answers: Record<string, string>; timedOut?: boolean }) => input,
  )
  .handler(async ({ data, context }): Promise<ExamResult> => {
    const { supabase, userId } = context;

    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("id, user_id, status, question_snapshot, pass_percent, score, total_marks, score_percent, is_passed")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!attempt || attempt.user_id !== userId) throw new Error("Attempt not found");

    if (attempt.status !== "in_progress") {
      return {
        scorePercent: Number(attempt.score_percent ?? 0),
        score: attempt.score ?? 0,
        totalMarks: attempt.total_marks ?? 0,
        isPassed: Boolean(attempt.is_passed),
        passPercent: attempt.pass_percent,
      };
    }

    const snapshot = (attempt.question_snapshot as ExamQuestion[]) ?? [];
    const questionIds = snapshot.map((q) => q.id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: keys } = await supabaseAdmin
      .from("questions")
      .select("id, correct_option_ids, marks")
      .in("id", questionIds);

    const keyById = new Map((keys ?? []).map((k: any) => [k.id, k]));
    let score = 0;
    let totalMarks = 0;
    for (const question of snapshot) {
      const key = keyById.get(question.id);
      const marks = key?.marks ?? question.marks ?? 1;
      totalMarks += marks;
      const chosen = data.answers[question.id];
      if (chosen && (key?.correct_option_ids ?? []).includes(chosen)) score += marks;
    }

    const scorePercent = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
    const isPassed = scorePercent >= attempt.pass_percent;

    const { error } = await supabase
      .from("exam_attempts")
      .update({
        answers: data.answers,
        status: data.timedOut ? "expired" : "submitted",
        ended_at: new Date().toISOString(),
        score,
        total_marks: totalMarks,
        score_percent: scorePercent,
        is_passed: isPassed,
      })
      .eq("id", attempt.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { scorePercent, score, totalMarks, isPassed, passPercent: attempt.pass_percent };
  });
