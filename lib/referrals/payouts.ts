import { prisma } from "@/lib/db/prisma";
import { MIN_PAYOUT_CENTS } from "@/lib/referrals/affiliate";
import { getPayoutMethod } from "@/lib/referrals/payout-methods";

type PayoutResult =
  | { ok: true; payoutId: string; amountCents: number }
  | { ok: false; error: string };

/**
 * Creates a payout request for all of the user's available commissions and
 * locks those commissions to it.
 *
 * Runs in one transaction: if two requests race (double-click, two tabs), the
 * second one fails to claim the commissions and rolls back entirely.
 */
export async function requestPayout(
  userId: string,
  methodId: string,
  rawDetails: string
): Promise<PayoutResult> {
  const method = getPayoutMethod(methodId);
  if (!method) return { ok: false, error: "Please choose a payout method." };

  const details = rawDetails.trim();
  if (!method.pattern.test(details)) return { ok: false, error: method.invalidMessage };

  return prisma.$transaction(async (tx) => {
    const open = await tx.payout.findFirst({ where: { userId, status: "requested" } });
    if (open) {
      return { ok: false as const, error: "You already have a payout request in progress." };
    }

    const available = await tx.commission.findMany({
      where: {
        referrerUserId: userId,
        status: { in: ["pending", "available"] },
        payoutId: null,
        availableAt: { lte: new Date() },
      },
      select: { id: true, commissionCents: true },
    });

    const amountCents = available.reduce((sum, c) => sum + c.commissionCents, 0);
    if (amountCents < MIN_PAYOUT_CENTS) {
      return {
        ok: false as const,
        error: `You need at least $${(MIN_PAYOUT_CENTS / 100).toFixed(2)} available to request a payout.`,
      };
    }

    const payout = await tx.payout.create({
      data: { userId, amountCents, method: method.id, details },
    });

    const claimed = await tx.commission.updateMany({
      where: { id: { in: available.map((c) => c.id) }, payoutId: null },
      data: { payoutId: payout.id },
    });

    if (claimed.count !== available.length) {
      // Another request claimed some of these first. Throwing rolls back the
      // payout we just created.
      throw new Error("Commissions changed while the payout was being requested.");
    }

    return { ok: true as const, payoutId: payout.id, amountCents };
  });
}

type AdminResult = { ok: true } | { ok: false; error: string };

/**
 * Admin: the USDT has been sent. Marks the payout and its commissions as paid.
 * Only works on a payout that is still "requested", so it can't run twice.
 */
export async function markPayoutPaid(payoutId: string, note: string): Promise<AdminResult> {
  const adminNote = note.trim();
  if (!adminNote) {
    return { ok: false, error: "Add the transaction hash so you both have a record." };
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payout.updateMany({
      where: { id: payoutId, status: "requested" },
      data: { status: "paid", paidAt: new Date(), adminNote },
    });
    if (updated.count !== 1) {
      return { ok: false as const, error: "This payout was already processed or doesn't exist." };
    }

    // Commissions refunded after the request stay void; everything else is paid.
    await tx.commission.updateMany({
      where: { payoutId, status: { not: "void" } },
      data: { status: "paid" },
    });

    return { ok: true as const };
  });
}

/**
 * Admin: declines a payout. Its commissions go back to the affiliate's
 * available balance so they can request again.
 */
export async function rejectPayout(payoutId: string, reason: string): Promise<AdminResult> {
  const adminNote = reason.trim();
  if (!adminNote) {
    return { ok: false, error: "Add a reason. The affiliate will see it." };
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payout.updateMany({
      where: { id: payoutId, status: "requested" },
      data: { status: "rejected", adminNote },
    });
    if (updated.count !== 1) {
      return { ok: false as const, error: "This payout was already processed or doesn't exist." };
    }

    await tx.commission.updateMany({
      where: { payoutId, status: { not: "paid" } },
      data: { payoutId: null },
    });

    return { ok: true as const };
  });
}