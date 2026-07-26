import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

async function loadOutline(
  supabase: any,
  userId: string,
): Promise<CourseOutline> {
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id, course_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrolment) {
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
    supabase.from("courses").select("id, title").eq("id", enrolment.course_id).maybeSingle(),
    supabase
      .from("modules")
      .select("id, title, description, position")
      .eq("course_id", enrolment.course_id)
      .eq("is_published", true)
      .order("position"),
    supabase.from("settings").select("key, value").in("key", ["sequential_lessons"]),
  ]);

  const sequentialRaw = (settingRes.data ?? []).find((r: any) => r.key === "sequential_lessons")?.value;
  const sequential = sequentialRaw === undefined || sequentialRaw === null ? true : Boolean(sequentialRaw);

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
        const isComplete = Boolean(p?.is_complete);
        const isLocked = sequential ? !previousComplete : false;
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
          watchPercent: p?.watch_percent ?? 0,
          isComplete,
          lastPositionSeconds: p?.last_position_seconds ?? 0,
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
    enrolled: true,
    courseTitle: courseRes.data?.title ?? null,
    sequential,
    modules: outlineModules,
    lessonsTotal,
    lessonsCompleted,
    nextLessonId,
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
  lesson:
    | {
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
      }
    | null;
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
      const { data: row } = await supabase
        .from("lessons")
        .select("description, video_url, video_storage_path")
        .eq("id", item.id)
        .maybeSingle();
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
      .select("id, watch_percent, watched_seconds, is_complete")
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
      completed_at: isComplete ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from("lesson_progress").update(payload).eq("id", existing.id)
      : await supabase.from("lesson_progress").insert(payload);
    if (error) throw new Error(error.message);

    return { watchPercent, isComplete, threshold };
  });
