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

export default function UpgradePrompt({
  plan,
  message,
  currentUsage,
  limit,
}: UpgradePromptProps) {
  // The free allocation is counted over all time in checkAccess, so it never
  // resets. Deriving this from the plan rather than taking it as a prop keeps
  // the two in sync without threading a flag through every tool route.
  const isLifetime = plan === "free";

  if (plan === "creator_pro") {
    return (
      <div className="rounded-2xl border border-[#ececf1] bg-[#fafbfd] p-5">
        <p className="text-sm leading-6 text-[#4b5563]">
          {message ?? "You've reached your monthly limit for this feature."}
        </p>
      </div>
    );
  }

  const nextPlan: PlanId = plan === "free" ? "creator" : "creator_pro";

  return (
    <div className="rounded-2xl border border-[#ded9fb] bg-[#f8f7ff] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eee9ff] text-[15px] text-[#6856fd]">
          ↑
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#111827]">
            {isLifetime
              ? "You've used your free allocation"
              : `You've hit your ${PLAN_LABELS[plan]} plan limit`}
          </p>

          {typeof currentUsage === "number" && typeof limit === "number" && (
            <p className="mt-0.5 text-sm text-[#6b7280]">
              {currentUsage}/{limit} used{isLifetime ? "" : " this month"}
            </p>
          )}

          {message && (
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">{message}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`/api/checkout?plan=${nextPlan}`}
              className="inline-flex items-center rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
            >
              Upgrade to {PLAN_LABELS[nextPlan]} →
            </a>

            {plan === "free" && (
              <a
                href="/api/checkout?plan=creator_pro"
                className="text-sm font-medium text-[#5b5bd6] underline-offset-2 hover:underline"
              >
                or go Creator Pro
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}