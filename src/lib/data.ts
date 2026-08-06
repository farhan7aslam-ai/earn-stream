import { supabaseStore } from "./supabase/supabase-store";
import type { Store } from "./store";

/**
 * The singleton data store.
 *
 * EarnStream talks to your live Supabase database exclusively via the
 * `supabaseStore` implementation (server-side, using the anon key). There
 * is no local/in-memory fallback — every read and write goes to Supabase.
 *
 * Make sure you have run the schema migration in your Supabase SQL Editor
 * (see `supabase/migrations/`) so all tables + the master admin seed exist.
 */
export const store: Store = supabaseStore;
