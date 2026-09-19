import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestPayout } from "@/lib/referrals/payouts";

/** Affiliate requests a payout of their full available balance. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { method?: unknown; details?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const method = typeof body.method === "string" ? body.method : "";
  const details = typeof body.details === "string" ? body.details : "";

  try {
    const result = await requestPayout(user.id, method, details);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log(`[Payout] ${user.id} requested ${result.amountCents}c (payout ${result.payoutId})`);
    return NextResponse.json({ ok: true, amountCents: result.amountCents });
  } catch (error) {
    console.error("[Payout] Request failed:", error);
    return NextResponse.json(
      { error: "Could not submit your payout request. Please try again." },
      { status: 500 }
    );
  }
}