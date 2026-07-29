import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReviewDecision =
  | "under_review"
  | "approved"
  | "rejected"
  | "resubmission_required";

export type ReviewHistoryEntry = {
  id: string;
  decision: string;
  feedback: string;
  reviewerName: string | null;
  createdAt: string;
};

export type AdminSubmission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  isFinalProject: boolean;
  learnerId: string;
  learnerName: string | null;
  learnerEmail: string | null;
  attemptNumber: number;
  fileName: string;
  storagePath: string;
  learnerNote: string | null;
  status: string;
  score: number | null;
  reviewerFeedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  isLatest: boolean;
  history: ReviewHistoryEntry[];
};

export type AdminAuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  reason: string | null;
  createdAt: string;
};

const STAFF_ROLES = ["reviewer", "support_admin", "content_admin", "super_admin"];

async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.some((r: string) => STAFF_ROLES.includes(r))) {
    throw new Error("Forbidden: reviewer access required");
  }
  return roles as string[];
}

/** Every submission with its review history, optionally filtered. */
export const listAdminSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { status?: string; search?: string; latestOnly?: boolean }) => input ?? {})
  .handler(async ({ data, context }): Promise<{ submissions: AdminSubmission[]; counts: Record<string, number> }> => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    let query = supabase
      .from("submissions")
      .select(
        "id, assignment_id, user_id, attempt_number, file_name, storage_path, learner_note, status, score, reviewer_feedback, submitted_at, reviewed_at, is_latest",
      )
      .order("submitted_at", { ascending: false })
      .limit(300);

    if (data.status && data.status !== "all") query = query.eq("status", data.status as any);
    if (data.latestOnly) query = query.eq("is_latest", true);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const submissions = rows ?? [];

    const assignmentIds = [...new Set(submissions.map((s: any) => s.assignment_id))];
    const learnerIds = [...new Set(submissions.map((s: any) => s.user_id))];
    const submissionIds = submissions.map((s: any) => s.id);

    const [assignmentsRes, learnersRes, reviewsRes, allStatusRes] = await Promise.all([
      assignmentIds.length
        ? supabase.from("assignments").select("id, title, is_final_project").in("id", assignmentIds)
        : Promise.resolve({ data: [] as any[] }),
      learnerIds.length
        ? supabase.from("learner_profiles").select("id, full_name, email").in("id", learnerIds)
        : Promise.resolve({ data: [] as any[] }),
      submissionIds.length
        ? supabase
            .from("submission_reviews")
            .select("id, submission_id, reviewer_id, decision, feedback, created_at")
            .in("submission_id", submissionIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("submissions").select("status"),
    ]);

    const assignments = new Map(
      (assignmentsRes.data ?? []).map((a: any) => [a.id, a]),
    );
    const learners = new Map((learnersRes.data ?? []).map((l: any) => [l.id, l]));
    const reviewerIds = [...new Set((reviewsRes.data ?? []).map((r: any) => r.reviewer_id))];
    const { data: reviewers } = reviewerIds.length
      ? await supabase.from("learner_profiles").select("id, full_name").in("id", reviewerIds)
      : { data: [] as any[] };
    const reviewerNames = new Map((reviewers ?? []).map((r: any) => [r.id, r.full_name]));

    const counts: Record<string, number> = { all: 0 };
    for (const row of allStatusRes.data ?? []) {
      counts.all += 1;
      counts[(row as any).status] = (counts[(row as any).status] ?? 0) + 1;
    }

    const search = data.search?.trim().toLowerCase();

    const mapped: AdminSubmission[] = submissions.map((s: any) => {
      const assignment = assignments.get(s.assignment_id);
      const learner = learners.get(s.user_id);
      return {
        id: s.id,
        assignmentId: s.assignment_id,
        assignmentTitle: assignment?.title ?? "Assignment",
        isFinalProject: Boolean(assignment?.is_final_project),
        learnerId: s.user_id,
        learnerName: learner?.full_name ?? null,
        learnerEmail: learner?.email ?? null,
        attemptNumber: s.attempt_number,
        fileName: s.file_name,
        storagePath: s.storage_path,
        learnerNote: s.learner_note,
        status: s.status,
        score: s.score,
        reviewerFeedback: s.reviewer_feedback,
        submittedAt: s.submitted_at,
        reviewedAt: s.reviewed_at,
        isLatest: Boolean(s.is_latest),
        history: (reviewsRes.data ?? [])
          .filter((r: any) => r.submission_id === s.id)
          .map((r: any) => ({
            id: r.id,
            decision: r.decision,
            feedback: r.feedback,
            reviewerName: reviewerNames.get(r.reviewer_id) ?? null,
            createdAt: r.created_at,
          })),
      };
    });

    const filtered = search
      ? mapped.filter((s) =>
          [s.learnerName, s.learnerEmail, s.assignmentTitle, s.fileName]
            .filter(Boolean)
            .some((v) => (v as string).toLowerCase().includes(search)),
        )
      : mapped;

    return { submissions: filtered, counts };
  });

/** Records a reviewer decision and updates the submission. */
export const reviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      submissionId: string;
      decision: ReviewDecision;
      feedback: string;
      score?: number | null;
    }) => {
      if (!input.submissionId) throw new Error("Submission is required");
      if (!input.feedback?.trim()) throw new Error("Feedback is required");
      if (input.score != null && (input.score < 0 || input.score > 100)) {
        throw new Error("Score must be between 0 and 100");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const { data: submission } = await supabase
      .from("submissions")
      .select("id")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (!submission) throw new Error("Submission not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update({
        status: data.decision,
        reviewer_id: userId,
        reviewer_feedback: data.feedback.trim(),
        score: data.score ?? null,
        reviewed_at: now,
      })
      .eq("id", data.submissionId);
    if (updateError) throw new Error(updateError.message);

    const { error: reviewError } = await supabaseAdmin.from("submission_reviews").insert({
      submission_id: data.submissionId,
      reviewer_id: userId,
      decision: data.decision,
      feedback: data.feedback.trim(),
    });
    if (reviewError) throw new Error(reviewError.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      actor_email: context.claims?.email ?? null,
      action: `submission.${data.decision}`,
      entity_type: "submission",
      entity_id: data.submissionId,
      reason: data.feedback.trim().slice(0, 500),
      metadata: { score: data.score ?? null },
    });

    return { ok: true };
  });

/** Signed download link for a submission file (staff only). */
export const getAdminSubmissionUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { submissionId: string }) => input)
  .handler(async ({ data, context }): Promise<{ url: string | null }> => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const { data: row } = await supabase
      .from("submissions")
      .select("storage_path")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (!row) return { url: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("submissions")
      .createSignedUrl(row.storage_path, 60 * 10);
    return { url: signed?.signedUrl ?? null };
  });

/** Recent audit trail entries for staff visibility. */
export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { entityType?: string; search?: string }) => input ?? {})
  .handler(async ({ data, context }): Promise<AdminAuditLog[]> => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    let query = supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, actor_email, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (data.entityType && data.entityType !== "all") {
      query = query.eq("entity_type", data.entityType);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const search = data.search?.trim().toLowerCase();
    return (rows ?? [])
      .map((r: any) => ({
        id: r.id,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        actorEmail: r.actor_email,
        reason: r.reason,
        createdAt: r.created_at,
      }))
      .filter((r) =>
        search
          ? [r.action, r.entityType, r.entityId, r.actorEmail, r.reason]
              .filter(Boolean)
              .some((v) => (v as string).toLowerCase().includes(search))
          : true,
      );
  });
