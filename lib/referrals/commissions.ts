import { prisma } from "@/lib/db/prisma";

// Affiliate program terms. Keep these in sync with any public-facing copy.
export const COMMISSION_RATE = 0.2; // 20%
export const COMMISSION_HOLD_DAYS = 30; // refund window before it can be paid out
export const COMMISSION_DURATION_MONTHS = 12; // recurring for the first 12 months

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Records a commission for a paid invoice from a referred user.
 * Does nothing if the user wasn't referred, the amount is zero, or the
 * 12-month window since their first commission has passed.
 *
 * Safe to call twice for the same invoice (webhook retries): the unique
 * lemonSqueezyInvoiceId means the second call is ignored.
 *
 * Throws on database errors so the webhook returns 500 and Lemon Squeezy retries.
 */
export async function recordCommission(params: {
  referredUserId: string;
  invoiceId: string;
  paymentAmountCents: number;
}): Promise<void> {
  const { referredUserId, invoiceId, paymentAmountCents } = params;

  if (!Number.isFinite(paymentAmountCents) || paymentAmountCents <= 0) return;

  const referral = await prisma.referral.findUnique({ where: { referredUserId } });
  if (!referral) return; // not a referred user

  const firstCommission = await prisma.commission.findFirst({
    where: { referredUserId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (firstCommission) {
    const windowEnd = new Date(firstCommission.createdAt);
    windowEnd.setMonth(windowEnd.getMonth() + COMMISSION_DURATION_MONTHS);
    if (new Date() > windowEnd) {
      console.log(`[Commission] ${referredUserId} is past the ${COMMISSION_DURATION_MONTHS}-month window, invoice ${invoiceId} skipped.`);
      return;
    }
  }

  const commissionCents = Math.round(paymentAmountCents * COMMISSION_RATE);

  try {
    await prisma.commission.create({
      data: {
        referrerUserId: referral.referrerUserId,
        referredUserId,
        lemonSqueezyInvoiceId: invoiceId,
        paymentAmountCents,
        commissionCents,
        availableAt: new Date(Date.now() + COMMISSION_HOLD_DAYS * DAY_MS),
      },
    });
    console.log(`[Commission] ${commissionCents}c for ${referral.referrerUserId} from invoice ${invoiceId}`);
  } catch (error) {
    // P2002 = this invoice already has a commission (webhook retry). Fine.
    if ((error as { code?: string })?.code === "P2002") return;
    throw error;
  }
}

/**
 * Voids the commission for a refunded invoice, unless it was already paid out.
 */
export async function voidCommission(invoiceId: string): Promise<void> {
  const result = await prisma.commission.updateMany({
    where: {
      lemonSqueezyInvoiceId: invoiceId,
      status: { in: ["pending", "available"] },
    },
    data: { status: "void" },
  });

  if (result.count > 0) {
    console.log(`[Commission] Voided commission for refunded invoice ${invoiceId}`);
    return;
  }

  const paid = await prisma.commission.findFirst({
    where: { lemonSqueezyInvoiceId: invoiceId, status: "paid" },
  });
  if (paid) {
    console.warn(
      `[Commission] Invoice ${invoiceId} was refunded but its commission (${paid.id}) was already paid out. Handle manually.`
    );
  }
}