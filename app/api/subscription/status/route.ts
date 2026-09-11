import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import { prisma } from "@/lib/db/prisma";

/**
 * What plan is this user actually on, right now.
 *
 * `plan` is the EFFECTIVE plan from getUserPlan() — the same function the
 * studios and WorkspaceShell use — not the raw `plan` column. Those two are
 * different things and conflating them is what made the sidebar say
 * "You're on Creator" next to a topbar reading "Free plan":
 *
 *   plan   -> what was purchased. Stays "creator" forever after a cancel.
 *   status -> whether that purchase is still valid.
 *
 * Only both together mean anything. Every consumer of this endpoint now gets
 * the same answer the entitlement system gives, so the UI can't drift from
 * what checkAccess will actually allow.
 *
 * `purchasedPlan` is exposed separately for anywhere that genuinely needs the
 * historical value (billing copy, win-back messaging). Don't use it to decide
 * what someone can do.
 */
export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subscription, plan] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
  ]);

  if (!subscription) {
    return NextResponse.json({
      plan: "free",
      purchasedPlan: "free",
      status: "active",
      renewsAt: null,
      endsAt: null,
      isCancelling: false,
    });
  }

  /**
   * Cancelled but still inside the period they paid for — they keep full
   * access until endsAt. getUserPlan treats this as still-paid, so the UI has
   * to agree. Once endsAt passes it's over, which the old check missed: it
   * called any cancelled row with an endsAt "cancelling", including ones that
   * ended months ago.
   */
  const isCancelling =
    subscription.status === "cancelled" &&
    !!subscription.endsAt &&
    subscription.endsAt.getTime() > Date.now();

  const isPaid = plan !== "free";

  return NextResponse.json({
    plan,
    purchasedPlan: subscription.plan,
    status: subscription.status,
    // A lapsed row can still carry a future renewsAt from before it ended.
    // Returning it made Settings promise a renewal to someone on Free.
    renewsAt: isPaid && !isCancelling ? subscription.renewsAt : null,
    endsAt: isCancelling ? subscription.endsAt : null,
    isCancelling,
  });
}