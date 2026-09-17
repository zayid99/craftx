"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = {
  name: string;
  monthly: number;
  /** Annual price in dollars. Undefined for the free plan. */
  yearly?: number;
  tagline: string;
  cta: string;
  featured: boolean;
  features: string[];
  note?: string;
  /** Matches the keys in LEMONSQUEEZY_VARIANTS. Undefined for the free plan. */
  planId?: "creator" | "creator_pro";
};

/**
 * Every line below is a promise to a paying customer. The numbers mirror
 * lib/entitlements/limits.ts — change them together — and nothing is listed
 * that the product doesn't do today (no "priority processing", "insights" or
 * support tiers until they actually exist).
 */
const plans: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    tagline: "For trying CRAFTX end to end.",
    cta: "Get started free",
    featured: false,
    features: [
      "Every studio included",
      "10 content ideas",
      "5 scripts",
      "3 hook & title sets",
      "15 SEO sets",
      "5 content plans",
      "3 script analyses",
      "Creator profile/context",
    ],
    note: "A one-time allocation to try the full workflow. It doesn't reset each month.",
  },
  {
    name: "Creator",
    monthly: 9.99,
    yearly: 99,
    tagline: "For creators who publish consistently.",
    cta: "Start creating →",
    featured: true,
    planId: "creator",
    features: [
      "Unlimited content ideas",
      "Fresh idea picks on your dashboard daily",
      "50 scripts a month",
      "10 hook & title sets a month",
      "150 SEO sets a month",
      "30 content plans a month",
      "20 script analyses a month",
      "Creator profile/context",
    ],
    note: "Limits refresh on the 1st of every month.",
  },
  {
    name: "Creator Pro",
    monthly: 19.99,
    yearly: 199,
    tagline: "For creators serious about growth.",
    cta: "Go Pro →",
    featured: false,
    planId: "creator_pro",
    features: [
      "Unlimited hooks & titles",
      "Unlimited ideas, scripts and script analyses",
      "400 SEO sets a month",
      "100 content plans a month",
      "Fresh idea picks on your dashboard daily",
      "Everything in Creator",
    ],
    note: "Limits refresh on the 1st of every month.",
  },
];

type Interval = "monthly" | "yearly";

export default function PricingPlans({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [interval, setInterval] = useState<Interval>("monthly");

  return (
    <>
      <div className="mt-[22px] flex justify-center sm:mt-[28px]">
        <div className="inline-flex items-center gap-[4px] rounded-full border border-[#e5e7eb] bg-[#f7f8fa] p-[4px]">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setInterval(option)}
              aria-pressed={interval === option}
              className={`rounded-full px-[18px] py-[8px] text-[14px] transition sm:px-[22px] sm:text-[15px] ${
                interval === option
                  ? "bg-white text-[#111827] shadow-[0_1px_3px_rgba(17,19,24,0.10)]"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              {option === "monthly" ? "Monthly" : "Yearly"}
              {option === "yearly" && (
                <span className="ml-[7px] text-[12px] text-[#5b5bd6] sm:text-[12.5px]">
                  2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[28px] grid items-start gap-[16px] sm:mt-[40px] sm:gap-[22px] lg:grid-cols-3">
        {plans.map((plan) => {
          const isFree = !plan.planId;
          const showYearly = interval === "yearly" && plan.yearly !== undefined;

          const price = isFree
            ? "$0"
            : showYearly
            ? `$${plan.yearly}`
            : `$${plan.monthly.toFixed(2)}`;

          const priceSuffix = isFree ? null : showYearly ? "/year" : "/month";

          // Monthly equivalent of the annual price, shown so the two options
          // can be compared directly.
          const perMonthEquivalent =
            showYearly && plan.yearly
              ? (plan.yearly / 12).toFixed(2)
              : null;

          const savings =
            showYearly && plan.yearly
              ? (plan.monthly * 12 - plan.yearly).toFixed(2)
              : null;

          // Free plan: send logged-in users to their dashboard, not signup.
          // Paid plans: logged-in users go straight to checkout; logged-out
          // users to signup, carrying plan and interval so the signup flow can
          // hand them to checkout afterwards.
          const query = plan.planId
            ? `plan=${plan.planId}&interval=${interval}`
            : "";

          const href = isFree
            ? isLoggedIn
              ? "/dashboard"
              : "/signup"
            : isLoggedIn
            ? `/api/checkout?${query}`
            : `/signup?${query}`;

          // Paid checkout goes through a route handler that issues a
          // redirect to Lemon Squeezy. next/link's client-side router can
          // mishandle navigation to a non-page route handler, so use a
          // plain <a> there to guarantee a real browser navigation that
          // follows the redirect. Internal app pages still use <Link>.
          const isRouteHandler = href.startsWith("/api/");

          const ctaClassName = `mt-[20px] block rounded-[11px] py-[14px] text-center text-[15px] transition sm:mt-[22px] sm:text-[16px] ${
            plan.featured
              ? "bg-[#0b1020] text-white hover:bg-[#1b2338]"
              : "border border-[#e5e7eb] text-[#111827] hover:bg-[#f7f8fa]"
          }`;

          const note = isFree
            ? plan.note
            : showYearly
            ? "Billed once a year. Usage limits still refresh on the 1st of every month."
            : plan.note;

          return (
            <div
              key={plan.name}
              className={`flex flex-col rounded-[18px] bg-white pb-[20px] sm:pb-[25px] ${
                plan.featured
                  ? "overflow-hidden border border-[#c9c6f6] shadow-[0_20px_60px_rgba(80,70,200,0.10)]"
                  : "border border-[#ececf1] pt-[22px] sm:pt-[29px]"
              }`}
            >
              {plan.featured && (
                <div
                  className="py-[5px] text-center text-[13px] text-white"
                  style={{ background: "linear-gradient(90deg,#4f7dfb 0%,#9b6cf3 100%)" }}
                >
                  Most popular
                </div>
              )}

              <div
                className={`flex flex-1 flex-col px-[20px] sm:px-[29px] ${
                  plan.featured ? "pt-[20px] sm:pt-[24px]" : ""
                }`}
              >
                <h3 className="text-[18px] text-[#111827] sm:text-[19px]">{plan.name}</h3>

                <div className="mt-[12px] flex items-baseline gap-[8px] sm:mt-[14px]">
                  <span className="text-[38px] font-bold leading-none tracking-[-0.76px] text-[#111827] sm:text-[45px] sm:tracking-[-0.9px]">
                    {price}
                  </span>
                  {priceSuffix && (
                    <span className="text-[15px] text-[#6b7280] sm:text-[16px]">
                      {priceSuffix}
                    </span>
                  )}
                </div>

                {perMonthEquivalent && savings && (
                  <p className="mt-[7px] text-[13.5px] text-[#5b5bd6]">
                    Works out to ${perMonthEquivalent}/month — save ${savings} a year
                  </p>
                )}

                <p className="mt-[9px] text-[14px] text-[#6b7280]">{plan.tagline}</p>

                <ul className="mt-[18px] flex-1 space-y-[9px] sm:mt-[22px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-[11px] text-[14.5px] sm:text-[15px]">
                      <span className="mt-[2px] text-[14px] text-[#22c55e]">✓</span>
                      <span className="text-[#374151]">{f}</span>
                    </li>
                  ))}
                </ul>

                {note && (
                  <p className="mt-[16px] border-t border-[#f1f2f6] pt-[14px] text-[13px] leading-[19px] text-[#9ca3af] sm:mt-[18px]">
                    {note}
                  </p>
                )}

                {isRouteHandler ? (
                  <a href={href} className={ctaClassName}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link href={href} className={ctaClassName}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}