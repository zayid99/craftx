import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

type Plan = {
  name: string;
  monthly: number;
  tagline: string;
  cta: string;
  featured: boolean;
  features: string[];
  note?: string;
  /** Matches the keys in LEMONSQUEEZY_VARIANTS. Undefined for the free plan. */
  planId?: "creator" | "creator_pro";
};

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
    planId: "creator",
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
    planId: "creator_pro",
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
 * Monthly billing only. (see prior comment block — unchanged, omitted here for brevity in
 * your file keep the original long comment above the component)
 */
export default async function PricingSection() {
  const user = await getAuthenticatedUser();

  return (
    <section id="pricing" className="px-5 py-[48px] sm:px-6 sm:py-[80px] lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[14px] py-[6px] text-[11px] tracking-[1.1px] text-[#5b5bd6] sm:px-[16px] sm:text-[12px] sm:tracking-[1.26px]">
            SIMPLE PRICING
          </span>
          <h2 className="mt-[18px] text-[28px] font-bold tracking-[-0.56px] text-[#111827] sm:mt-[22px] sm:text-[38px] sm:tracking-[-0.76px]">
            Choose your creator workflow.
          </h2>
          <p className="mt-[10px] text-[14.5px] text-[#6b7280] sm:text-[15px]">
            Start free, upgrade when you&apos;re ready. Cancel anytime.
          </p>
        </div>

        <div className="mt-[28px] grid items-start gap-[16px] sm:mt-[47px] sm:gap-[22px] lg:grid-cols-3">
          {plans.map((plan) => {
            const price =
              plan.monthly === 0 ? "$0" : `$${plan.monthly.toFixed(2)}`;

            // Free plan: send logged-in users to their dashboard, not signup.
            // Paid plans: send logged-in users straight to checkout; logged-out
            // users to signup, carrying the chosen plan so signup can hand them
            // to checkout right after (wire this up in the signup flow if you
            // want that continuity — for now it just preserves old behavior).
            const isFree = !plan.planId;
            const href = isFree
              ? user
                ? "/dashboard"
                : "/signup"
              : user
              ? `/api/checkout?plan=${plan.planId}`
              : `/signup?plan=${plan.planId}`;

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
                    {plan.monthly > 0 && (
                      <span className="text-[15px] text-[#6b7280] sm:text-[16px]">/month</span>
                    )}
                  </div>

                  <p className="mt-[9px] text-[14px] text-[#6b7280]">{plan.tagline}</p>

                  <ul className="mt-[18px] flex-1 space-y-[9px] sm:mt-[22px]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-[11px] text-[14.5px] sm:text-[15px]">
                        <span className="mt-[2px] text-[14px] text-[#22c55e]">✓</span>
                        <span className="text-[#374151]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.note && (
                    <p className="mt-[16px] border-t border-[#f1f2f6] pt-[14px] text-[13px] leading-[19px] text-[#9ca3af] sm:mt-[18px]">
                      {plan.note}
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
      </div>
    </section>
  );
}