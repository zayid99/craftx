import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

interface FeatureStats {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.usageEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });

    const byFeature: { [feature: string]: FeatureStats } = {};

    let totalRequests = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;

    for (const event of events) {
      if (!byFeature[event.feature]) {
        byFeature[event.feature] = {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
        };
      }

      byFeature[event.feature].requests += 1;
      byFeature[event.feature].inputTokens += event.inputTokens;
      byFeature[event.feature].outputTokens += event.outputTokens;
      byFeature[event.feature].costUsd += event.estimatedCostUsd;

      totalRequests += 1;
      totalInputTokens += event.inputTokens;
      totalOutputTokens += event.outputTokens;
      totalCostUsd += event.estimatedCostUsd;
    }

    const byFeatureRounded: { [feature: string]: FeatureStats } = {};
    for (const feature of Object.keys(byFeature)) {
      byFeatureRounded[feature] = {
        ...byFeature[feature],
        costUsd: Math.round(byFeature[feature].costUsd * 1_000_000) / 1_000_000,
      };
    }

    return NextResponse.json({
      periodDays: days,
      totals: {
        requests: totalRequests,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        estimatedCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      },
      byFeature: byFeatureRounded,
    });
  } catch (error) {
    console.error("Usage summary error:", error);
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}