import { createClient } from "@supabase/supabase-js";

// Supabase configuration from environment or fallback to project default
const SUPABASE_URL = "https://tusbimtbolvnzlwsjcju.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_v-vCm9OEYpNv4zlCjlJqkA_7qg3Z236";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2JpbXRib2x2bnpsd3NqY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4ODc0MiwiZXhwIjoyMTAwOTY0NzQyfQ.c2sCOqYSY5Dl_LtUd2FHNiTX25_YnD_YkmZNIUuXwDM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Admin client with elevated permissions for reliable two-way live data sync */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

