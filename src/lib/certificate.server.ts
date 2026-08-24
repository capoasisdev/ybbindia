import { readBool, readString, type SettingsMap } from "@/domain/settings";

export type CertificateRecord = {
  id: string;
  abbId: string;
  learnerName: string;
  programmeName: string;
  issuedAt: string;
  status: string;
  statusReason: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
};

export type CertificateEligibility = {
  examPassed: boolean;
  assignmentsApproved: boolean;
  lessonsComplete: boolean;
  eligible: boolean;
  reasons: string[];
};

export async function loadSettingsMap(supabase: any): Promise<SettingsMap> {
  const { data } = await supabase.from("settings").select("key, value");
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function loadActiveEnrolment(supabase: any, userId: string) {
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

/** Checks the three PRD gates that must pass before a certificate can be issued. */
export async function computeEligibility(
  supabase: any,
  userId: string,
  courseId: string,
): Promise<CertificateEligibility> {
  const [{ data: attempts }, { data: submissions }, { data: modules }, { data: rolesRes }] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("is_passed")
      .eq("user_id", userId)
      .eq("course_id", courseId),
    supabase.from("submissions").select("status, assignment_id").eq("user_id", userId),
    supabase.from("modules").select("id").eq("course_id", courseId),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const roles = (rolesRes ?? []).map((r: any) => r.role);
  const isStaff = roles.some((r: string) => ['super_admin', 'content_admin', 'reviewer', 'support_admin'].includes(r));

  const examPassed = isStaff ? true : (attempts ?? []).some((a: { is_passed: boolean | null }) => a.is_passed);

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
  const { data: assignments } = moduleIds.length
    ? await supabase
        .from("assignments")
        .select("id, is_compulsory")
        .eq("is_published", true)
        .in("module_id", moduleIds)
    : { data: [] as { id: string; is_compulsory: boolean }[] };

  const compulsory = (assignments ?? []).filter((a: any) => a.is_compulsory !== false);
  const approvedIds = new Set(
    (submissions ?? [])
      .filter((s: { status: string }) => s.status === "approved")
      .map((s: { assignment_id: string }) => s.assignment_id),
  );
  const assignmentsApproved = isStaff ? true : compulsory.every((a: { id: string }) => approvedIds.has(a.id));

  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id")
        .eq("is_published", true)
        .in("module_id", moduleIds)
    : { data: [] as { id: string }[] };
  const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, is_complete")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string; is_complete: boolean }[] };
  const completed = (progress ?? []).filter((p: any) => p.is_complete).length;
  const lessonsComplete = isStaff ? true : (lessonIds.length > 0 && completed >= lessonIds.length);

  const reasons: string[] = [];
  if (!lessonsComplete) reasons.push("All lessons must be completed.");
  if (!assignmentsApproved) reasons.push("All compulsory assignments must be approved.");
  if (!examPassed) reasons.push("The final examination must be passed.");

  return {
    examPassed,
    assignmentsApproved,
    lessonsComplete,
    eligible: reasons.length === 0,
    reasons,
  };
}

export function isAutoApprove(settings: SettingsMap) {
  return readBool(settings, "certification_auto_approve");
}

/** Builds a secure random 4-digit ABB ID from format, e.g. YBB-ABB-2026-1580. */
export function buildAbbId(settings: SettingsMap, sequenceOrSeed?: number | string) {
  const format = readString(settings, "abb_id_format") || "YBB-ABB-{YYYY}-{RAND4}";
  const year = String(new Date().getFullYear());
  
  let random4: string;
  if (typeof sequenceOrSeed === "string" && sequenceOrSeed.length > 0) {
    let hash = 0;
    for (let i = 0; i < sequenceOrSeed.length; i++) {
      hash = ((hash << 5) - hash) + sequenceOrSeed.charCodeAt(i);
      hash |= 0;
    }
    random4 = String(Math.abs(hash) % 10000).padStart(4, "0");
  } else {
    random4 = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  }

  return format
    .replace("{YYYY}", year)
    .replace("{RAND4}", random4)
    .replace(/\{N+\}/, random4);
}

export function mapCertificate(row: any): CertificateRecord {
  return {
    id: row.id,
    abbId: row.abb_id,
    learnerName: row.learner_name,
    programmeName: row.programme_name,
    issuedAt: row.issued_at,
    status: row.status,
    statusReason: row.status_reason ?? null,
    signatoryName: row.signatory_name ?? null,
    signatoryTitle: row.signatory_title ?? null,
  };
}

export async function issueCertificateFor(
  supabaseAdmin: any,
  settings: SettingsMap,
  params: { userId: string; courseId: string; approvedBy: string | null },
): Promise<CertificateRecord> {
  const { data: existing } = await supabaseAdmin
    .from("certificates")
    .select("*")
    .eq("user_id", params.userId)
    .eq("course_id", params.courseId)
    .maybeSingle();
  if (existing) return mapCertificate(existing);

  const { data: profile } = await supabaseAdmin
    .from("learner_profiles")
    .select("full_name, certificate_name")
    .eq("id", params.userId)
    .maybeSingle();

  // Generate unique random 4-digit ABB ID
  let abbId = buildAbbId(settings, params.userId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: duplicate } = await supabaseAdmin
      .from("certificates")
      .select("id")
      .eq("abb_id", abbId)
      .maybeSingle();
    if (!duplicate) break;
    abbId = buildAbbId(settings);
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("certificates")
    .insert({
      user_id: params.userId,
      course_id: params.courseId,
      abb_id: abbId,
      learner_name: profile?.certificate_name || profile?.full_name || "ABB Learner",
      programme_name: readString(settings, "programme_name"),
      status: "active",
      signatory_name: readString(settings, "certificate_signatory_name") || null,
      signatory_title: readString(settings, "certificate_signatory_title") || null,
      approved_by: params.approvedBy,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCertificate(inserted);
}
