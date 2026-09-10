"use client";

import { useEffect, useState } from "react";

type PlanId = "free" | "creator" | "creator_pro";

/**
 * These mirror lib/entitlements/limits.ts and components/marketing/
 * pricing-section.tsx. All three have to agree — a dialog that promises more
 * than checkAccess allows becomes a refund request. If a limit changes,
 * change it in all three places.
 */
const PLANS: {
  id: Exclude<PlanId, "free">;
  name: string;
  price: string;
  tagline: string;
  featured: boolean;
  features: string[];
}[] = [
  {
    id: "creator",
    name: "Creator",
    price: "$9.99",
    tagline: "For creators who publish consistently.",
    featured: true,
    features: [
      "Unlimited content ideas",
      "50 scripts a month",
      "150 SEO sets a month",
      "30 content plans a month",
      "20 script analyses a month",
      "Priority processing",
    ],
  },
  {
    id: "creator_pro",
    name: "Creator Pro",
    price: "$19.99",
    tagline: "For creators serious about growth.",
    featured: false,
    features: [
      "Unlimited ideas, scripts and analyses",
      "400 SEO sets a month",
      "100 content plans a month",
      "Advanced growth insights",
      "Early access to new features",
      "Premium support",
    ],
  },
];

/** Row-by-row comparison, including what the free plan gives today. */
const COMPARISON: { label: string; free: string; creator: string; pro: string }[] = [
  { label: "Content ideas", free: "10 total", creator: "Unlimited", pro: "Unlimited" },
  { label: "Scripts", free: "5 total", creator: "50/mo", pro: "Unlimited" },
  { label: "SEO sets", free: "15 total", creator: "150/mo", pro: "400/mo" },
  { label: "Content plans", free: "5 total", creator: "30/mo", pro: "100/mo" },
  { label: "Script analyses", free: "3 total", creator: "20/mo", pro: "Unlimited" },
  { label: "Priority processing", free: "—", creator: "Yes", pro: "Yes" },
  { label: "Advanced insights", free: "—", creator: "—", pro: "Yes" },
  { label: "Support", free: "Community", creator: "Standard", pro: "Premium" },
];

interface Props {
  currentPlan: PlanId;
  /** Classes for the trigger button, so it matches whatever page hosts it. */
  triggerClassName?: string;
  triggerLabel?: string;
}

/**
 * Opens plan selection in place instead of bouncing to the marketing page.
 *
 * The old path was: Upgrade → /#pricing → checkout. That drops a signed-in
 * customer onto a page written for strangers, loses their context, and puts
 * two extra decisions between them and paying.
 *
 * Checkout itself is still a plain <a> to /api/checkout — that route redirects
 * off-site to Lemon Squeezy, so it must be a full navigation, not a Link.
 */
export default function UpgradeDialog({
  currentPlan,
  triggerClassName = "inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] sm:py-2.5",
  triggerLabel = "Upgrade →",
}: Props) {
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            role="presentation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#0b1020]/50 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose a plan"
            className="relative flex max-h-[92vh] w-full max-w-[840px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_30px_80px_rgba(17,19,24,0.28)] sm:rounded-2xl"
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#ececf1] px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-[#111827] sm:text-xl">
                  Choose your plan
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  You&apos;re on{" "}
                  <span className="font-medium text-[#111827]">
                    {currentPlan === "free"
                      ? "the Free plan"
                      : currentPlan === "creator"
                      ? "Creator"
                      : "Creator Pro"}
                  </span>
                  . Cancel anytime.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#9ca3af] transition hover:bg-[#f4f5f8] hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            {/* body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {PLANS.map((plan) => {
                  const isCurrent = currentPlan === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col rounded-2xl border p-4 sm:p-5 ${
                        plan.featured && !isCurrent
                          ? "border-[#c9c6f6] bg-[#fbfbff]"
                          : "border-[#ececf1] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-semibold text-[#111827]">{plan.name}</p>
                        {isCurrent ? (
                          <span className="shrink-0 rounded-full bg-[#e9f9f0] px-2.5 py-1 text-[11px] font-medium text-[#059669]">
                            Current
                          </span>
                        ) : plan.featured ? (
                          <span className="shrink-0 rounded-full bg-[#eef0fb] px-2.5 py-1 text-[11px] font-medium text-[#5b5bd6]">
                            Most popular
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-[30px] font-bold leading-none tracking-[-0.6px] text-[#111827]">
                          {plan.price}
                        </span>
                        <span className="text-sm text-[#6b7280]">/month</span>
                      </div>

                      <p className="mt-2 text-sm text-[#6b7280]">{plan.tagline}</p>

                      <ul className="mt-4 flex-1 space-y-2 border-t border-[#f1f2f6] pt-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-[#374151]">
                            <span className="mt-[3px] shrink-0 text-[13px] text-[#22c55e]">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      {isCurrent ? (
                        <span className="mt-4 rounded-xl border border-[#e5e7eb] py-3 text-center text-sm font-medium text-[#9ca3af] sm:py-2.5">
                          Your current plan
                        </span>
                      ) : (
                        <a
                          href={`/api/checkout?plan=${plan.id}`}
                          onClick={() => setStarting(plan.id)}
                          className={`mt-4 rounded-xl py-3 text-center text-sm font-medium transition sm:py-2.5 ${
                            plan.featured
                              ? "bg-[#0b1020] text-white hover:bg-[#1b2338]"
                              : "border border-[#e5e7eb] text-[#111827] hover:bg-[#f7f8fa]"
                          }`}
                        >
                          {starting === plan.id ? "Opening checkout…" : `Choose ${plan.name} →`}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* comparison */}
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#ececf1]">
                <div className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] bg-[#fafbfd] px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[#9ca3af] sm:px-4">
                  <span>What you get</span>
                  <span className="text-center">Free</span>
                  <span className="text-center">Creator</span>
                  <span className="text-center">Pro</span>
                </div>

                {COMPARISON.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] items-center border-t border-[#f1f2f6] px-3 py-2.5 text-[13px] sm:px-4"
                  >
                    <span className="pr-2 text-[#374151]">{row.label}</span>
                    <span className="text-center text-[#9ca3af]">{row.free}</span>
                    <span className="text-center font-medium text-[#111827]">{row.creator}</span>
                    <span className="text-center font-medium text-[#111827]">{row.pro}</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-5 text-[#9ca3af]">
                Free limits are a one-time allocation and don&apos;t reset. Paid limits refresh on
                the 1st of every month. Payments are handled by Lemon Squeezy; you can cancel any
                time from Settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}