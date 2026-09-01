import { prisma } from "@/lib/db/prisma";
import { getLimit, FeatureKey, PlanId } from "./limits";

export interface AccessResult {
  allowed: boolean;
  plan: PlanId;
  reason?: string;
  currentUsage?: number;
  limit?: number | null;
  remaining?: number | null;
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
 * feature this billing period (calendar month), based on their plan's limit
 * and their summed quantity usage in UsageEvent.
 *
 * requestedQuantity defaults to 1 for features with no batch concept
 * (scripts, seo, analyzer, planner, coach). Idea Studio passes the actual
 * requested idea count so the limit reflects real consumption, not call count.
 */
export async function checkAccess(
  userId: string,
  feature: FeatureKey,
  requestedQuantity: number = 1
): Promise<AccessResult> {
  const plan = await getUserPlan(userId);
  const limit = getLimit(plan, feature);

  // Unlimited — always allowed, no need to count usage
  if (limit === null) {
    return { allowed: true, plan, limit: null };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageAggregate = await prisma.usageEvent.aggregate({
    where: {
      userId,
      feature,
      createdAt: { gte: startOfMonth },
    },
    _sum: { quantity: true },
  });

  const currentUsage = usageAggregate._sum.quantity ?? 0;
  const remaining = Math.max(limit - currentUsage, 0);

  if (currentUsage + requestedQuantity > limit) {
    return {
      allowed: false,
      plan,
      reason:
        remaining > 0
          ? `You've used ${currentUsage}/${limit} for this feature on your ${plan} plan this month. This request would exceed your remaining ${remaining}. Upgrade or reduce the amount requested.`
          : `You've reached your ${plan} plan's monthly limit of ${limit} for this feature. Upgrade to continue.`,
      currentUsage,
      limit,
      remaining,
    };
  }

  return { allowed: true, plan, currentUsage, limit, remaining };
}