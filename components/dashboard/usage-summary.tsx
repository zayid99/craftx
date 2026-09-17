"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LightbulbIcon,
  FileTextIcon,
  SearchIcon,
  PlayCircleIcon,
  CalendarIcon,
} from "@/components/marketing/landing-icons";
import { USAGE_UPDATED_EVENT } from "@/components/dashboard/usage-meter";
import { HookIcon } from "@/components/dashboard/hook-icon";

type PlanId = "free" | "creator" | "creator_pro";

type FeatureKey = "ideas" | "scripts" | "hooks" | "seo" | "planner" | "analyzer";

interface FeatureUsage {
  feature: FeatureKey;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

interface UsageResponse {
  plan: PlanId;
  isLifetime: boolean;
  periodStart: string | null;
  resetsAt: string | null;
  features: Record<string, FeatureUsage>;
}

/**
 * Dashboard overview of every studio's allowance. Reads /api/usage/me — the
 * same endpoint as the per-studio UsageMeter — so the two can never disagree.
 * Order and colors match the stat cards and sidebar.
 */
const ROWS: {
  feature: FeatureKey;
  label: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  icon: string;
  bar: string;
}[] = [
  { feature: "ideas", label: "Ideas", href: "/ideas", Icon: LightbulbIcon, icon: "text-[#3b82f6]", bar: "bg-[#3b82f6]" },
  { feature: "scripts", label: "Scripts", href: "/scripts", Icon: FileTextIcon, icon: "text-[#8b5cf6]", bar: "bg-[#8b5cf6]" },
  { feature: "hooks", label: "Hook sets", href: "/hooks", Icon: HookIcon, icon: "text-[#14b8a6]", bar: "bg-[#14b8a6]" },
  { feature: "seo", label: "SEO sets", href: "/seo", Icon: SearchIcon, icon: "text-[#10b981]", bar: "bg-[#10b981]" },
  { feature: "analyzer", label: "Analyses", href: "/analyzer", Icon: PlayCircleIcon, icon: "text-[#ec4899]", bar: "bg-[#ec4899]" },
  { feature: "planner", label: "Plans", href: "/planner", Icon: CalendarIcon, icon: "text-[#f97316]", bar: "bg-[#f97316]" },
];

function formatResetDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "next month";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Same thresholds as UsageMeter: empty, or within the last 20%. */
function usageState(u: FeatureUsage): "ok" | "low" | "empty" {
  if (u.unlimited || u.limit === null) return "ok";
  const remaining = u.remaining ?? 0;
  if (remaining === 0) return "empty";
  if (remaining <= Math.max(1, Math.ceil(u.limit * 0.2))) return "low";
  return "ok";
}

export default function UsageSummary() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(USAGE_UPDATED_EVENT, bump);
    return () => window.removeEventListener(USAGE_UPDATED_EVENT, bump);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // The fetch runs inside the effect so no state is set synchronously on mount.
    (async () => {
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Never break the dashboard over usage — if it can't load, show nothing.
  if (failed) return null;

  if (!data) {
    return <div className="h-[148px] animate-pulse rounded-2xl bg-[#f4f5f8]" />;
  }

  const rows = ROWS.filter((r) => data.features?.[r.feature]);
  if (rows.length === 0) return null;

  const anyLow = rows.some((r) => usageState(data.features[r.feature]) !== "ok");

  // The free allocation is one-time: never call it "this month" or show a
  // reset date, which would promise a refill that never arrives.
  const title = data.isLifetime ? "Your free allocation" : "This month";
  const subtitle = data.isLifetime
    ? "One-time allowance — it doesn't refresh"
    : data.resetsAt
      ? `Resets ${formatResetDate(data.resetsAt)}`
      : "";

  const linkClass = "shrink-0 text-sm font-medium text-[#6856fd] hover:underline";

  return (
    <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-[#111827]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#9ca3af] sm:text-sm">{subtitle}</p>}
        </div>

        {data.plan === "free" ? (
          /* Plain <a>, not <Link>: Link prefetches, and prefetching the
             checkout route could start a checkout session on page load. */
          <a href="/api/checkout?plan=creator" className={linkClass}>
            Upgrade for monthly limits →
          </a>
        ) : data.plan === "creator" && anyLow ? (
          <Link href="/dashboard/settings?tab=billing" className={linkClass}>
            Get more with Creator Pro →
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {rows.map((r) => {
          const u = data.features[r.feature];
          const state = usageState(u);
          const limit = u.limit ?? 0;
          const used = Math.min(u.used, limit);
          const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;
          const barColor =
            state === "empty" ? "bg-red-500" : state === "low" ? "bg-amber-500" : r.bar;

          return (
            <Link
              key={r.feature}
              href={r.href}
              className="rounded-xl border border-[#f1f2f6] p-3 transition hover:border-[#d8d9e4]"
            >
              <div className="flex items-center gap-2 text-[13px] text-[#6b7280]">
                <r.Icon className={`h-4 w-4 shrink-0 ${r.icon}`} />
                <span className="truncate">{r.label}</span>
              </div>

              {u.unlimited ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">
                    <span aria-hidden="true">∞ </span>Unlimited
                  </p>
                  <div className="mt-2 h-1.5" />
                </>
              ) : (
                <>
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      state === "empty"
                        ? "text-red-700"
                        : state === "low"
                          ? "text-amber-700"
                          : "text-[#111827]"
                    }`}
                  >
                    {used} <span className="font-normal text-[#9ca3af]">/ {limit}</span>
                  </p>
                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f2f6]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={limit}
                    aria-valuenow={used}
                    aria-label={`${r.label} used`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}