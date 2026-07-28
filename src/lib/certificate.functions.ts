import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readString } from "@/domain/settings";
import {
  computeEligibility,
  isAutoApprove,
  issueCertificateFor,
  loadActiveEnrolment,
  loadSettingsMap,
  mapCertificate,
  type CertificateEligibility,
  type CertificateRecord,
} from "./certificate.server";

export type { CertificateEligibility, CertificateRecord } from "./certificate.server";

export type CertificateOverview = {
  enrolled: boolean;
  certificate: CertificateRecord | null;
  eligibility: CertificateEligibility | null;
  awaitingApproval: boolean;
  validityNote: string;
  programmeName: string;
};

/** The signed-in learner's certificate, or why it has not been issued yet. */
export const getCertificateOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CertificateOverview> => {
    const { supabase, userId } = context;
    const settings = await loadSettingsMap(supabase);
    const validityNote = readString(settings, "certificate_validity_note");
    const programmeName = readString(settings, "programme_name");

    const enrolment = await loadActiveEnrolment(supabase, userId);
    if (!enrolment) {
      return {
        enrolled: false,
        certificate: null,
        eligibility: null,
        awaitingApproval: false,
        validityNote,
        programmeName,
      };
    }

    const { data: existing } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", enrolment.course_id)
      .maybeSingle();

    const eligibility = await computeEligibility(supabase, userId, enrolment.course_id);

    if (!existing && eligibility.eligible && isAutoApprove(settings)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const issued = await issueCertificateFor(supabaseAdmin, settings, {
        userId,
        courseId: enrolment.course_id,
        approvedBy: null,
      });
      return {
        enrolled: true,
        certificate: issued,
        eligibility,
        awaitingApproval: false,
        validityNote,
        programmeName,
      };
    }

    return {
      enrolled: true,
      certificate: existing ? mapCertificate(existing) : null,
      eligibility,
      awaitingApproval: !existing && eligibility.eligible,
      validityNote,
      programmeName,
    };
  });

export type CertificateCandidate = {
  userId: string;
  courseId: string;
  name: string;
  email: string | null;
  eligible: boolean;
  reasons: string[];
  certificate: CertificateRecord | null;
};

async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  const ok = roles.some((r: string) =>
    ["super_admin", "content_admin", "reviewer", "support"].includes(r),
  );
  if (!ok) throw new Error("Forbidden: staff access required");
  return roles;
}

/** Staff view: every active enrolment with its certification status. */
export const listCertificateCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CertificateCandidate[]> => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const { data: enrolments } = await supabase
      .from("enrolments")
      .select("user_id, course_id")
      .eq("is_active", true);

    const rows = enrolments ?? [];
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((r: any) => r.user_id))];
    const [{ data: profiles }, { data: certs }] = await Promise.all([
      supabase.from("learner_profiles").select("id, full_name, certificate_name, email").in("id", userIds),
      supabase.from("certificates").select("*").in("user_id", userIds),
    ]);

    const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const certByUser = new Map((certs ?? []).map((c: any) => [`${c.user_id}:${c.course_id}`, c]));

    const out: CertificateCandidate[] = [];
    for (const row of rows) {
      const eligibility = await computeEligibility(supabase, row.user_id, row.course_id);
      const profile: any = profileById.get(row.user_id);
      const cert = certByUser.get(`${row.user_id}:${row.course_id}`);
      out.push({
        userId: row.user_id,
        courseId: row.course_id,
        name: profile?.certificate_name || profile?.full_name || "Unnamed learner",
        email: profile?.email ?? null,
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
        certificate: cert ? mapCertificate(cert) : null,
      });
    }
    return out;
  });

/** Staff action: approve and issue a certificate for an eligible learner. */
export const approveCertificate = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; courseId: string }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<CertificateRecord> => {
    const { supabase, userId } = context;
    const roles = await assertStaff(supabase, userId);
    if (!roles.some((r: string) => ["super_admin", "content_admin"].includes(r))) {
      throw new Error("Forbidden: admin access required to issue certificates");
    }

    const eligibility = await computeEligibility(supabase, data.userId, data.courseId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reasons[0] ?? "Learner is not eligible yet");
    }

    const settings = await loadSettingsMap(supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return await issueCertificateFor(supabaseAdmin, settings, {
      userId: data.userId,
      courseId: data.courseId,
      approvedBy: userId,
    });
  });

/** Staff action: suspend, revoke or reinstate an issued certificate. */
export const setCertificateStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { certificateId: string; status: "active" | "suspended" | "revoked"; reason?: string }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await assertStaff(supabase, userId);
    if (!roles.some((r: string) => ["super_admin", "content_admin"].includes(r))) {
      throw new Error("Forbidden: admin access required");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("certificates")
      .update({ status: data.status, status_reason: data.reason ?? null })
      .eq("id", data.certificateId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
