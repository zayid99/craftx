import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { isAdmin } from "@/lib/auth/admin";
import AdminPayouts from "./admin-payouts";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  // A plain 404 for everyone else, so the page doesn't reveal it exists.
  if (!isAdmin(user.email)) notFound();

  const [open, processed] = await Promise.all([
    prisma.payout.findMany({
      where: { status: "requested" },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.payout.findMany({
      where: { status: { in: ["paid", "rejected"] } },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
  ]);

  // Commissions refunded after a payout was requested: flag them so you
  // don't send more than is still owed.
  const refunded = open.length
    ? await prisma.commission.groupBy({
        by: ["payoutId"],
        where: { payoutId: { in: open.map((p) => p.id) }, status: "void" },
        _sum: { commissionCents: true },
      })
    : [];
  const refundedByPayout = new Map(
    refunded.map((r) => [r.payoutId, r._sum.commissionCents ?? 0])
  );

  const toRow = (p: (typeof open)[number]) => ({
    id: p.id,
    userId: p.userId,
    amountCents: p.amountCents,
    refundedCents: refundedByPayout.get(p.id) ?? 0,
    method: p.method,
    details: p.details,
    status: p.status,
    adminNote: p.adminNote,
    requestedAt: p.requestedAt.toISOString(),
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
  });

  return <AdminPayouts open={open.map(toRow)} processed={processed.map(toRow)} />;
}