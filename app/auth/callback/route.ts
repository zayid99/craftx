import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback.
 *
 * Flow: user clicks "Continue with Google" -> Google -> Supabase
 * (https://<project>.supabase.co/auth/v1/callback) -> here, with a one-time
 * code in the query string. We trade that code for a session cookie and send
 * the user on to the dashboard.
 *
 * This route is the ONLY place the code is exchanged. Don't duplicate it in a
 * client component: the session must be written as an httpOnly cookie from the
 * server or the middleware won't see it and every protected page will bounce
 * the user back to /login.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Google sends the user back here with ?error=access_denied if they hit
  // Cancel on the consent screen. That isn't a failure worth alarming them
  // about — just return them to login quietly.
  const oauthError = searchParams.get("error");
  if (oauthError) {
    if (oauthError === "access_denied") {
      return NextResponse.redirect(`${origin}/login`);
    }
    console.error(`[AuthCallback] Provider returned error: ${oauthError}`);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[AuthCallback] Code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // Behind Railway's proxy, `origin` is the internal host, not craftxapp.com.
  // x-forwarded-host carries the real one, so prefer it in production or the
  // user lands on an internal URL that doesn't resolve.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}