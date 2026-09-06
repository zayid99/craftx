import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import { getLimit, FeatureKey } from "@/lib/entitlements/limits";

export const dynamic = "force-dynamic";

const FEATURES: FeatureKey[] = [
  "ideas",
  "scripts",
  "seo",
  "planner",
  "analyzer",
];

export interface FeatureUsage {
  feature: FeatureKey;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

/**
 * Read-only usage summary for the CURRENT user.
 *
 * Mirrors the exact counting logic in lib/entitlements/checkAccess.ts:
 * summed `quantity` on UsageEvent, over the SAME window that file uses —
 * all time for the free plan, calendar month for paid plans. If those two
 * ever disagree the meter lies to the user, so any change to the window or
 * the aggregate here must be mirrored there.
 *
 * `resetsAt` is null on the free plan because that allocation never refreshes.
 * The UI must not render a reset date when this is null; promising a refill
 * that will never arrive is worse than showing no date at all.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const plan = await getUserPlan(user.id);
    const isLifetime = plan === "free";

    let periodStart: Date | null = null;
    let resetsAt: Date | null = null;

    if (!isLifetime) {
      periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);

      resetsAt = new Date(periodStart);
      resetsAt.setMonth(resetsAt.getMonth() + 1);
    }

    const grouped = await prisma.usageEvent.groupBy({
      by: ["feature"],
      where: {
        userId: user.id,
        ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
      },
      _sum: { quantity: true },
    });

    const usedByFeature: Record<string, number> = {};
    for (const row of grouped) {
      usedByFeature[row.feature] = row._sum.quantity ?? 0;
    }

    const features: Record<string, FeatureUsage> = {};
    for (const feature of FEATURES) {
      const limit = getLimit(plan, feature);
      const used = usedByFeature[feature] ?? 0;

      features[feature] = {
        feature,
        used,
        limit,
        remaining: limit === null ? null : Math.max(limit - used, 0),
        unlimited: limit === null,
      };
    }

    return NextResponse.json({
      plan,
      isLifetime,
      periodStart: periodStart ? periodStart.toISOString() : null,
      resetsAt: resetsAt ? resetsAt.toISOString() : null,
      features,
    });
  } catch (error) {
    console.error("Usage me error:", error);
    return NextResponse.json(
      { error: "Could not load your usage right now." },
      { status: 500 }
    );
  }
}