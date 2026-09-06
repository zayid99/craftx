import { prisma } from "@/lib/db/prisma";

/**
 * Spend caps — the app-level backstop.
 *
 * Layer 0 is DeepSeek's prepaid balance, which is a hard physical ceiling and
 * cannot be bypassed by a bug in here. This module exists so you find out and
 * stop BEFORE that balance drains, and so a single account can't burn the
 * month's budget in an afternoon.
 *
 * Reads estimatedCostUsd from UsageEvent, so it is only as accurate as
 * lib/usage/pricing.ts. Those rates deliberately over-estimate, meaning the
 * cap trips slightly early. That is the correct direction to be wrong in.
 */

const GLOBAL_MONTHLY_CAP_USD = Number(process.env.SPEND_CAP_USD ?? 30);
const PER_USER_DAILY_CAP_USD = Number(process.env.USER_DAILY_CAP_USD ?? 0.5);

/**
 * The global sum is cached so we aren't running an aggregate on every single
 * request. The window is short, and it collapses to zero once spend passes 80%
 * of the cap — near the limit we always read fresh, so the most we can overshoot
 * is whatever gets spent inside one 60s window at low spend levels (pennies).
 */
const CACHE_TTL_MS = 60_000;
const CACHE_DISABLE_THRESHOLD = 0.8;

let cachedGlobal: { total: number; at: number } | null = null;

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfDay(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function sumCost(where: object): Promise<number> {
  const result = await prisma.usageEvent.aggregate({
    _sum: { estimatedCostUsd: true },
    where,
  });
  return result._sum.estimatedCostUsd ?? 0;
}

async function getGlobalMonthSpend(): Promise<number> {
  const now = Date.now();

  if (
    cachedGlobal &&
    now - cachedGlobal.at < CACHE_TTL_MS &&
    cachedGlobal.total < GLOBAL_MONTHLY_CAP_USD * CACHE_DISABLE_THRESHOLD
  ) {
    return cachedGlobal.total;
  }

  const total = await sumCost({ createdAt: { gte: startOfMonth() } });
  cachedGlobal = { total, at: now };
  return total;
}

export interface SpendCapResult {
  allowed: boolean;
  reason?: "global" | "user";
  /** Safe to show a user. Never leaks your actual spend figures. */
  message?: string;
}

export async function checkSpendCap(userId: string): Promise<SpendCapResult> {
  try {
    const globalSpend = await getGlobalMonthSpend();

    if (globalSpend >= GLOBAL_MONTHLY_CAP_USD) {
      console.error(
        `[SpendCap] GLOBAL CAP HIT: $${globalSpend.toFixed(4)} of ` +
          `$${GLOBAL_MONTHLY_CAP_USD} this month. All AI generation is now ` +
          `blocked until the 1st or until SPEND_CAP_USD is raised.`
      );
      return {
        allowed: false,
        reason: "global",
        message:
          "CraftX is at capacity right now. Please try again in a little while.",
      };
    }

    const userSpend = await sumCost({
      userId,
      createdAt: { gte: startOfDay() },
    });

    if (userSpend >= PER_USER_DAILY_CAP_USD) {
      console.warn(
        `[SpendCap] User daily cap hit: userId=${userId} ` +
          `spent $${userSpend.toFixed(4)} of $${PER_USER_DAILY_CAP_USD} today.`
      );
      return {
        allowed: false,
        reason: "user",
        message:
          "You've hit today's generation limit. It resets at midnight UTC.",
      };
    }

    // Warn while there's still time to act.
    if (globalSpend >= GLOBAL_MONTHLY_CAP_USD * 0.8) {
      console.warn(
        `[SpendCap] ${Math.round(
          (globalSpend / GLOBAL_MONTHLY_CAP_USD) * 100
        )}% of the monthly cap used ($${globalSpend.toFixed(4)}).`
      );
    }

    return { allowed: true };
  } catch (err) {
    // Deliberately fails OPEN. If Postgres is unreachable the save routes are
    // broken anyway, and DeepSeek's prepaid balance is still a hard ceiling
    // underneath this. Taking the whole product down over a transient DB error
    // would cost more than the few cents at risk. The error is loud so it can't
    // fail open silently.
    console.error("[SpendCap] Check failed, allowing request:", err);
    return { allowed: true };
  }
}

/** For the admin dashboard. Not used by the cap itself. */
export async function getSpendSummary() {
  const [month, today] = await Promise.all([
    sumCost({ createdAt: { gte: startOfMonth() } }),
    sumCost({ createdAt: { gte: startOfDay() } }),
  ]);

  return {
    monthToDate: month,
    today,
    monthlyCap: GLOBAL_MONTHLY_CAP_USD,
    percentUsed: Math.round((month / GLOBAL_MONTHLY_CAP_USD) * 100),
  };
}