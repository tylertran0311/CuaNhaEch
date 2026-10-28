import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Set these in .env.local (local) and in the Vercel project's Environment Variables (deploy). The anon/publishable key
// is meant to be public: access is enforced by the row-level security rules in supabase/schema.sql.
// Accept the project URL even if it was pasted with the REST path (…supabase.co/rest/v1/)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Reuse one client across dev hot reloads so they don't pile up auth listeners on the same session
const g = globalThis as { __cneSupabase?: SupabaseClient };

/** null when the database isn't configured; the app then keeps data in this browser only */
export const supabase: SupabaseClient | null = url && key ? (g.__cneSupabase ??= createClient(url, key)) : null;
