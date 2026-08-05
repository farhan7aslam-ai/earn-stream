import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rayhnuzdewzhtrwahzas.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_PgCe5mWQE2srbUnv-UcDpw_gHOcULV3";

/**
 * Server-side Supabase client (used in API routes).
 * Uses the anon key — the SQL migration disables RLS / adds permissive
 * policies so the anon key can read/write the 8 app tables. Authorization
 * is enforced in the API layer via custom session checks.
 */
export function createServerClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
