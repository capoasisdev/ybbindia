import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildOverview, loadEnrolment, loadPaper, shuffle } from "./exam.server";
import type { ExamOverview, ExamPaper, ExamQuestion, ExamResult } from "./exam.types";

export type {
  ExamAttemptSummary,
  ExamOverview,
  ExamPaper,
  ExamQuestion,
  ExamResult,
} from "./exam.types";

/** Exam rules, eligibility checks and the learner's attempt history. */
export const getExamOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamOverview> =>
    buildOverview(context.supabase, context.userId),
  );

/** Starts a timed attempt with a randomised question snapshot. */
export const startExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamPaper> => {
    const { supabase, userId } = context;
    const overview = await buildOverview(supabase, userId);
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

    const snapshot: ExamQuestion[] = shuffle(pool)
      .slice(0, overview.config.questionCount)
      .map((q: any) => ({
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
      .select("id, expires_at")
      .single();
    if (error) throw new Error(error.message);

    return { attemptId: inserted.id, expiresAt: inserted.expires_at, questions: snapshot, answers: {} };
  });

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
    const { error } = await context.supabase
      .from("exam_attempts")
      .update({ answers: data.answers })
      .eq("id", data.attemptId)
      .eq("user_id", context.userId)
      .eq("status", "in_progress");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
      .select(
        "id, user_id, status, question_snapshot, pass_percent, score, total_marks, score_percent, is_passed",
      )
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

    const snapshot = (attempt.question_snapshot as unknown as ExamQuestion[]) ?? [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: keys } = await supabaseAdmin
      .from("questions")
      .select("id, correct_option_ids, marks")
      .in(
        "id",
        snapshot.map((q) => q.id),
      );

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
        status: data.timedOut ? "auto_submitted" : "submitted",
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
