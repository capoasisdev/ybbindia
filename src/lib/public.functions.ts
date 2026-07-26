import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SettingsMap } from "@/domain/settings";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Public, non-sensitive settings used by the marketing site and checkout page. */
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .eq("is_public", true);

  if (error) {
    console.error("[settings] public read failed", error.message);
    return {} as SettingsMap;
  }

  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
});

/** Public verification of an ABB certificate. Returns limited information only. */
export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((data: { abbId: string }) => ({ abbId: String(data.abbId ?? "").trim() }))
  .handler(async ({ data }) => {
    if (!data.abbId) return { found: false as const };
    const supabase = serverPublicClient();
    const { data: rows, error } = await supabase.rpc("verify_certificate", {
      _abb_id: data.abbId,
    });
    if (error) {
      console.error("[verify] failed", error.message);
      return { found: false as const };
    }
    const record = rows?.[0];
    if (!record) return { found: false as const };
    return {
      found: true as const,
      abbId: record.abb_id,
      learnerName: record.learner_name,
      programmeName: record.programme_name,
      issuedAt: record.issued_at,
      status: record.status,
    };
  });

/** Published legal document by slug, latest effective version. */
export const getLegalDocument = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const { data: rows, error } = await supabase
      .from("legal_documents")
      .select("slug, title, version, body, effective_date")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .order("effective_date", { ascending: false })
      .limit(1);
    if (error) {
      console.error("[legal] read failed", error.message);
      return null;
    }
    return rows?.[0] ?? null;
  });

/** Published legal documents list for the public legal index. */
export const listLegalDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("legal_documents")
    .select("slug, title, version, effective_date")
    .eq("is_published", true)
    .order("title", { ascending: true });
  if (error) {
    console.error("[legal] list failed", error.message);
    return [];
  }
  const seen = new Set<string>();
  return (data ?? []).filter((row) => {
    if (seen.has(row.slug)) return false;
    seen.add(row.slug);
    return true;
  });
});

/** Published course outline for the public programme page. */
export const getPublicCourseOutline = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, slug, subtitle, description")
    .eq("is_published", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error || !courses?.length) return null;
  const course = courses[0];

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, position")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("position", { ascending: true });

  return { course, modules: modules ?? [] };
});
