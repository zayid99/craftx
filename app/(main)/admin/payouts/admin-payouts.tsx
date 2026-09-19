"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { payoutMethodLabel } from "@/lib/referrals/payout-methods";

export interface AdminPayoutRow {
  id: string;
  userId: string;
  amountCents: number;
  refundedCents: number;
  method: string;
  details: string;
  status: string;
  adminNote: string | null;
  requestedAt: string;
  paidAt: string | null;
}

function formatUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function OpenPayoutCard({ payout }: { payout: AdminPayoutRow }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function act(action: "paid" | "reject") {
    setError(null);
    const confirmText =
      action === "paid"
        ? `Mark ${formatUsd(payout.amountCents)} as PAID? Only do this after the USDT has been sent.`
        : "Reject this payout? The balance goes back to the affiliate.";
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(payout.details);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard blocked. Select the address and copy it manually.");
    }
  }

  const stillOwed = payout.amountCents - payout.refundedCents;

  return (
    <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tracking-tight text-[#111827]">
            {formatUsd(payout.amountCents)}
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">
            {payoutMethodLabel(payout.method)} · requested {formatDate(payout.requestedAt)}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[#9ca3af]">User {payout.userId}</p>
        </div>
      </div>

      {payout.refundedCents > 0 && (
        <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
          {formatUsd(payout.refundedCents)} of this was refunded after the request. Only{" "}
          {formatUsd(stillOwed)} is still owed. Reject it so the affiliate can request the correct
          amount.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          readOnly
          value={payout.details}
          onFocus={(e) => e.target.select()}
          className="w-full min-w-0 rounded-xl border border-[#e5e7eb] bg-[#fafafc] px-3.5 py-3 font-mono text-[16px] text-[#111827] outline-none sm:py-2.5 sm:text-sm"
        />
        <button
          type="button"
          onClick={copyAddress}
          className="shrink-0 rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm font-medium text-[#374151] transition hover:bg-[#f7f8fa] sm:py-2.5"
        >
          {copied ? "Copied ✓" : "Copy address"}
        </button>
      </div>

      <label htmlFor={`note-${payout.id}`} className="mb-1.5 mt-4 block text-sm font-medium text-[#374151]">
        Transaction hash (when paid) or reason (when rejecting)
      </label>
      <input
        id={`note-${payout.id}`}
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] outline-none transition focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm"
      />
      <p className="mt-1.5 text-xs text-[#9ca3af]">The affiliate sees this note in their payout history.</p>

      {error && (
        <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => act("paid")}
          disabled={busy}
          className="rounded-xl bg-[#059669] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#047857] disabled:opacity-50 sm:py-2.5"
        >
          Mark as paid
        </button>
        <button
          type="button"
          onClick={() => act("reject")}
          disabled={busy}
          className="rounded-xl border border-[#fecaca] px-5 py-3 text-sm font-medium text-[#b91c1c] transition hover:bg-[#fef2f2] disabled:opacity-50 sm:py-2.5"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function AdminPayouts({
  open,
  processed,
}: {
  open: AdminPayoutRow[];
  processed: AdminPayoutRow[];
}) {
  const openTotal = open.reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 sm:space-y-6">
      <div>
        <span className="inline-flex rounded-full border border-[#fde68a] bg-[#fffbeb] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#92400e]">
          ADMIN
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.5px] text-[#111827] sm:mt-4 sm:text-3xl">
          Affiliate payouts
        </h2>
        <p className="mt-2 text-[15px] text-[#6b7280]">
          {open.length === 0
            ? "No open requests."
            : `${open.length} open request${open.length === 1 ? "" : "s"} · ${formatUsd(openTotal)} total`}
        </p>
      </div>

      {open.map((p) => (
        <OpenPayoutCard key={p.id} payout={p} />
      ))}

      <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
          Recently processed
        </h3>
        {processed.length === 0 ? (
          <p className="mt-3 text-sm text-[#9ca3af]">Nothing yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-[#f1f2f6]">
            {processed.map((p) => (
              <div key={p.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827]">{formatUsd(p.amountCents)}</p>
                    <p className="text-xs text-[#9ca3af]">
                      {payoutMethodLabel(p.method)} · requested {formatDate(p.requestedAt)}
                      {p.paidAt && ` · paid ${formatDate(p.paidAt)}`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.status === "paid"
                        ? "bg-[#e9f9f0] text-[#059669]"
                        : "bg-[#fef2f2] text-[#b91c1c]"
                    }`}
                  >
                    {p.status === "paid" ? "Paid" : "Rejected"}
                  </span>
                </div>
                {p.adminNote && (
                  <p className="mt-1.5 break-all text-xs text-[#6b7280]">Note: {p.adminNote}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}