import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getR2Config,
  listR2FolderContents,
  createFolderInR2,
  generateUploadPresignedUrl,
  deleteFileFromR2,
  deleteFolderFromR2,
  configureR2Cors,
  checkR2Cors,
  type R2FolderListing,
} from "./r2.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.includes("content_admin") || roles.includes("super_admin");
  if (!ok) throw new Error("Forbidden: admin access required");
}

export const getR2Status = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const config = getR2Config();
    let isCorsConfigured = false;
    if (config) {
      const cors = await checkR2Cors();
      isCorsConfigured = cors.isCorsConfigured;
    }

    return {
      isConfigured: Boolean(config),
      bucketName: config?.bucketName ?? null,
      publicDomain: config?.publicDomain ?? null,
      accountIdMasked: config?.accountId ? `${config.accountId.slice(0, 6)}...` : null,
      isCorsConfigured,
    };
  });

export const configureR2CorsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { allowedOrigins?: string[] } | undefined) => {
    return { allowedOrigins: input?.allowedOrigins ?? ["*"] };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    return await configureR2Cors(data.allowedOrigins);
  });

export const listR2Items = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prefix?: string } | undefined) => {
    return { prefix: input?.prefix ?? "" };
  })
  .handler(async ({ data, context }): Promise<R2FolderListing> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    return await listR2FolderContents(data.prefix);
  });

export const createR2FolderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { parentPrefix?: string; folderName: string }) => {
    if (!input.folderName?.trim()) {
      throw new Error("Folder name is required");
    }
    return {
      parentPrefix: input.parentPrefix ?? "",
      folderName: input.folderName.trim(),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    return await createFolderInR2(data.parentPrefix, data.folderName);
  });

export const getUploadPresignedUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { folderPrefix?: string; fileName: string; contentType?: string }) => {
    if (!input.fileName?.trim()) {
      throw new Error("File name is required");
    }
    return {
      folderPrefix: input.folderPrefix ?? "",
      fileName: input.fileName.trim(),
      contentType: input.contentType || "video/mp4",
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    return await generateUploadPresignedUrl(data.folderPrefix, data.fileName, data.contentType);
  });

export const deleteR2FileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => {
    if (!input.key?.trim()) {
      throw new Error("File key is required");
    }
    return { key: input.key.trim() };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    return await deleteFileFromR2(data.key);
  });

export const deleteR2FolderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { folderPrefix: string }) => {
    if (!input.folderPrefix?.trim()) {
      throw new Error("Folder prefix is required");
    }
    return { folderPrefix: input.folderPrefix.trim() };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    return await deleteFolderFromR2(data.folderPrefix);
  });

export type LessonOption = {
  lessonId: string;
  lessonTitle: string;
  lessonPosition: number;
  moduleTitle: string;
  currentVideoUrl: string | null;
};

export const getCourseLessonsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LessonOption[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .order("created_at", { ascending: true })
      .limit(1);

    const courseId = courses?.[0]?.id;
    if (!courseId) return [];

    const { data: modules } = await supabase
      .from("modules")
      .select("id, title, position")
      .eq("course_id", courseId)
      .order("position", { ascending: true });

    if (!modules || modules.length === 0) return [];

    const moduleMap = new Map(modules.map((m: any) => [m.id, m.title]));
    const moduleIds = modules.map((m: any) => m.id);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, module_id, title, position, video_url")
      .in("module_id", moduleIds)
      .order("position", { ascending: true });

    return (lessons ?? []).map((l: any) => ({
      lessonId: l.id,
      lessonTitle: l.title,
      lessonPosition: l.position,
      moduleTitle: moduleMap.get(l.module_id) || "Module",
      currentVideoUrl: l.video_url,
    }));
  });

export const attachVideoToLessonFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { lessonId: string; videoUrl: string }) => {
    if (!input.lessonId) throw new Error("Lesson ID is required");
    if (!input.videoUrl) throw new Error("Video URL is required");
    return {
      lessonId: input.lessonId,
      videoUrl: input.videoUrl.trim(),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { error } = await supabase
      .from("lessons")
      .update({
        video_url: data.videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.lessonId);

    if (error) {
      throw new Error(`Failed to update lesson: ${error.message}`);
    }

    return { ok: true };
  });
