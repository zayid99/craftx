"use client";

type PlanId = "free" | "creator" | "creator_pro";

interface UpgradePromptProps {
  plan: PlanId;
  message?: string;
  currentUsage?: number | null;
  limit?: number | null;
}

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

export default function UpgradePrompt({ plan, message, currentUsage, limit }: UpgradePromptProps) {
  if (plan === "creator_pro") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">{message ?? "You've reached your monthly limit for this feature."}</p>
      </div>
    );
  }

  const nextPlan: PlanId = plan === "free" ? "creator" : "creator_pro";
  const checkoutUrlNext = "/api/checkout?plan=" + nextPlan;
  const checkoutUrlPro = "/api/checkout?plan=creator_pro";
  const primaryBtnClass = "inline-flex items-center text-sm bg-amber-600 text-white px-3 py-1.5 rounded-md hover:bg-amber-700";
  const secondaryBtnClass = "inline-flex items-center text-sm text-amber-700 underline hover:text-amber-900";

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-amber-900">You've hit your {PLAN_LABELS[plan]} plan limit</p>
        {typeof currentUsage === "number" && typeof limit === "number" && (
          <p className="text-sm text-amber-700 mt-0.5">{currentUsage}/{limit} used this month</p>
        )}
        {message && <p className="text-sm text-amber-700 mt-1">{message}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={checkoutUrlNext} className={primaryBtnClass}>Upgrade to {PLAN_LABELS[nextPlan]}</a>
        {plan === "free" && (
          <a href={checkoutUrlPro} className={secondaryBtnClass}>or go Creator Pro</a>
        )}
      </div>
    </div>
  );
}