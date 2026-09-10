import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Email link confirmation — password recovery, email change, signup confirm.
 *
 * Handles BOTH shapes Supabase can send, because which one you get depends on
 * the email template:
 *
 *   ?token_hash=...&type=recovery   -> verifyOtp. Works on ANY device, because
 *                                      nothing is stored in the requesting
 *                                      browser. This is what you want for
 *                                      password reset: people routinely open
 *                                      the email on their phone after asking
 *                                      for it on a laptop.
 *
 *   ?code=...                       -> exchangeCodeForSession (PKCE). Only
 *                                      works in the browser that made the
 *                                      request, since the code verifier lives
 *                                      in a cookie there.
 *
 * To get the cross-device version, change the Supabase email template
 * (Authentication -> Emails -> Reset Password) from {{ .ConfirmationURL }} to:
 *
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 *
 * Until you do, the code path below still works for same-device resets.
 *
 * Either way this route only establishes the session. Setting the new password
 * happens on /reset-password, which requires that session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Behind Railway's proxy `origin` is the internal host, not craftxapp.com.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (error) {
      console.error("[AuthConfirm] verifyOtp failed:", error.message);
      return NextResponse.redirect(`${base}/forgot-password?error=expired`);
    }

    return NextResponse.redirect(`${base}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AuthConfirm] Code exchange failed:", error.message);
      // Nearly always because the link was opened in a different browser than
      // the one that requested it — the PKCE verifier cookie isn't there.
      return NextResponse.redirect(`${base}/forgot-password?error=expired`);
    }

    return NextResponse.redirect(`${base}${next}`);
  }

  return NextResponse.redirect(`${base}/forgot-password?error=invalid`);
}