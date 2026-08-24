import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyProfile = {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  city: string | null;
  state: string | null;
  organisation: string | null;
  profession: string | null;
  education: string | null;
  certificate_name: string | null;
  certificate_name_locked: boolean;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_pincode: string | null;
  gst_number: string | null;
  photograph_path: string | null;
  is_active: boolean;
  created_at: string;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyProfile | null> => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("learner_profiles")
      .select(
        "id, full_name, email, mobile, city, state, organisation, profession, education, certificate_name, certificate_name_locked, billing_address, billing_city, billing_state, billing_pincode, gst_number, photograph_path, is_active, created_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  });

export type UpdateProfileInput = {
  full_name: string;
  mobile?: string | null;
  city?: string | null;
  state?: string | null;
  organisation?: string | null;
  profession?: string | null;
  education?: string | null;
  certificate_name?: string | null;
  billing_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_pincode?: string | null;
  gst_number?: string | null;
  photograph_path?: string | null;
};

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpdateProfileInput) => input)
  .handler(async ({ context, data }): Promise<{ success: boolean }> => {
    const { supabase, userId } = context;

    // Cannot change certificate_name if it's locked
    const { data: existing } = await supabase
      .from("learner_profiles")
      .select("certificate_name_locked, certificate_name")
      .eq("id", userId)
      .maybeSingle();

    const { error } = await supabase
      .from("learner_profiles")
      .update({
        full_name: data.full_name,
        mobile: data.mobile ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        organisation: data.organisation ?? null,
        profession: data.profession ?? null,
        education: data.education ?? null,
        billing_address: data.billing_address ?? null,
        billing_city: data.billing_city ?? null,
        billing_state: data.billing_state ?? null,
        billing_pincode: data.billing_pincode ?? null,
        gst_number: data.gst_number ?? null,
        photograph_path: data.photograph_path ?? null,
        updated_at: new Date().toISOString(),
        ...(existing?.certificate_name_locked ? {} : { certificate_name: data.certificate_name ?? null }),
      })
      .eq("id", userId);

    if (error) throw error;

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          name: data.full_name,
          avatar_url: data.photograph_path ?? null,
          picture: data.photograph_path ?? null,
        },
      });
    } catch (authErr) {
      console.warn("auth.updateUser note:", authErr);
    }

    return { success: true };
  });
