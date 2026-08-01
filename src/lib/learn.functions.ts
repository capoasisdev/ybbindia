import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type AssignmentSubmission, type LearnerAssignment } from "./assignments.functions";

export type OutlineLesson = {
  id: string;
  title: string;
  summary: string | null;
  position: number;
  durationSeconds: number;
  hasVideo: boolean;
  completionWatchPercent: number;
  watchPercent: number;
  isComplete: boolean;
  lastPositionSeconds: number;
  isLocked: boolean;
};

export type OutlineModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: OutlineLesson[];
};

export type CourseOutline = {
  enrolled: boolean;
  courseTitle: string | null;
  sequential: boolean;
  modules: OutlineModule[];
  lessonsTotal: number;
  lessonsCompleted: number;
  nextLessonId: string | null;
};

async function loadOutline(supabase: any, userId: string): Promise<CourseOutline> {
  const [enrolmentRes, rolesRes] = await Promise.all([
    supabase
      .from("enrolments")
      .select("id, course_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
  ]);

  const enrolment = enrolmentRes.data ?? null;
  const roles = (rolesRes.data ?? []).map((r: any) => r.role);
  const isStaff = roles.some((r: string) => ['super_admin', 'content_admin', 'reviewer', 'support_admin'].includes(r));

  let courseId = enrolment?.course_id ?? null;

  if (!courseId) {
    // Find the first published course to show as preview outline
    const { data: firstCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("is_published", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    courseId = firstCourse?.id ?? null;
  }

  if (!courseId) {
    return {
      enrolled: false,
      courseTitle: null,
      sequential: true,
      modules: [],
      lessonsTotal: 0,
      lessonsCompleted: 0,
      nextLessonId: null,
    };
  }

  const [courseRes, modulesRes, settingRes] = await Promise.all([
    supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle(),
    supabase
      .from("modules")
      .select("id, title, description, position")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("position"),
    supabase.from("settings").select("key, value").in("key", ["sequential_lessons"]),
  ]);

  const sequentialRaw = (settingRes.data ?? []).find(
    (r: any) => r.key === "sequential_lessons",
  )?.value;
  const sequential = isStaff
    ? false
    : (sequentialRaw === undefined || sequentialRaw === null ? true : Boolean(sequentialRaw));

  const modules = modulesRes.data ?? [];
  const moduleIds = modules.map((m: any) => m.id);

  let lessons: any[] = [];
  let progress: any[] = [];
  if (moduleIds.length > 0) {
    const [lessonsRes, progressRes] = await Promise.all([
      supabase
        .from("lessons")
        .select(
          "id, module_id, title, summary, position, duration_seconds, video_url, video_storage_path, completion_watch_percent",
        )
        .in("module_id", moduleIds)
        .eq("is_published", true)
        .order("position"),
      supabase
        .from("lesson_progress")
        .select("lesson_id, watch_percent, is_complete, last_position_seconds")
        .eq("user_id", userId),
    ]);
    lessons = lessonsRes.data ?? [];
    progress = progressRes.data ?? [];
  }

  const hasEnrolment = enrolment !== null || isStaff;

  const progressByLesson = new Map(progress.map((p: any) => [p.lesson_id, p]));

  let previousComplete = true;
  let nextLessonId: string | null = null;
  let lessonsTotal = 0;
  let lessonsCompleted = 0;

  const outlineModules: OutlineModule[] = modules.map((m: any) => {
    const moduleLessons = lessons
      .filter((l) => l.module_id === m.id)
      .map((l) => {
        const p = progressByLesson.get(l.id);
        const isComplete = isStaff ? true : Boolean(p?.is_complete);
        const isLocked = hasEnrolment ? (sequential ? !previousComplete : false) : true;
        previousComplete = isComplete;
        lessonsTotal += 1;
        if (isComplete) lessonsCompleted += 1;
        if (!isComplete && !isLocked && !nextLessonId) nextLessonId = l.id;
        return {
          id: l.id,
          title: l.title,
          summary: l.summary,
          position: l.position,
          durationSeconds: l.duration_seconds ?? 0,
          hasVideo: Boolean(l.video_url || l.video_storage_path),
          completionWatchPercent: l.completion_watch_percent ?? 90,
          watchPercent: isStaff ? 100 : (p?.watch_percent ?? 0),
          isComplete,
          lastPositionSeconds: isStaff ? (l.duration_seconds ?? 600) : (p?.last_position_seconds ?? 0),
          isLocked,
        };
      });
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      position: m.position,
      lessons: moduleLessons,
    };
  });

  if (!nextLessonId) {
    const firstOpen = outlineModules.flatMap((m) => m.lessons).find((l) => !l.isComplete);
    nextLessonId = firstOpen?.id ?? null;
  }

  return {
    enrolled: hasEnrolment,
    courseTitle: courseRes.data?.title ?? null,
    sequential,
    modules: outlineModules,
    lessonsTotal,
    lessonsCompleted,
    nextLessonId: hasEnrolment ? nextLessonId : null,
  };
}

/** Full curriculum outline with the signed-in learner's progress. */
export const getCourseOutline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CourseOutline> =>
    loadOutline(context.supabase, context.userId),
  );

export type LessonPlayback = {
  outline: CourseOutline;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    moduleTitle: string;
    durationSeconds: number;
    completionWatchPercent: number;
    videoUrl: string | null;
    watchPercent: number;
    isComplete: boolean;
    lastPositionSeconds: number;
    isLocked: boolean;
    previousLessonId: string | null;
    nextLessonId: string | null;
    assignment?: LearnerAssignment | null;
  } | null;
};

/** One lesson plus a short-lived signed video URL, gated by enrolment + sequencing. */
export const getLessonPlayback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { lessonId: string }) => input)
  .handler(async ({ data, context }): Promise<LessonPlayback> => {
    const { supabase, userId } = context;
    const outline = await loadOutline(supabase, userId);
    if (!outline.enrolled) return { outline, lesson: null };

    const flat = outline.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
    );
    const index = flat.findIndex((l) => l.id === data.lessonId);
    if (index === -1) return { outline, lesson: null };
    const item = flat[index];

    let videoUrl: string | null = null;
    if (!item.isLocked) {
      const [lessonDetails, assignmentRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("description, video_url, video_storage_path")
          .eq("id", item.id)
          .maybeSingle(),
        supabase
          .from("assignments")
          .select("id, title, instructions, allowed_file_types, max_file_size_mb, max_attempts")
          .eq("lesson_id", item.id)
          .eq("is_published", true)
          .maybeSingle(),
      ]);

      const row = lessonDetails.data;
      const assignmentData = assignmentRes.data;

      let assignment = null;
      if (assignmentData) {
        const { data: submissions } = await supabase
          .from("submissions")
          .select(
            "id, attempt_number, file_name, storage_path, learner_note, status, submitted_at, reviewer_feedback, score, reviewed_at",
          )
          .eq("assignment_id", assignmentData.id)
          .eq("user_id", userId)
          .order("attempt_number", { ascending: false });

        const mappedSubmissions: AssignmentSubmission[] = (submissions ?? []).map((s: any) => ({
          id: s.id,
          attemptNumber: s.attempt_number,
          fileName: s.file_name,
          storagePath: s.storage_path,
          learnerNote: s.learner_note,
          status: s.status,
          submittedAt: s.submitted_at,
          reviewerFeedback: s.reviewer_feedback,
          score: s.score ? Number(s.score) : null,
          reviewedAt: s.reviewed_at,
        }));

        assignment = {
          id: assignmentData.id,
          title: assignmentData.title,
          instructions: assignmentData.instructions,
          moduleTitle: item.moduleTitle,
          position: item.position,
          isFinalProject: false,
          isCompulsory: true,
          allowedFileTypes: assignmentData.allowed_file_types,
          maxFileSizeMb: assignmentData.max_file_size_mb,
          maxAttempts: assignmentData.max_attempts,
          attemptsUsed: mappedSubmissions.length,
          submissions: mappedSubmissions,
        };
      }

      if (row?.video_url) {
        videoUrl = row.video_url;
      } else if (row?.video_storage_path) {
        const { data: signed } = await supabase.storage
          .from("lesson-videos")
          .createSignedUrl(row.video_storage_path, 60 * 60);
        videoUrl = signed?.signedUrl ?? null;
      }
      return {
        outline,
        lesson: {
          id: item.id,
          title: item.title,
          description: row?.description ?? item.summary,
          moduleTitle: item.moduleTitle,
          durationSeconds: item.durationSeconds,
          completionWatchPercent: item.completionWatchPercent,
          videoUrl,
          watchPercent: item.watchPercent,
          isComplete: item.isComplete,
          lastPositionSeconds: item.lastPositionSeconds,
          isLocked: false,
          previousLessonId: flat[index - 1]?.id ?? null,
          nextLessonId: flat[index + 1]?.id ?? null,
          assignment,
        },
      };
    }

    return {
      outline,
      lesson: {
        id: item.id,
        title: item.title,
        description: item.summary,
        moduleTitle: item.moduleTitle,
        durationSeconds: item.durationSeconds,
        completionWatchPercent: item.completionWatchPercent,
        videoUrl: null,
        watchPercent: item.watchPercent,
        isComplete: item.isComplete,
        lastPositionSeconds: item.lastPositionSeconds,
        isLocked: true,
        previousLessonId: flat[index - 1]?.id ?? null,
        nextLessonId: flat[index + 1]?.id ?? null,
      },
    };
  });

/** Records watch position/percentage; marks complete once the threshold is met. */
export const saveLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      lessonId: string;
      watchedSeconds: number;
      watchPercent: number;
      lastPositionSeconds: number;
      manualComplete?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, completion_mode, completion_watch_percent, video_url, video_storage_path")
      .eq("id", data.lessonId)
      .eq("is_published", true)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not available");

    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("id, watch_percent, watched_seconds, is_complete, completed_at")
      .eq("user_id", userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();

    const threshold = lesson.completion_watch_percent ?? 90;
    const watchPercent = Math.max(
      0,
      Math.min(100, Math.round(Math.max(data.watchPercent, existing?.watch_percent ?? 0))),
    );
    const watchedSeconds = Math.max(
      0,
      Math.round(Math.max(data.watchedSeconds, existing?.watched_seconds ?? 0)),
    );
    const hasVideo = Boolean(lesson.video_url || lesson.video_storage_path);
    const manualAllowed = lesson.completion_mode === "manual" || !hasVideo;
    const isComplete =
      Boolean(existing?.is_complete) ||
      watchPercent >= threshold ||
      (Boolean(data.manualComplete) && manualAllowed);

    const payload = {
      user_id: userId,
      lesson_id: data.lessonId,
      watched_seconds: watchedSeconds,
      watch_percent: watchPercent,
      last_position_seconds: Math.max(0, Math.round(data.lastPositionSeconds)),
      is_complete: isComplete,
      completed_at: isComplete ? (existing?.completed_at ?? new Date().toISOString()) : null,
      last_activity_at: new Date().toISOString(),
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("lesson_progress")
      .upsert(payload, { onConflict: "user_id, lesson_id" });
    if (error) throw new Error(error.message);

    return { watchPercent, isComplete, threshold };
  });
