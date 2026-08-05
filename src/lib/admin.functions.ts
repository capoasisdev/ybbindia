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
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
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
      isStaff: ["reviewer", "support_admin", "content_admin", "super_admin"].some((r) =>
        roles.includes(r),
      ),
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
          .select(
            "id, module_id, title, summary, video_url, duration_seconds, position, is_published",
          )
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
  .inputValidator(
    (data: {
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
    },
  )
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
  .inputValidator(
    (data: {
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
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: any = { updated_at: new Date().toISOString() };
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

export type AdminAssignment = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  isCompulsory: boolean;
  isPublished: boolean;
  position: number;
};

export type AdminQuestion = {
  id: string;
  courseId: string;
  prompt: string;
  options: string[];
  correctOption: string;
  marks: number;
  isArchived: boolean;
};

export const getAdminAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAssignment[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!course) return [];

    const { data, error } = await supabase
      .from("assignments")
      .select("id, course_id, title, instructions, is_compulsory, is_published, position")
      .eq("course_id", course.id)
      .order("position", { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      description: row.instructions || "",
      isCompulsory: row.is_compulsory,
      isPublished: row.is_published,
      position: row.position,
    }));
  });

export const createAdminAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      title: string;
      description?: string | null;
      isCompulsory?: boolean;
      isPublished?: boolean;
    }) => {
      if (!data.title?.trim()) throw new Error("Title is required");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!course) throw new Error("Course not found");

    const { data: last } = await supabase
      .from("assignments")
      .select("position")
      .eq("course_id", course.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = (last?.position ?? 0) + 1;

    const { data: row, error } = await supabase
      .from("assignments")
      .insert({
        course_id: course.id,
        title: data.title.trim(),
        instructions: data.description?.trim() || "",
        is_compulsory: data.isCompulsory ?? false,
        is_published: data.isPublished ?? false,
        position,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateAdminAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      assignmentId: string;
      title?: string;
      description?: string | null;
      isCompulsory?: boolean;
      isPublished?: boolean;
    }) => {
      if (!data.assignmentId) throw new Error("Assignment ID is required");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: any = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.description !== undefined) patch.instructions = data.description?.trim() || "";
    if (data.isCompulsory !== undefined) patch.is_compulsory = data.isCompulsory;
    if (data.isPublished !== undefined) patch.is_published = data.isPublished;

    const { error } = await supabase.from("assignments").update(patch).eq("id", data.assignmentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { assignmentId: string }) => {
    if (!data.assignmentId) throw new Error("Assignment ID is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { error } = await supabase.from("assignments").delete().eq("id", data.assignmentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminQuestion[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!course) return [];

    const { data, error } = await supabase
      .from("questions")
      .select("id, course_id, prompt, options, correct_option_ids, marks, is_archived")
      .eq("course_id", course.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => {
      const opts = Array.isArray(row.options) ? row.options : [];
      const isObjectStyle = opts.length > 0 && typeof opts[0] === 'object' && opts[0] !== null && 'text' in opts[0];
      
      const options = isObjectStyle 
        ? opts.map((o: any) => o.text || "")
        : opts.map((o: any) => String(o));
      
      const correctId = row.correct_option_ids[0] || "";
      const correctOption = isObjectStyle
        ? (opts.find((o: any) => o.id === correctId)?.text || "")
        : correctId;

      return {
        id: row.id,
        courseId: row.course_id,
        prompt: row.prompt,
        options,
        correctOption,
        marks: row.marks ?? 1,
        isArchived: row.is_archived,
      };
    });
  });

export const createAdminQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      prompt: string;
      options: string[];
      correctOption: string;
      marks?: number;
    }) => {
      if (!data.prompt?.trim()) throw new Error("Prompt is required");
      if (!Array.isArray(data.options) || data.options.length < 2) {
        throw new Error("Provide at least 2 options");
      }
      if (!data.correctOption?.trim()) throw new Error("Correct option is required");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!course) throw new Error("Course not found");

    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const formattedOptions = data.options.map((opt, idx) => ({
      id: ids[idx] || String(idx),
      text: opt.trim()
    }));
    const correctIdx = data.options.findIndex(opt => opt.trim() === data.correctOption.trim());
    const correctOptionId = correctIdx !== -1 ? (ids[correctIdx] || String(correctIdx)) : "a";

    const { data: row, error } = await supabase
      .from("questions")
      .insert({
        course_id: course.id,
        prompt: data.prompt.trim(),
        options: formattedOptions as any,
        correct_option_ids: [correctOptionId],
        marks: data.marks ?? 1,
        is_archived: false,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateAdminQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      questionId: string;
      prompt?: string;
      options?: string[];
      correctOption?: string;
      marks?: number;
    }) => {
      if (!data.questionId) throw new Error("Question ID is required");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const patch: any = { updated_at: new Date().toISOString() };
    if (data.prompt !== undefined) patch.prompt = data.prompt.trim();
    
    let resolvedOptions = data.options;
    
    if (data.options !== undefined) {
      if (!Array.isArray(data.options) || data.options.length < 2) {
        throw new Error("Provide at least 2 options");
      }
      const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const formattedOptions = data.options.map((opt, idx) => ({
        id: ids[idx] || String(idx),
        text: opt.trim()
      }));
      patch.options = formattedOptions as any;
    } else if (data.correctOption !== undefined) {
      const { data: existing } = await supabase
        .from("questions")
        .select("options")
        .eq("id", data.questionId)
        .maybeSingle();
      
      if (existing && Array.isArray(existing.options)) {
        resolvedOptions = existing.options.map((o: any) => typeof o === 'object' && o !== null ? (o.text || "") : String(o));
      }
    }

    if (data.correctOption !== undefined && resolvedOptions) {
      const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const correctIdx = resolvedOptions.findIndex(opt => opt.trim() === data.correctOption?.trim());
      const correctOptionId = correctIdx !== -1 ? (ids[correctIdx] || String(correctIdx)) : "a";
      patch.correct_option_ids = [correctOptionId];
    }

    if (data.marks !== undefined) patch.marks = data.marks;

    const { error } = await supabase.from("questions").update(patch).eq("id", data.questionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { questionId: string }) => {
    if (!data.questionId) throw new Error("Question ID is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { error } = await supabase
      .from("questions")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", data.questionId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminPricingSettings = {
  coursePricePaise: number;
  gstRatePercent: number;
  currency: string;
  accessDurationDays: number;
  paymentsTestMode: boolean;
};

export const getAdminPricingSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPricingSettings> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data, error } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "course_price_paise",
        "gst_rate_percent",
        "currency",
        "access_duration_days",
        "payments_test_mode",
      ]);

    if (error) throw new Error(error.message);

    const settings: Record<string, any> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    // Default fallbacks matching SETTING_DEFAULTS from domain/settings
    return {
      coursePricePaise: Number(settings.course_price_paise ?? 1500000),
      gstRatePercent: Number(settings.gst_rate_percent ?? 18),
      currency: String(settings.currency ?? "INR"),
      accessDurationDays: Number(settings.access_duration_days ?? 365),
      paymentsTestMode: Boolean(settings.payments_test_mode ?? true),
    };
  });

export const updateAdminPricingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: AdminPricingSettings) => {
      if (typeof data.coursePricePaise !== "number" || data.coursePricePaise < 0) {
        throw new Error("Invalid course price");
      }
      if (typeof data.gstRatePercent !== "number" || data.gstRatePercent < 0 || data.gstRatePercent > 100) {
        throw new Error("Invalid GST rate percentage");
      }
      if (!data.currency || typeof data.currency !== "string") {
        throw new Error("Invalid currency");
      }
      if (typeof data.accessDurationDays !== "number" || data.accessDurationDays <= 0) {
        throw new Error("Invalid access duration days");
      }
      if (typeof data.paymentsTestMode !== "boolean") {
        throw new Error("Invalid payments test mode");
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Upsert pricing settings
    const updates = [
      { key: "course_price_paise", value: data.coursePricePaise, label: "Course price (paise)", group_name: "commerce", is_public: true },
      { key: "gst_rate_percent", value: data.gstRatePercent, label: "GST rate (%)", group_name: "commerce", is_public: true },
      { key: "currency", value: data.currency, label: "Currency", group_name: "commerce", is_public: true },
      { key: "access_duration_days", value: data.accessDurationDays, label: "Course access duration (days)", group_name: "commerce", is_public: true },
      { key: "payments_test_mode", value: data.paymentsTestMode, label: "Test mode payments", group_name: "commerce", is_public: false },
    ];

    const { error } = await supabaseAdmin.from("settings").upsert(updates, { onConflict: "key" });
    if (error) throw new Error(error.message);

    return { ok: true };
  });

