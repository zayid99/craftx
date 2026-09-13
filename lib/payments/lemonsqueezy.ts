import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let isConfigured = false;

/**
 * Ensures the Lemon Squeezy SDK is configured with our API key.
 * Call this at the top of any server-side function that uses the SDK.
 */
export function configureLemonSqueezy() {
  if (isConfigured) return;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "LEMONSQUEEZY_API_KEY is not set. Check your .env.local file."
    );
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("[LemonSqueezy SDK Error]", error);
    },
  });

  isConfigured = true;
}

export const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!;

export const LEMONSQUEEZY_VARIANTS = {
  creator: {
    monthly: process.env.LEMONSQUEEZY_VARIANT_CREATOR!,
    yearly: process.env.LEMONSQUEEZY_VARIANT_CREATOR_ANNUAL!,
  },
  creator_pro: {
    monthly: process.env.LEMONSQUEEZY_VARIANT_CREATOR_PRO!,
    yearly: process.env.LEMONSQUEEZY_VARIANT_CREATOR_PRO_ANNUAL!,
  },
} as const;

export type PlanId = keyof typeof LEMONSQUEEZY_VARIANTS;
export type BillingInterval = "monthly" | "yearly";

export const BILLING_INTERVALS: BillingInterval[] = ["monthly", "yearly"];

export function isPlanId(value: string | null): value is PlanId {
  return value !== null && value in LEMONSQUEEZY_VARIANTS;
}

export function isBillingInterval(
  value: string | null
): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

/**
 * Reverse lookup: given a Lemon Squeezy variant ID from a webhook payload,
 * work out which plan it belongs to. Returns "free" if it matches nothing,
 * which means an unrecognised variant reached us and should be investigated.
 */
export function planFromVariantId(variantId: number | string): string {
  const id = String(variantId);

  for (const [plan, variants] of Object.entries(LEMONSQUEEZY_VARIANTS)) {
    if (id === variants.monthly || id === variants.yearly) {
      return plan;
    }
  }

  return "free";
}

/**
 * Returns "monthly" or "yearly" for a known variant ID, or null if unknown.
 * Used to store the billing interval alongside the subscription.
 */
export function intervalFromVariantId(
  variantId: number | string
): BillingInterval | null {
  const id = String(variantId);

  for (const variants of Object.values(LEMONSQUEEZY_VARIANTS)) {
    if (id === variants.monthly) return "monthly";
    if (id === variants.yearly) return "yearly";
  }

  return null;
}