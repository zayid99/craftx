type Plan = {
  name: string;
  monthly: number;
  tagline: string;
  cta: string;
  featured: boolean;
  features: string[];
  /** Small print under the feature list. Used to flag the one-time free tier. */
  note?: string;
};

/**
 * These numbers mirror lib/entitlements/limits.ts. Change them there and here
 * together, or the pricing page promises what the entitlement system refuses.
 *
 * The Free plan is a ONE-TIME allocation, not a monthly one — checkAccess
 * counts free usage over all time. Copy here must not imply a monthly refresh.
 */
const plans: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    tagline: "For trying CRAFTX end to end.",
    cta: "Get started free",
    featured: false,
    features: [
      "All five studios included",
      "10 content ideas",
      "5 scripts",
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
    tagline: "For creators who publish consistently.",
    cta: "Start creating →",
    featured: true,
    features: [
      "Unlimited content ideas",
      "50 scripts a month",
      "150 SEO sets a month",
      "30 content plans a month",
      "20 script analyses a month",
      "Creator profile/context",
      "More projects",
      "Priority processing",
    ],
    note: "Limits refresh on the 1st of every month.",
  },
  {
    name: "Creator Pro",
    monthly: 19.99,
    tagline: "For creators serious about growth.",
    cta: "Go Pro →",
    featured: false,
    features: [
      "Unlimited ideas, scripts and analyses",
      "400 SEO sets a month",
      "100 content plans a month",
      "Advanced growth insights",
      "Priority AI processing",
      "Early access to new features",
      "Premium support",
    ],
    note: "Limits refresh on the 1st of every month.",
  },
];

/**
 * Monthly billing only.
 *
 * There was a Monthly/Yearly toggle here advertising "Save 20%", but
 * /api/checkout only has monthly Lemon Squeezy variants (2070714 and
 * 2070721). Nobody could ever be charged the annual price, and a public
 * price you cannot honour is a chargeback risk with a merchant of record.
 *
 * To bring it back you need, in this order:
 *   1. Annual variants created in Lemon Squeezy
 *   2. A billingCycle param threaded through /api/checkout
 *   3. The annual variant IDs mapped in the webhook handler
 *   4. Only then, the toggle and the discounted display price
 *
 * This component no longer holds state, so it doesn't need "use client".
 */
export default function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-[80px] lg:px-8">
      <div className="mx-auto max-w-[1200px]">
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

        <div className="mt-[47px] grid items-start gap-[22px] lg:grid-cols-3">
          {plans.map((plan) => {
            const price =
              plan.monthly === 0 ? "$0" : `$${plan.monthly.toFixed(2)}`;

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

                  {plan.note && (
                    <p className="mt-[18px] border-t border-[#f1f2f6] pt-[14px] text-[13px] leading-[19px] text-[#9ca3af]">
                      {plan.note}
                    </p>
                  )}

                  <a
                    href="/signup"
                    className={`mt-[22px] rounded-[11px] py-[14px] text-center text-[16px] transition ${
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