import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LearnerResource = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  scope: string;
  moduleTitle: string | null;
  version: string | null;
  fileType: string | null;
  fileSizeBytes: number | null;
  isWorkbook: boolean;
  isDownloadable: boolean;
  externalUrl: string | null;
  hasFile: boolean;
};

export type ResourcesOverview = {
  enrolled: boolean;
  workbook: LearnerResource | null;
  resources: LearnerResource[];
};

/** Published resources for the learner's course, workbook first. */
export const getLearnerResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResourcesOverview> => {
    const { supabase, userId } = context;

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
        .eq("user_id", userId),
    ]);

    const enrolment = enrolmentRes.data ?? null;
    const roles = (rolesRes.data ?? []).map((r: any) => r.role);
    const isStaff = roles.some((r: string) => ['super_admin', 'content_admin', 'reviewer', 'support_admin'].includes(r));

    let courseId = enrolment?.course_id ?? null;

    if (!enrolment && isStaff) {
      const { data: firstCourse } = await supabase
        .from("courses")
        .select("id")
        .eq("is_published", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      courseId = firstCourse?.id ?? null;
    }

    if (!courseId) return { enrolled: false, workbook: null, resources: [] };

    const [resourcesRes, modulesRes] = await Promise.all([
      supabase
        .from("resources")
        .select(
          "id, title, description, kind, scope, module_id, version, file_type, file_size_bytes, is_workbook, is_downloadable, external_url, storage_path, position",
        )
        .eq("is_archived", false)
        .or(`course_id.eq.${courseId},course_id.is.null`)
        .order("position"),
      supabase.from("modules").select("id, title").eq("course_id", courseId),
    ]);

    const moduleTitles = new Map(
      (modulesRes.data ?? []).map((m: any) => [m.id, m.title as string]),
    );

    const mapped: LearnerResource[] = (resourcesRes.data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      kind: r.kind,
      scope: r.scope,
      moduleTitle: r.module_id ? (moduleTitles.get(r.module_id) ?? null) : null,
      version: r.version,
      fileType: r.file_type,
      fileSizeBytes: r.file_size_bytes,
      isWorkbook: Boolean(r.is_workbook),
      isDownloadable: r.is_downloadable !== false,
      externalUrl: r.external_url,
      hasFile: Boolean(r.storage_path),
    }));

    return {
      enrolled: true,
      workbook: mapped.find((r) => r.isWorkbook) ?? null,
      resources: mapped.filter((r) => !r.isWorkbook),
    };
  });

/** Short-lived signed download link for a resource file. */
export const getResourceUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { resourceId: string }) => input)
  .handler(async ({ data, context }): Promise<{ url: string | null }> => {
    const { supabase, userId } = context;

    const [enrolmentRes, rolesRes] = await Promise.all([
      supabase
        .from("enrolments")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),
    ]);

    const enrolment = enrolmentRes.data ?? null;
    const roles = (rolesRes.data ?? []).map((r: any) => r.role);
    const isStaff = roles.some((r: string) => ['super_admin', 'content_admin', 'reviewer', 'support_admin'].includes(r));

    if (!enrolment && !isStaff) return { url: null };

    const { data: resource } = await supabase
      .from("resources")
      .select("storage_path, external_url, is_downloadable, is_archived, download_count")
      .eq("id", data.resourceId)
      .maybeSingle();
    if (!resource || resource.is_archived || resource.is_downloadable === false) {
      return { url: null };
    }
    if (resource.external_url) return { url: resource.external_url };
    if (!resource.storage_path) return { url: null };

    const { data: signed } = await supabase.storage
      .from("course-resources")
      .createSignedUrl(resource.storage_path, 60 * 10);

    return { url: signed?.signedUrl ?? null };
  });
