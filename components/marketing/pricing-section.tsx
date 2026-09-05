"use client";

import { useState } from "react";

type Plan = {
  name: string;
  monthly: number;
  tagline: string;
  cta: string;
  featured: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    tagline: "For exploring CRAFTX.",
    cta: "Get started free",
    featured: false,
    features: [
      "Limited AI generations",
      "Basic Idea Studio",
      "Basic Script Studio",
      "Limited SEO",
      "Limited analysis",
      "Limited projects",
    ],
  },
  {
    name: "Creator",
    monthly: 9.99,
    tagline: "For creators who publish consistently.",
    cta: "Start creating →",
    featured: true,
    features: [
      "More AI generations",
      "Full Idea Studio",
      "Full Script Studio",
      "SEO Studio",
      "Content Planner",
      "Script Analyzer",
      "Creator Coach",
      "Creator profile/context",
      "More projects",
      "Priority processing",
    ],
  },
  {
    name: "Creator Pro",
    monthly: 19.99,
    tagline: "For creators serious about growth.",
    cta: "Go Pro →",
    featured: false,
    features: [
      "Higher usage limits",
      "Advanced analysis",
      "Advanced growth insights",
      "More projects",
      "Extended content planning",
      "Priority AI processing",
      "Advanced creator intelligence",
      "Early access to new features",
      "Premium support",
    ],
  },
];

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="px-6 py-[80px] lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[16px] py-[6px] text-[12px] tracking-[1.26px] text-[#5b5bd6]">
              SIMPLE PRICING
            </span>
            <h2 className="mt-[22px] text-[38px] font-bold tracking-[-0.76px] text-[#111827]">
              Choose your creator workflow.
            </h2>
            <p className="mt-[10px] text-[15px] text-[#6b7280]">
              Start free, upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </div>

          <div className="flex items-center gap-[4px] rounded-full border border-[#e5e7eb] bg-white p-[7px]">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-[20px] py-[9px] text-[15px] transition ${
                !yearly ? "bg-[#0b1020] text-white" : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 rounded-full px-[20px] py-[9px] text-[15px] transition ${
                yearly ? "bg-[#0b1020] text-white" : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              Yearly
              <span className={yearly ? "text-white/70" : "text-[#5b5bd6]"}>Save 20%</span>
            </button>
          </div>
        </div>

        <div className="mt-[47px] grid items-start gap-[22px] lg:grid-cols-3">
          {plans.map((plan) => {
            const price =
              plan.monthly === 0
                ? "$0"
                : yearly
                ? `$${(plan.monthly * 0.8).toFixed(2)}`
                : `$${plan.monthly.toFixed(2)}`;

            return (
              <div
                key={plan.name}
                className={`flex flex-col rounded-[18px] bg-white pb-[25px] ${
                  plan.featured
                    ? "overflow-hidden border border-[#c9c6f6] shadow-[0_20px_60px_rgba(80,70,200,0.10)]"
                    : "border border-[#ececf1] pt-[29px]"
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

                <div className={`flex flex-1 flex-col px-[29px] ${plan.featured ? "pt-[24px]" : ""}`}>
                  <h3 className="text-[19px] text-[#111827]">{plan.name}</h3>

                  <div className="mt-[14px] flex items-baseline gap-[8px]">
                    <span className="text-[45px] font-bold leading-none tracking-[-0.9px] text-[#111827]">
                      {price}
                    </span>
                    {plan.monthly > 0 && (
                      <span className="text-[16px] text-[#6b7280]">/month</span>
                    )}
                  </div>

                  <p className="mt-[9px] text-[14px] text-[#6b7280]">{plan.tagline}</p>

                  <ul className="mt-[22px] flex-1 space-y-[9px]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-[11px] text-[15px]">
                        <span className="mt-[2px] text-[14px] text-[#22c55e]">✓</span>
                        <span className="text-[#374151]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/signup"
                    className={`mt-[29px] rounded-[11px] py-[14px] text-center text-[16px] transition ${
                      plan.featured
                        ? "bg-[#0b1020] text-white hover:bg-[#1b2338]"
                        : "border border-[#e5e7eb] text-[#111827] hover:bg-[#f7f8fa]"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}