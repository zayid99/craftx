import { getAuthenticatedUser } from "@/lib/auth/getUser";
import PricingPlans from "./pricing-plans";

/**
 * Server component: resolves the signed-in user, then hands off to the client
 * component that owns the monthly/yearly toggle state and renders the cards.
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

        <PricingPlans isLoggedIn={Boolean(user)} />
      </div>
    </section>
  );
}