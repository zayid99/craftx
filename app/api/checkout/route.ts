import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import {
  configureLemonSqueezy,
  LEMONSQUEEZY_STORE_ID,
  LEMONSQUEEZY_VARIANTS,
  PlanId,
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

    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get("plan") as PlanId | null;

    if (!plan || !(plan in LEMONSQUEEZY_VARIANTS)) {
      return NextResponse.json(
        { error: "Invalid or missing plan. Use 'creator' or 'creator_pro'." },
        { status: 400 }
      );
    }

    configureLemonSqueezy();

    const variantId = LEMONSQUEEZY_VARIANTS[plan];

    const checkout = await createCheckout(
      LEMONSQUEEZY_STORE_ID,
      variantId,
      {
        checkoutData: {
          email: user.email,
          custom: {
            user_id: user.id,
            plan,
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
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}