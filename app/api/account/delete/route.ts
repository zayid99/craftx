import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Permanently delete the signed-in user's account.
 *
 * There are no Prisma relations between these models (auth lives in Supabase),
 * so nothing cascades automatically — every table holding a userId has to be
 * cleared explicitly. If a new model with a userId is added to the schema, it
 * MUST be added here too, or its rows are orphaned after deletion and the
 * privacy policy's deletion promise stops being true.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Confirm the typed email matches the account, so a stray click can't do this.
    const body = await request.json().catch(() => ({}));
    const typed = typeof body.confirmEmail === "string" ? body.confirmEmail : "";

    if (
      !user.email ||
      typed.trim().toLowerCase() !== user.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "The email you typed doesn't match this account." },
        { status: 400 }
      );
    }

    // Refuse while billing is still live — deleting the record would leave
    // Lemon Squeezy charging a card for an account that no longer exists.
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    const billingIsLive =
      subscription &&
      subscription.plan !== "free" &&
      subscription.status === "active" &&
      !subscription.endsAt;

    if (billingIsLive) {
      return NextResponse.json(
        {
          error:
            "Cancel your subscription first. Once it's cancelled you can delete your account, and you'll keep access until the end of the period you've paid for.",
          subscriptionActive: true,
        },
        { status: 409 }
      );
    }

    // Wipe the application data first. If the auth deletion below fails, the
    // user can sign in and retry; the reverse order would strand their rows.
    await prisma.$transaction([
      prisma.savedIdea.deleteMany({ where: { userId: user.id } }),
      prisma.savedScript.deleteMany({ where: { userId: user.id } }),
      prisma.savedSEO.deleteMany({ where: { userId: user.id } }),
      prisma.savedContentPlan.deleteMany({ where: { userId: user.id } }),
      prisma.videoAnalysis.deleteMany({ where: { userId: user.id } }),
      prisma.coachMessage.deleteMany({ where: { userId: user.id } }),
      prisma.usageEvent.deleteMany({ where: { userId: user.id } }),
      prisma.creatorProfile.deleteMany({ where: { userId: user.id } }),
      prisma.subscription.deleteMany({ where: { userId: user.id } }),
    ]);

    // Remove the auth user itself.
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Account deletion: auth user removal failed", deleteError);
      return NextResponse.json(
        {
          error:
            "Your saved work was removed, but the login could not be deleted. Please contact support so we can finish this.",
        },
        { status: 500 }
      );
    }

    // Clear the session cookie so the browser isn't left holding a dead token.
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Could not delete your account right now. Please try again." },
      { status: 500 }
    );
  }
}
