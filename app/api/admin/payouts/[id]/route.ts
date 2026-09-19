import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { markPayoutPaid, rejectPayout } from "@/lib/referrals/payouts";

/** Admin only: mark a payout as paid, or reject it. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same response for "not signed in" and "not an admin", so this route
  // doesn't confirm to anyone that it exists.
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;

  let body: { action?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note : "";

  try {
    const result =
      body.action === "paid"
        ? await markPayoutPaid(id, note)
        : body.action === "reject"
          ? await rejectPayout(id, note)
          : ({ ok: false, error: "Unknown action." } as const);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log(`[Payout] Admin ${user.email} set payout ${id} to ${body.action}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Payout] Admin action failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}