import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in server-side contexts (Server Components, Route Handlers, OG image routes).
 * Never import this in Client Components or expose to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
