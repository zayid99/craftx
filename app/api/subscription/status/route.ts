import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription) {
    return NextResponse.json({
      plan: "free",
      status: "active",
      renewsAt: null,
      endsAt: null,
      isCancelling: false,
    });
  }

  const isCancelling = subscription.status === "cancelled" && !!subscription.endsAt;

  return NextResponse.json({
    plan: subscription.plan,
    status: subscription.status,
    renewsAt: subscription.renewsAt,
    endsAt: subscription.endsAt,
    isCancelling,
  });
}