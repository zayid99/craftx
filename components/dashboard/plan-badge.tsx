"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PlanId = "free" | "creator" | "creator_pro";

interface SubscriptionStatus {
  plan: PlanId;
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
  isCancelling: boolean;
}

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free plan",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

const PLAN_DOT_COLOR: Record<PlanId, string> = {
  free: "bg-black/30",
  creator: "bg-blue-500",
  creator_pro: "bg-purple-500",
};

export default function PlanBadge() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/subscription/status");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSubscription(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !subscription) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-black/40">
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span>Loading plan...</span>
      </div>
    );
  }

  const label = PLAN_LABELS[subscription.plan] ?? subscription.plan;
  const dotColor = PLAN_DOT_COLOR[subscription.plan] ?? "bg-black/30";

  return (
    <Link
      href="/dashboard/settings"
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black"
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
      {subscription.isCancelling && (
        <span className="ml-auto text-xs text-amber-600">Ending</span>
      )}
    </Link>
  );
}