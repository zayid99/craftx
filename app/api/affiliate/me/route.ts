import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAffiliateSummary } from "@/lib/referrals/affiliate";

export const dynamic = "force-dynamic";

/**
 * The signed-in user's affiliate data: referral link, stats, earnings, terms.
 * Creates their referral code the first time it's called.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const summary = await getAffiliateSummary(user.id);
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://craftxapp.com").replace(/\/$/, "");

    return NextResponse.json({
      ...summary,
      link: `${baseUrl}/?ref=${summary.code}`,
    });
  } catch (error) {
    console.error("[Affiliate] Failed to load summary:", error);
    return NextResponse.json(
      { error: "Could not load your affiliate data. Please try again." },
      { status: 500 }
    );
  }
}