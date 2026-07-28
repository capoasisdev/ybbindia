import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AssignmentSubmission = {
  id: string;
  attemptNumber: number;
  fileName: string | null;
  storagePath: string;
  learnerNote: string | null;
  status: string;
  submittedAt: string | null;
  reviewerFeedback: string | null;
  score: number | null;
  reviewedAt: string | null;
};

export type LearnerAssignment = {
  id: string;
  title: string;
  instructions: string | null;
  moduleTitle: string | null;
  position: number;
  isFinalProject: boolean;
  isCompulsory: boolean;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxAttempts: number;
  attemptsUsed: number;
  submissions: AssignmentSubmission[];
};

export type AssignmentsOverview = {
  enrolled: boolean;
  assignments: LearnerAssignment[];
  submittedCount: number;
  approvedCount: number;
};

/** Every published assignment plus the signed-in learner's submissions. */
export const getLearnerAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AssignmentsOverview> => {
    const { supabase, userId } = context;

    const { data: enrolment } = await supabase
      .from("enrolments")
      .select("id, course_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrolment) {
      return { enrolled: false, assignments: [], submittedCount: 0, approvedCount: 0 };
    }

    const [assignmentsRes, modulesRes, submissionsRes] = await Promise.all([
      supabase
        .from("assignments")
        .select(
          "id, title, instructions, module_id, position, is_final_project, is_compulsory, allowed_file_types, max_file_size_mb, max_attempts",
        )
        .eq("course_id", enrolment.course_id)
        .eq("is_published", true)
        .order("position"),
      supabase.from("modules").select("id, title").eq("course_id", enrolment.course_id),
      supabase
        .from("submissions")
        .select(
          "id, assignment_id, attempt_number, file_name, storage_path, learner_note, status, submitted_at, reviewer_feedback, score, reviewed_at",
        )
        .eq("user_id", userId)
        .order("attempt_number", { ascending: false }),
    ]);

    const moduleTitles = new Map(
      (modulesRes.data ?? []).map((m: any) => [m.id, m.title as string]),
    );
    const submissions = submissionsRes.data ?? [];

    let submittedCount = 0;
    let approvedCount = 0;

    const assignments: LearnerAssignment[] = (assignmentsRes.data ?? []).map((a: any) => {
      const mine = submissions
        .filter((s: any) => s.assignment_id === a.id)
        .map((s: any) => ({
          id: s.id,
          attemptNumber: s.attempt_number,
          fileName: s.file_name,
          storagePath: s.storage_path,
          learnerNote: s.learner_note,
          status: s.status,
          submittedAt: s.submitted_at,
          reviewerFeedback: s.reviewer_feedback,
          score: s.score,
          reviewedAt: s.reviewed_at,
        }));
      if (mine.length > 0) submittedCount += 1;
      if (mine.some((s) => s.status === "approved")) approvedCount += 1;
      return {
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        moduleTitle: a.module_id ? (moduleTitles.get(a.module_id) ?? null) : null,
        position: a.position ?? 0,
        isFinalProject: Boolean(a.is_final_project),
        isCompulsory: Boolean(a.is_compulsory),
        allowedFileTypes: a.allowed_file_types ?? ["pdf"],
        maxFileSizeMb: a.max_file_size_mb ?? 10,
        maxAttempts: a.max_attempts ?? 3,
        attemptsUsed: mine.length,
        submissions: mine,
      };
    });

    return { enrolled: true, assignments, submittedCount, approvedCount };
  });

/** Records an uploaded submission file against an assignment. */
export const recordSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      assignmentId: string;
      storagePath: string;
      fileName: string;
      fileSizeBytes: number;
      learnerNote?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (!data.storagePath.startsWith(`${userId}/`)) {
      throw new Error("Invalid upload path");
    }

    const { data: assignment } = await supabase
      .from("assignments")
      .select("id, max_attempts, max_file_size_mb, allowed_file_types")
      .eq("id", data.assignmentId)
      .eq("is_published", true)
      .maybeSingle();
    if (!assignment) throw new Error("Assignment not available");

    const extension = data.fileName.split(".").pop()?.toLowerCase() ?? "";
    const allowed: string[] = assignment.allowed_file_types ?? ["pdf"];
    if (!allowed.includes(extension)) {
      throw new Error(`Only ${allowed.join(", ").toUpperCase()} files are accepted`);
    }
    if (data.fileSizeBytes > (assignment.max_file_size_mb ?? 10) * 1024 * 1024) {
      throw new Error(`File exceeds ${assignment.max_file_size_mb} MB`);
    }

    const { data: existing } = await supabase
      .from("submissions")
      .select("id, attempt_number")
      .eq("user_id", userId)
      .eq("assignment_id", data.assignmentId)
      .order("attempt_number", { ascending: false });

    const attempts = existing ?? [];
    if (attempts.length >= (assignment.max_attempts ?? 3)) {
      throw new Error("No attempts remaining for this assignment");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("submissions")
      .update({ is_latest: false })
      .eq("user_id", userId)
      .eq("assignment_id", data.assignmentId);

    const { error } = await supabaseAdmin.from("submissions").insert({
      assignment_id: data.assignmentId,
      user_id: userId,
      attempt_number: (attempts[0]?.attempt_number ?? 0) + 1,
      storage_path: data.storagePath,
      file_name: data.fileName,
      file_size_bytes: data.fileSizeBytes,
      learner_note: data.learnerNote?.trim() || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      is_latest: true,
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Short-lived download link for one of the learner's own submission files. */
export const getSubmissionUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { submissionId: string }) => input)
  .handler(async ({ data, context }): Promise<{ url: string | null }> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("submissions")
      .select("storage_path, user_id")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (!row || row.user_id !== userId) return { url: null };
    const { data: signed } = await supabase.storage
      .from("submissions")
      .createSignedUrl(row.storage_path, 60 * 10);
    return { url: signed?.signedUrl ?? null };
  });
