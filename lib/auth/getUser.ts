import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Wrapped in React's cache() so the result is shared across everything that
 * runs in a single request.
 *
 * supabase.auth.getUser() is not a database read — it's an HTTP call to the
 * Supabase Auth API to validate the JWT. WorkspaceShell calls this, and then
 * every page under it calls it again, so each navigation was paying for two
 * separate auth round trips before any real work started. cache() collapses
 * them into one.
 *
 * Scope is one request. A later request re-validates normally, so this does
 * not hold a stale session.
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user; // null if not authenticated
});