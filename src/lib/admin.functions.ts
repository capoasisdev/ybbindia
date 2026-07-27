import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminLesson = {
  id: string;
  moduleId: string;
  title: string;
  summary: string | null;
  videoUrl: string | null;
  durationSeconds: number;
  position: number;
  isPublished: boolean;
};

export type AdminModule = {
  id: string;
  title: string;
  position: number;
  lessons: AdminLesson[];
};

export type AdminOverview = {
  isAdmin: boolean;
  courseId: string | null;
  courseTitle: string | null;
  modules: AdminModule[];
};

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.includes("content_admin") || roles.includes("super_admin");
  if (!ok) throw new Error("Forbidden: content admin access required");
}

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r: { role: string }) => r.role);
    return {
      isAdmin: roles.includes("content_admin") || roles.includes("super_admin"),
    };
  });

export const getAdminCourseContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: course } = await supabase
      .from("courses")
      .select("id, title")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!course) {
      return { isAdmin: true, courseId: null, courseTitle: null, modules: [] };
    }

    const { data: modules } = await supabase
      .from("modules")
      .select("id, title, position")
      .eq("course_id", course.id)
      .order("position", { ascending: true });

    const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
    const { data: lessons } = moduleIds.length
      ? await supabase
          .from("lessons")
          .select("id, module_id, title, summary, video_url, duration_seconds, position, is_published")
          .in("module_id", moduleIds)
          .order("position", { ascending: true })
      : { data: [] as any[] };

    return {
      isAdmin: true,
      courseId: course.id,
      courseTitle: course.title,
      modules: (modules ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        position: m.position,
        lessons: (lessons ?? [])
          .filter((l: any) => l.module_id === m.id)
          .map((l: any) => ({
            id: l.id,
            moduleId: l.module_id,
            title: l.title,
            summary: l.summary,
            videoUrl: l.video_url,
            durationSeconds: l.duration_seconds ?? 0,
            position: l.position,
            isPublished: l.is_published,
          })),
      })),
    };
  });

export const createAdminLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    moduleId: string;
    title: string;
    summary?: string | null;
    videoUrl?: string | null;
    durationSeconds?: number;
    position?: number;
    isPublished?: boolean;
  }) => {
    if (!data.moduleId) throw new Error("Module is required");
    if (!data.title?.trim()) throw new Error("Title is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let position = data.position;
    if (position == null) {
      const { data: last } = await supabase
        .from("lessons")
        .select("position")
        .eq("module_id", data.moduleId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      position = (last?.position ?? 0) + 1;
    }

    const { data: row, error } = await supabase
      .from("lessons")
      .insert({
        module_id: data.moduleId,
        title: data.title.trim(),
        summary: data.summary?.trim() || null,
        video_url: data.videoUrl?.trim() || null,
        duration_seconds: data.durationSeconds ?? 0,
        position,
        is_published: data.isPublished ?? false,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateAdminLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    lessonId: string;
    title?: string;
    summary?: string | null;
    videoUrl?: string | null;
    durationSeconds?: number;
    position?: number;
    isPublished?: boolean;
  }) => {
    if (!data.lessonId) throw new Error("Lesson is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.summary !== undefined) patch.summary = data.summary?.trim() || null;
    if (data.videoUrl !== undefined) patch.video_url = data.videoUrl?.trim() || null;
    if (data.durationSeconds !== undefined) patch.duration_seconds = data.durationSeconds;
    if (data.position !== undefined) patch.position = data.position;
    if (data.isPublished !== undefined) patch.is_published = data.isPublished;

    const { error } = await supabase.from("lessons").update(patch).eq("id", data.lessonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string }) => {
    if (!data.lessonId) throw new Error("Lesson is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("lessons").delete().eq("id", data.lessonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const moveAdminLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string; direction: "up" | "down" }) => {
    if (!data.lessonId) throw new Error("Lesson is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, module_id, position")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not found");

    const { data: neighbour } = await supabase
      .from("lessons")
      .select("id, position")
      .eq("module_id", lesson.module_id)
      [data.direction === "up" ? "lt" : "gt"]("position", lesson.position)
      .order("position", { ascending: data.direction !== "up" })
      .limit(1)
      .maybeSingle();

    if (!neighbour) return { ok: true };

    await supabase.from("lessons").update({ position: -1 }).eq("id", lesson.id);
    await supabase.from("lessons").update({ position: lesson.position }).eq("id", neighbour.id);
    await supabase.from("lessons").update({ position: neighbour.position }).eq("id", lesson.id);

    return { ok: true };
  });
