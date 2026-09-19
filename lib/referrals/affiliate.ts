import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  COMMISSION_RATE,
  COMMISSION_HOLD_DAYS,
  COMMISSION_DURATION_MONTHS,
} from "@/lib/referrals/commissions";

export const MIN_PAYOUT_CENTS = 2500; // $25

// No look-alike characters (0/o, 1/l/i), so codes are easy to read out loud.
// Must stay within the middleware's allowed pattern: /^[a-z0-9-]{3,40}$/
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 8;

function randomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

/** Returns the user's referral code, creating one on first use. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.referralCode.findUnique({ where: { userId } });
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.referralCode.create({
        data: { userId, code: randomCode() },
      });
      return created.code;
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
      // Either another request just created this user's code (use it), or the
      // random code collided with someone else's (try a new one).
      const raced = await prisma.referralCode.findUnique({ where: { userId } });
      if (raced) return raced.code;
    }
  }

  throw new Error("Could not generate a unique referral code.");
}

export type CommissionDisplayStatus = "pending" | "available" | "in_payout" | "paid" | "void";

/**
 * Commissions are stored as "pending" until paid or voided; whether they're
 * withdrawable is worked out from availableAt, so no background job is needed.
 */
function displayStatus(
  c: { status: string; payoutId: string | null; availableAt: Date },
  now: Date
): CommissionDisplayStatus {
  if (c.status === "void") return "void";
  if (c.status === "paid") return "paid";
  if (c.payoutId) return "in_payout";
  if (c.availableAt <= now) return "available";
  return "pending";
}

/**
 * Everything the Affiliate tab shows. Deliberately contains nothing that
 * identifies the referred users — affiliates see counts and amounts only.
 */
export async function getAffiliateSummary(userId: string) {
  const now = new Date();

  const [code, signups, commissions, payouts] = await Promise.all([
    getOrCreateReferralCode(userId),
    prisma.referral.count({ where: { referrerUserId: userId } }),
    prisma.commission.findMany({
      where: { referrerUserId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referredUserId: true,
        commissionCents: true,
        status: true,
        payoutId: true,
        availableAt: true,
        createdAt: true,
      },
    }),
    prisma.payout.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: 10,
      select: {
        id: true,
        amountCents: true,
        method: true,
        details: true,
        status: true,
        adminNote: true,
        requestedAt: true,
        paidAt: true,
      },
    }),
  ]);

  const payoutHistory = payouts.map((p) => ({
    id: p.id,
    amountCents: p.amountCents,
    method: p.method,
    details: p.details,
    status: p.status,
    adminNote: p.adminNote,
    requestedAt: p.requestedAt.toISOString(),
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
  }));

  const earnings = { pendingCents: 0, availableCents: 0, inPayoutCents: 0, paidCents: 0 };
  const payingCustomers = new Set<string>();

  const withStatus = commissions.map((c) => {
    const status = displayStatus(c, now);
    if (status !== "void") payingCustomers.add(c.referredUserId);
    if (status === "pending") earnings.pendingCents += c.commissionCents;
    if (status === "available") earnings.availableCents += c.commissionCents;
    if (status === "in_payout") earnings.inPayoutCents += c.commissionCents;
    if (status === "paid") earnings.paidCents += c.commissionCents;
    return { ...c, status };
  });

  return {
    code,
    stats: {
      signups,
      payingCustomers: payingCustomers.size,
    },
    earnings,
    terms: {
      ratePercent: Math.round(COMMISSION_RATE * 100),
      durationMonths: COMMISSION_DURATION_MONTHS,
      holdDays: COMMISSION_HOLD_DAYS,
      minPayoutCents: MIN_PAYOUT_CENTS,
    },
    // Only one request can be open at a time (enforced in requestPayout).
    openPayout: payoutHistory.find((p) => p.status === "requested") ?? null,
    // Pre-fills the payout form with the method and address used last time.
    lastPayoutMethod: payoutHistory[0]
      ? { method: payoutHistory[0].method, details: payoutHistory[0].details }
      : null,
    payouts: payoutHistory,
    recentCommissions: withStatus.slice(0, 20).map((c) => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      availableAt: c.availableAt.toISOString(),
      amountCents: c.commissionCents,
      status: c.status,
    })),
  };
}