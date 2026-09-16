import { NextResponse } from "next/server";
import { updateSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import {
  configureLemonSqueezy,
  LEMONSQUEEZY_VARIANTS,
} from "@/lib/payments/lemonsqueezy";
import { prisma } from "@/lib/db/prisma";

/**
 * Upgrades an existing Creator subscription to Creator Pro.
 *
 * Why not /api/checkout? A second checkout creates a SECOND subscription, so
 * the user would be billed for Creator and Pro at the same time. This route
 * switches the variant on the subscription they already have instead.
 *
 * Billing interval is preserved: a monthly Creator becomes monthly Pro, a
 * yearly Creator becomes yearly Pro. invoiceImmediately charges the prorated
 * difference now, so nobody gets Pro for free until their next renewal.
 *
 * The webhook (subscription_updated) resolves the plan from variant_id and
 * will confirm this change; we also update the row eagerly so the UI shows
 * Pro without waiting for the webhook round-trip — same as the cancel route.
 */

// Loose view of the variants map so this route doesn't depend on the exact
// interval key names ("monthly"/"yearly"/...) or on whether IDs are strings
// or numbers.
type VariantMap = Record<string, Record<string, string | number | null | undefined>>;

export async function POST() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to change your plan." },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription || !subscription.lemonSqueezySubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found. Choose a plan to get started." },
        { status: 404 }
      );
    }

    if (subscription.plan === "creator_pro") {
      return NextResponse.json(
        { error: "You're already on Creator Pro." },
        { status: 400 }
      );
    }

    if (subscription.plan !== "creator") {
      return NextResponse.json(
        { error: "Only Creator subscriptions can be upgraded here." },
        { status: 400 }
      );
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json(
        {
          error:
            "Your subscription is set to end. Contact support@craftxapp.com and we'll switch you to Creator Pro.",
        },
        { status: 400 }
      );
    }

    if (subscription.status !== "active" && subscription.status !== "on_trial") {
      return NextResponse.json(
        {
          error:
            "There's a problem with your current payment. Please update your payment method before upgrading.",
        },
        { status: 400 }
      );
    }

    const variants = LEMONSQUEEZY_VARIANTS as unknown as VariantMap;

    // Find which interval the user is on by matching their current variant.
    const interval = Object.keys(variants.creator ?? {}).find(
      (key) =>
        variants.creator[key] != null &&
        String(variants.creator[key]) === subscription.lemonSqueezyVariantId
    );

    const proVariantId = interval ? variants.creator_pro?.[interval] : null;

    if (!interval || proVariantId == null) {
      console.error(
        `[ChangePlan] Could not map variant ${subscription.lemonSqueezyVariantId} ` +
          `(interval: ${interval ?? "unknown"}) to a Creator Pro variant for user ${user.id}.`
      );
      return NextResponse.json(
        {
          error:
            "We couldn't switch your plan automatically. Contact support@craftxapp.com and we'll sort it out.",
        },
        { status: 500 }
      );
    }

    configureLemonSqueezy();

    const result = await updateSubscription(subscription.lemonSqueezySubscriptionId, {
      variantId: Number(proVariantId),
      invoiceImmediately: true,
    });

    if (result.error) {
      console.error("[ChangePlan] Lemon Squeezy error:", result.error);
      return NextResponse.json(
        { error: "Could not change your plan. Please try again or contact support." },
        { status: 502 }
      );
    }

    const attributes = result.data?.data.attributes;

    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: "creator_pro",
        lemonSqueezyVariantId: String(attributes?.variant_id ?? proVariantId),
        ...(attributes?.renews_at ? { renewsAt: new Date(attributes.renews_at) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "You're now on Creator Pro. Your new limits are active.",
    });
  } catch (error) {
    console.error("[ChangePlan] Error changing plan:", error);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}