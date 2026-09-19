import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimReferral } from "@/lib/referrals/claim";

/**
 * Called by the email signup form right after an account is created with an
 * immediate session. Needs to be a server route: the referral cookie is
 * httpOnly, so the browser can't read it — only the server can.
 *
 * Safe to call more than once: claimReferral ignores accounts older than 24h,
 * users who were already referred, and missing/unknown codes.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await claimReferral(user);
  return NextResponse.json({ ok: true });
}