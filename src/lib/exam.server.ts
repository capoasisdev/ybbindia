import { readBool, readNumber, readSetting, type SettingsMap } from "@/domain/settings";
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

  const rawQuestions = (data.question_snapshot as any[]) ?? [];
  const questions = rawQuestions.map((q: any) => {
    const rawOpts = Array.isArray(q.options) ? q.options : [];
    const isObjectStyle = rawOpts.length > 0 && typeof rawOpts[0] === 'object' && rawOpts[0] !== null && 'text' in rawOpts[0];
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const formattedOptions = isObjectStyle 
      ? rawOpts.map((o: any) => ({ id: o.id || ids[rawOpts.indexOf(o)] || "a", text: o.text || "" }))
      : rawOpts.map((o: any, idx: number) => ({ id: ids[idx] || String(idx), text: String(o) }));
    return {
      ...q,
      options: formattedOptions
    };
  });

  return {
    attemptId: data.id,
    expiresAt: data.expires_at,
    questions,
    answers: (data.answers as Record<string, string>) ?? {},
  };
}

export async function buildOverview(supabase: any, userId: string): Promise<ExamOverview> {
  const settings = await loadSettings(supabase);

  const freeAttemptsCount = readNumber(settings, "exam_free_attempts");
  const attemptPricePaise = readNumber(settings, "exam_attempt_price_paise");
  const gstRatePercent = readNumber(settings, "gst_rate_percent");
  const currency = String(readSetting(settings, "currency") ?? "INR");
  const testMode = readBool(settings, "payments_test_mode");

  const config = {
    questionCount: readNumber(settings, "exam_question_count"),
    durationMinutes: readNumber(settings, "exam_duration_minutes"),
    passPercent: readNumber(settings, "exam_pass_percent"),
    maxAttempts: readNumber(settings, "exam_max_attempts"),
    waitHours: readNumber(settings, "exam_wait_hours"),
    freeAttempts: freeAttemptsCount,
    attemptPricePaise,
    gstRatePercent,
    currency,
    testMode,
  };

  const [enrolment, rolesRes] = await Promise.all([
    loadEnrolment(supabase, userId),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const roles = (rolesRes.data ?? []).map((r: any) => r.role);
  const isStaff = roles.some((r: string) => ['super_admin', 'content_admin', 'reviewer', 'support_admin'].includes(r));

  if (!enrolment && !isStaff) {
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
        freeAttemptsCount,
        paidAttemptsCount: 0,
        totalAllowedAttempts: freeAttemptsCount,
        requiresPayment: false,
        nextAttemptNumber: 1,
        nextAttemptAt: null,
      },
      activeAttempt: null,
      attempts: [],
      passed: false,
    };
  }

  // If staff but no enrolment, simulate a course ID to load stats/config
  let finalCourseId = enrolment?.course_id ?? null;
  if (!enrolment && isStaff) {
    const { data: firstCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("is_published", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    finalCourseId = firstCourse?.id ?? null;
  }

  if (!finalCourseId) {
    return {
      enrolled: false,
      config,
      eligibility: {
        canStart: false,
        reasons: ["No course found in the database."],
        lessonsCompleted: 0,
        lessonsTotal: 0,
        assignmentsApproved: 0,
        assignmentsTotal: 0,
        attemptsUsed: 0,
        freeAttemptsCount,
        paidAttemptsCount: 0,
        totalAllowedAttempts: freeAttemptsCount,
        requiresPayment: false,
        nextAttemptNumber: 1,
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
    .eq("course_id", finalCourseId)
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

  const [progressRes, assignmentsRes, submissionsRes, attemptsRes, paidOrdersRes] = await Promise.all([
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
      .eq("course_id", finalCourseId)
      .eq("is_published", true)
      .eq("is_compulsory", true),
    supabase.from("submissions").select("assignment_id, status").eq("user_id", userId),
    supabase
      .from("exam_attempts")
      .select(
        "id, attempt_number, status, score_percent, is_passed, ended_at, started_at, expires_at",
      )
      .eq("user_id", userId)
      .order("attempt_number", { ascending: false }),
    supabase
      .from("orders")
      .select("id, billing_snapshot")
      .eq("user_id", userId)
      .eq("status", "paid"),
  ]);

  const lessonsCompleted = isStaff ? lessonsTotal : (progressRes.data ?? []).length;
  const compulsory = assignmentsRes.data ?? [];
  const approvedIds = new Set(
    (submissionsRes.data ?? [])
      .filter((s: any) => s.status === "approved")
      .map((s: any) => s.assignment_id),
  );
  const assignmentsApproved = isStaff ? compulsory.length : compulsory.filter((a: any) => approvedIds.has(a.id)).length;

  const attemptRows = attemptsRes.data ?? [];
  const now = Date.now();
  const active = attemptRows.find(
    (a: any) => a.status === "in_progress" && new Date(a.expires_at).getTime() > now,
  );
  const finished = attemptRows.filter((a: any) => a.status !== "in_progress");
  const passed = finished.some((a: any) => a.is_passed);

  // Count paid orders for exam re-attempts
  const paidAttemptOrders = (paidOrdersRes.data ?? []).filter((o: any) => {
    const snap = o.billing_snapshot as any;
    return snap && snap.item_type === "exam_attempt";
  });
  const paidAttemptsCount = paidAttemptOrders.length;
  const totalAllowedAttempts = isStaff ? 999 : freeAttemptsCount + paidAttemptsCount;
  const attemptsUsed = finished.length;
  const nextAttemptNumber = attemptsUsed + 1;

  const lastEnded = finished
    .map((a: any) => (a.ended_at ? new Date(a.ended_at).getTime() : 0))
    .sort((a: number, b: number) => b - a)[0];
  const nextAttemptAt =
    lastEnded && !passed ? new Date(lastEnded + config.waitHours * 3600_000).toISOString() : null;

  let requiresPayment = false;
  const reasons: string[] = [];

  if (!isStaff) {
    if (readBool(settings, "exam_require_all_lessons") && lessonsCompleted < lessonsTotal) {
      reasons.push(`Complete all ${lessonsTotal} lessons (${lessonsCompleted} done).`);
    }
    if (readBool(settings, "exam_require_assignments") && assignmentsApproved < compulsory.length) {
      reasons.push(
        `All ${compulsory.length} compulsory assignments must be approved (${assignmentsApproved} approved).`,
      );
    }
    if (attemptsUsed >= totalAllowedAttempts && !passed) {
      requiresPayment = true;
      reasons.push(`Attempt #${nextAttemptNumber} requires payment to unlock.`);
    }
    if (attemptsUsed >= config.maxAttempts && !passed) {
      reasons.push("You have reached the maximum total attempt limit — contact support.");
    }
    if (nextAttemptAt && new Date(nextAttemptAt).getTime() > now) {
      reasons.push(`Cooling-off period ends ${new Date(nextAttemptAt).toLocaleString("en-IN")}.`);
    }
  }
  if (passed) reasons.push("You have already passed the examination.");

  return {
    enrolled: true,
    config,
    eligibility: {
      canStart: reasons.length === 0 && !requiresPayment,
      reasons,
      lessonsCompleted,
      lessonsTotal,
      assignmentsApproved,
      assignmentsTotal: compulsory.length,
      attemptsUsed,
      freeAttemptsCount,
      paidAttemptsCount,
      totalAllowedAttempts,
      requiresPayment,
      nextAttemptNumber,
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
}
