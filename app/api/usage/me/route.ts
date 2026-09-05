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
  "coach",
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
 * summed `quantity` on UsageEvent, from the first day of the calendar month.
 * If those two ever disagree, the meter would lie to the user — so any change
 * to the window or the aggregate here must be mirrored there.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const plan = await getUserPlan(user.id);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const resetsAt = new Date(startOfMonth);
    resetsAt.setMonth(resetsAt.getMonth() + 1);

    const grouped = await prisma.usageEvent.groupBy({
      by: ["feature"],
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
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
      periodStart: startOfMonth.toISOString(),
      resetsAt: resetsAt.toISOString(),
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