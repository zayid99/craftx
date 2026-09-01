import { NextResponse } from "next/server";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { configureLemonSqueezy } from "@/lib/payments/lemonsqueezy";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to cancel your subscription." },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription || !subscription.lemonSqueezySubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found to cancel." },
        { status: 404 }
      );
    }

    if (subscription.plan === "free") {
      return NextResponse.json(
        { error: "You're already on the Free plan." },
        { status: 400 }
      );
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json(
        { error: "Your subscription is already cancelled." },
        { status: 400 }
      );
    }

    configureLemonSqueezy();

    const result = await cancelSubscription(
      subscription.lemonSqueezySubscriptionId
    );

    if (result.error) {
      console.error("[Cancel] Lemon Squeezy error:", result.error);
      return NextResponse.json(
        { error: "Could not cancel your subscription. Please try again or contact support." },
        { status: 502 }
      );
    }

    // Lemon Squeezy marks the subscription "cancelled" immediately, but access
    // remains valid until the period end date it returns. We mirror that
    // status locally now; the webhook (subscription_updated) will also fire
    // and confirm/refresh this, but we update eagerly so the UI reflects it
    // without waiting on the webhook round-trip.
    const attributes = result.data?.data.attributes;

    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: "cancelled",
        endsAt: attributes?.ends_at ? new Date(attributes.ends_at) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your subscription has been cancelled. You'll keep access until the end of your current billing period.",
      endsAt: attributes?.ends_at ?? null,
    });
  } catch (error) {
    console.error("[Cancel] Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}