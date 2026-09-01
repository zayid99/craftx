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
  creator: process.env.LEMONSQUEEZY_VARIANT_CREATOR!,
  creator_pro: process.env.LEMONSQUEEZY_VARIANT_CREATOR_PRO!,
} as const;

export type PlanId = keyof typeof LEMONSQUEEZY_VARIANTS;