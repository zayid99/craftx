import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client.
 *
 * This key bypasses Row Level Security and can do anything to any account, so
 * it must only ever be imported from server-side code. It is deliberately not
 * prefixed with NEXT_PUBLIC_ — if it were, Next would ship it to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
