import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { prisma } from "@/lib/db/prisma";
import {
  configureLemonSqueezy,
  isBillingInterval,
  isPlanId,
  LEMONSQUEEZY_STORE_ID,
  LEMONSQUEEZY_VARIANTS,
} from "@/lib/payments/lemonsqueezy";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to upgrade." },
        { status: 401 }
      );
    }

    // Guard against a SECOND subscription. Any upgrade link (UpgradePrompt,
    // UpgradeDialog, old bookmarks) can land here, and a new checkout for
    // someone who already pays would bill them for two plans at once.
    // Existing subscribers are sent to Plan & billing, where Creator → Pro
    // switches the subscription they already have (/api/subscription/change-plan).
    // Only expired subscriptions, or cancelled ones past their end date, may
    // start a fresh checkout.
    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    const hasLiveSubscription =
      existing !== null &&
      existing.plan !== "free" &&
      existing.status !== "expired" &&
      !(
        existing.status === "cancelled" &&
        (existing.endsAt === null || existing.endsAt.getTime() <= Date.now())
      );

    if (hasLiveSubscription) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get("plan");
    const intervalParam = searchParams.get("interval");

    if (!isPlanId(plan)) {
      return NextResponse.json(
        { error: "Invalid or missing plan. Use 'creator' or 'creator_pro'." },
        { status: 400 }
      );
    }

    // Default to monthly so existing links without an interval keep working.
    const interval = isBillingInterval(intervalParam)
      ? intervalParam
      : "monthly";

    const variantId = LEMONSQUEEZY_VARIANTS[plan][interval];

    if (!variantId) {
      console.error(
        `[Checkout] No variant configured for plan=${plan} interval=${interval}`
      );
      return NextResponse.json(
        { error: "That billing option isn't available right now." },
        { status: 500 }
      );
    }

    configureLemonSqueezy();

    const checkout = await createCheckout(
      LEMONSQUEEZY_STORE_ID,
      variantId,
      {
        checkoutData: {
          email: user.email,
          custom: {
            user_id: user.id,
            plan,
            interval,
          },
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
        },
      }
    );

    const checkoutUrl = checkout.data?.data.attributes.url;

    if (!checkoutUrl) {
      console.error("[Checkout] No checkout URL returned", checkout);
      return NextResponse.json(
        { error: "Could not create checkout session. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    console.error("[Checkout] Error creating checkout session:", error);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}