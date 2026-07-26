import { readBool, readNumber, type SettingsMap } from "@/domain/settings";
import type { ExamOverview, ExamPaper, ExamQuestion, ExamResult } from "./exam.types";

async function loadSettings(supabase: any): Promise<SettingsMap> {
  const { data } = await supabase.from("settings").select("key, value");
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function loadEnrolment(supabase: any, userId: string) {
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

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function loadPaper(
  supabase: any,
  userId: string,
  attemptId: string,
): Promise<ExamPaper> {
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

export async function buildOverview(supabase: any, userId: string): Promise<ExamOverview> {
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
