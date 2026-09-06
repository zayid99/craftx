import { prisma } from "@/lib/db/prisma";
import { getLimit, FeatureKey, PlanId } from "./limits";

export interface AccessResult {
  allowed: boolean;
  plan: PlanId;
  reason?: string;
  currentUsage?: number;
  limit?: number | null;
  remaining?: number | null;
  /**
   * true  -> this allocation is one-time and never resets (free plan)
   * false -> this allocation resets on the 1st (paid plans)
   * Let the UI render "10 of 10 used" without a reset date rather than
   * promising a refill that will never arrive.
   */
  isLifetime?: boolean;
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return "free";

  const activeStatuses = ["active", "on_trial"];
  const isWithinCancelledGracePeriod =
    subscription.status === "cancelled" &&
    subscription.endsAt !== null &&
    subscription.endsAt.getTime() > Date.now();

  if (!activeStatuses.includes(subscription.status) && !isWithinCancelledGracePeriod) {
    return "free";
  }
  const validPlans: PlanId[] = ["free", "creator", "creator_pro"];

  if (!validPlans.includes(subscription.plan as PlanId)) {
    console.error(
      `[Entitlements] Unexpected plan value in DB: "${subscription.plan}" for userId: ${userId}. Falling back to "free".`
    );
    return "free";
  }

  return subscription.plan as PlanId;
}

/**
 * Checks whether a user is allowed to consume `requestedQuantity` units of a
 * feature, based on their plan's limit and their summed quantity usage in
 * UsageEvent.
 *
 * THE WINDOW DEPENDS ON THE PLAN:
 *
 *   free  -> ALL TIME. The free allocation is a one-time trial, not a monthly
 *            stipend. A monthly-resetting free tier is a permanent free product
 *            with an upgrade button attached: a creator publishing twice a week
 *            fits inside 5 scripts and 15 SEO sets forever and never has a
 *            reason to pay. Counting all time means the free experience is
 *            still generous, but the wall is permanent.
 *
 *   paid  -> CALENDAR MONTH, resetting on the 1st, as advertised on the
 *            pricing page.
 *
 * Consequence worth knowing: a subscriber who cancels drops to the free plan
 * with their lifetime usage already spent, so they get no fresh allocation.
 * That is intended — they've already had the trial — but it means "cancel and
 * come back later on free" is not a path. If you'd rather it were, give
 * lapsed users a grace allocation here rather than reverting to monthly.
 *
 * requestedQuantity defaults to 1 for features with no batch concept
 * (scripts, seo, analyzer, planner). Idea Studio passes the actual requested
 * idea count so the limit reflects real consumption, not call count.
 */
export async function checkAccess(
  userId: string,
  feature: FeatureKey,
  requestedQuantity: number = 1
): Promise<AccessResult> {
  const plan = await getUserPlan(userId);
  const limit = getLimit(plan, feature);

  const isLifetime = plan === "free";

  // Unlimited — always allowed, no need to count usage
  if (limit === null) {
    return { allowed: true, plan, limit: null, isLifetime };
  }

  // Paid plans count from the 1st. Free counts from the beginning of time.
  //
  // Note: this boundary uses the server's local timezone, while
  // lib/usage/spendCap.ts uses UTC. On a UTC server (Hostinger's default)
  // they agree. If you ever run the app in a non-UTC timezone, make these
  // two match or the reset dates shown to users will drift apart.
  let createdAtFilter: { gte: Date } | undefined;

  if (!isLifetime) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    createdAtFilter = { gte: startOfMonth };
  }

  const usageAggregate = await prisma.usageEvent.aggregate({
    where: {
      userId,
      feature,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    _sum: { quantity: true },
  });

  const currentUsage = usageAggregate._sum.quantity ?? 0;
  const remaining = Math.max(limit - currentUsage, 0);

  if (currentUsage + requestedQuantity > limit) {
    let reason: string;

    if (isLifetime) {
      reason =
        remaining > 0
          ? `You've used ${currentUsage} of your ${limit} free generations for this tool, and this request needs ${requestedQuantity}. Upgrade for a monthly allowance, or request ${remaining} or fewer.`
          : `You've used all ${limit} of your free generations for this tool. Upgrade to Creator for a monthly allowance that refreshes on the 1st.`;
    } else {
      reason =
        remaining > 0
          ? `You've used ${currentUsage}/${limit} for this feature on your ${plan} plan this month. This request would exceed your remaining ${remaining}. Upgrade or reduce the amount requested.`
          : `You've reached your ${plan} plan's monthly limit of ${limit} for this feature. Upgrade to continue.`;
    }

    return {
      allowed: false,
      plan,
      reason,
      currentUsage,
      limit,
      remaining,
      isLifetime,
    };
  }

  return { allowed: true, plan, currentUsage, limit, remaining, isLifetime };
}