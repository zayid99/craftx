import { prisma } from "@/lib/db/prisma";
import { estimateCostUsd } from "./pricing";

interface TrackUsageInput {
  userId: string;
  feature: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  quantity?: number; // defaults to 1 — pass actual count for batch-producing features like Idea Studio
}

export async function trackUsage(input: TrackUsageInput): Promise<void> {
  try {
    const estimatedCostUsd = estimateCostUsd(
      input.model,
      input.inputTokens,
      input.outputTokens
    );

    await prisma.usageEvent.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        provider: input.provider,
        model: input.model,
        quantity: input.quantity ?? 1,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        estimatedCostUsd,
      },
    });
  } catch (err) {
    // Usage tracking must never break the actual feature request
    console.error("Usage tracking failed:", err);
  }
}