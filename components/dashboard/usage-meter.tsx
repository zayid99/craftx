"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PlanId = "free" | "creator" | "creator_pro";

// "coach" removed pre-launch alongside the Creator Coach. Add it back here and
// in FEATURE_NOUNS when the Coach returns.
type FeatureKey =
  | "ideas"
  | "scripts"
  | "seo"
  | "planner"
  | "analyzer";

interface FeatureUsage {
  feature: FeatureKey;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

interface UsageResponse {
  plan: PlanId;
  /** true when the allocation never refreshes (free plan). */
  isLifetime: boolean;
  /** null on the free plan — there is no period. */
  periodStart: string | null;
  /** null on the free plan — nothing ever resets. */
  resetsAt: string | null;
  features: Record<string, FeatureUsage>;
}

interface UsageMeterProps {
  feature: FeatureKey;
  /** Bump this number after a successful generate to force a refetch. */
  refreshKey?: number;
  className?: string;
}

/**
 * Dispatch this from anywhere after a successful generation and every mounted
 * meter refetches:  window.dispatchEvent(new Event(USAGE_UPDATED_EVENT))
 */
export const USAGE_UPDATED_EVENT = "craftx:usage-updated";

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

/** [singular, plural] noun used in the meter copy. */
const FEATURE_NOUNS: Record<FeatureKey, [string, string]> = {
  ideas: ["idea", "ideas"],
  scripts: ["script", "scripts"],
  seo: ["SEO set", "SEO sets"],
  planner: ["plan", "plans"],
  analyzer: ["analysis", "analyses"],
};

function noun(feature: FeatureKey, count: number): string {
  const [singular, plural] = FEATURE_NOUNS[feature];
  return count === 1 ? singular : plural;
}

function formatResetDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "next month";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function UsageMeter({
  feature,
  refreshKey = 0,
  className = "",
}: UsageMeterProps) {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  const bumpTick = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    window.addEventListener(USAGE_UPDATED_EVENT, bumpTick);
    return () => window.removeEventListener(USAGE_UPDATED_EVENT, bumpTick);
  }, [bumpTick]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        const res = await fetch("/api/usage/me", { cache: "no-store" });

        if (!res.ok) {
          if (!cancelled) setFailed(true);
          return;
        }

        const json: UsageResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsage();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, tick]);

  // Never block the tool itself — if usage can't be read, show nothing.
  if (failed) return null;

  if (loading) {
    return (
      <div
        className={`h-9 w-56 animate-pulse rounded-full bg-black/5 ${className}`}
      />
    );
  }

  const usage = data?.features?.[feature];
  if (!data || !usage) return null;

  const planLabel = PLAN_LABELS[data.plan] ?? data.plan;

  // Unlimited on this plan
  if (usage.unlimited) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm text-violet-700 ${className}`}
      >
        <span aria-hidden="true" className="text-base leading-none">
          ∞
        </span>
        <span>
          Unlimited {FEATURE_NOUNS[feature][1]} on {planLabel}
        </span>
      </div>
    );
  }

  const limit = usage.limit ?? 0;
  const used = Math.min(usage.used, limit);
  const remaining = usage.remaining ?? 0;
  const percentUsed = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;

  const isEmpty = remaining === 0;
  const isLow = !isEmpty && remaining <= Math.max(1, Math.ceil(limit * 0.2));

  // The free allocation is one-time. Saying "this month" or showing a reset
  // date here would promise a refill that never arrives.
  const isLifetime = data.isLifetime;

  const barColor = isEmpty
    ? "bg-red-500"
    : isLow
      ? "bg-amber-500"
      : "bg-violet-500";

  const textColor = isEmpty
    ? "text-red-700"
    : isLow
      ? "text-amber-700"
      : "text-black/60";

  let headline: string;
  if (isEmpty) {
    headline = isLifetime
      ? `You've used all ${limit} free ${FEATURE_NOUNS[feature][1]}`
      : `No ${FEATURE_NOUNS[feature][1]} left this month`;
  } else {
    headline = isLifetime
      ? `${remaining} of ${limit} free ${noun(feature, remaining)} left`
      : `${remaining} of ${limit} ${noun(feature, remaining)} left`;
  }

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-sm font-medium ${textColor}`}>{headline}</p>
        <p className="shrink-0 text-xs text-black/40">
          {used}/{limit} used
        </p>
      </div>

      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-label={
          isLifetime
            ? `${FEATURE_NOUNS[feature][1]} used from your free allocation`
            : `${FEATURE_NOUNS[feature][1]} used this month`
        }
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-xs text-black/40">
          {isLifetime
            ? "One-time free allocation"
            : data.resetsAt
              ? `Resets ${formatResetDate(data.resetsAt)}`
              : ""}
        </p>

        {(isEmpty || isLow) && data.plan !== "creator_pro" && (
          <Link
            href="/dashboard/settings"
            className="text-xs font-medium text-violet-600 underline-offset-2 hover:underline"
          >
            Upgrade plan
          </Link>
        )}
      </div>
    </div>
  );
}