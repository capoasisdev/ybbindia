import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LearnerOverview = {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    mobile: string | null;
    certificate_name: string | null;
    certificate_name_locked: boolean;
    is_active: boolean;
  } | null;
  roles: string[];
  enrolment: {
    id: string;
    course_id: string;
    enrolled_at: string;
    valid_until: string | null;
    is_active: boolean;
  } | null;
  course: { id: string; title: string; slug: string } | null;
  lessonsTotal: number;
  lessonsCompleted: number;
};

/** Everything the learner dashboard needs, scoped to the signed-in user by RLS. */
export const getLearnerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LearnerOverview> => {
    const { supabase, userId } = context;

    const [profileRes, rolesRes, enrolmentRes] = await Promise.all([
      supabase
        .from("learner_profiles")
        .select(
          "id, full_name, email, mobile, certificate_name, certificate_name_locked, is_active",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("enrolments")
        .select("id, course_id, enrolled_at, valid_until, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("enrolled_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const enrolment = enrolmentRes.data ?? null;
    let course: LearnerOverview["course"] = null;
    let lessonsTotal = 0;
    let lessonsCompleted = 0;

    if (enrolment) {
      const { data: courseRow } = await supabase
        .from("courses")
        .select("id, title, slug")
        .eq("id", enrolment.course_id)
        .maybeSingle();
      course = courseRow ?? null;

      const { data: moduleRows } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", enrolment.course_id)
        .eq("is_published", true);
      const moduleIds = (moduleRows ?? []).map((row) => row.id);

      if (moduleIds.length > 0) {
        const { count } = await supabase
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .in("module_id", moduleIds)
          .eq("is_published", true);
        lessonsTotal = count ?? 0;
      }

      const { count: completedCount } = await supabase
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_complete", true);
      lessonsCompleted = completedCount ?? 0;
    }

    return {
      profile: profileRes.data ?? null,
      roles: (rolesRes.data ?? []).map((row) => row.role as string),
      enrolment,
      course,
      lessonsTotal,
      lessonsCompleted,
    };
  });
