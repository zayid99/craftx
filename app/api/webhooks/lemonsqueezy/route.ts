import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[Webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set.");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (!signature) {
      console.error("[Webhook] Missing x-signature header.");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify the signature using HMAC-SHA256
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

       if (
      digest.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(digest, signatureBuffer)
    ) {
      console.error("[Webhook] Signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName: string = payload.meta?.event_name;
    const customData = payload.meta?.custom_data;
    const attributes = payload.data?.attributes;
    const subscriptionId: string = payload.data?.id;

    if (!eventName || !attributes) {
      console.error("[Webhook] Malformed payload", payload);
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const userId: string | undefined = customData?.user_id;
    const planFromCustomData: string | undefined = customData?.plan;

    console.log(`[Webhook] Received event: ${eventName} for user: ${userId ?? "unknown"}`);

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused": {
        if (!userId) {
          console.error("[Webhook] No user_id in custom_data, cannot update subscription.");
          break;
        }

        const status = mapLemonSqueezyStatus(attributes.status);
        const plan = planFromCustomData ?? inferPlanFromVariant(attributes.variant_id);

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status,
            lemonSqueezyCustomerId: String(attributes.customer_id),
            lemonSqueezySubscriptionId: subscriptionId,
            lemonSqueezyVariantId: String(attributes.variant_id),
            renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
            endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          },
          update: {
            plan,
            status,
            lemonSqueezyCustomerId: String(attributes.customer_id),
            lemonSqueezySubscriptionId: subscriptionId,
            lemonSqueezyVariantId: String(attributes.variant_id),
            renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
            endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          },
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused": {
        const status = mapLemonSqueezyStatus(attributes.status);

        await prisma.subscription.updateMany({
          where: { lemonSqueezySubscriptionId: subscriptionId },
          data: {
            status,
            endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          },
        });
        break;
      }

      case "subscription_payment_success": {
        // Renewal confirmed — refresh renewsAt if present
        await prisma.subscription.updateMany({
          where: { lemonSqueezySubscriptionId: subscriptionId },
          data: {
            status: "active",
          },
        });
        break;
      }

      case "subscription_payment_failed": {
        await prisma.subscription.updateMany({
          where: { lemonSqueezySubscriptionId: subscriptionId },
          data: {
            status: "past_due",
          },
        });
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventName}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function mapLemonSqueezyStatus(status: string): string {
  const validStatuses = [
    "active",
    "cancelled",
    "expired",
    "past_due",
    "paused",
    "unpaid",
    "on_trial",
  ];
  return validStatuses.includes(status) ? status : "active";
}

function inferPlanFromVariant(variantId: number | string): string {
  const id = String(variantId);
  if (id === process.env.LEMONSQUEEZY_VARIANT_CREATOR) return "creator";
  if (id === process.env.LEMONSQUEEZY_VARIANT_CREATOR_PRO) return "creator_pro";
  return "free";
}