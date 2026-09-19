"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYOUT_METHODS, getPayoutMethod, payoutMethodLabel } from "@/lib/referrals/payout-methods";
import type {
  getAffiliateSummary,
  CommissionDisplayStatus,
} from "@/lib/referrals/affiliate";

type AffiliateSummary = Awaited<ReturnType<typeof getAffiliateSummary>>;

interface Props {
  summary: AffiliateSummary;
  link: string;
}

function formatUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Fixed locale and time zone so the server render and the browser render
// produce the same text (otherwise React warns about a hydration mismatch).
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_STYLE: Record<CommissionDisplayStatus, { label: string; className: string }> = {
  pending: { label: "On hold", className: "bg-[#fff7e6] text-[#b45309]" },
  available: { label: "Available", className: "bg-[#e9f9f0] text-[#059669]" },
  in_payout: { label: "Payout requested", className: "bg-[#eef4ff] text-[#3b82f6]" },
  paid: { label: "Paid", className: "bg-[#f4f5f8] text-[#374151]" },
  void: { label: "Refunded", className: "bg-[#fef2f2] text-[#b91c1c]" },
};

const PAYOUT_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-[#eef4ff] text-[#3b82f6]" },
  paid: { label: "Paid", className: "bg-[#e9f9f0] text-[#059669]" },
  rejected: { label: "Rejected", className: "bg-[#fef2f2] text-[#b91c1c]" },
};

export default function AffiliateDashboard({ summary, link }: Props) {
  const { code, stats, earnings, terms, recentCommissions, openPayout, lastPayoutMethod, payouts } =
    summary;
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Payout form. Pre-filled with whatever the affiliate used last time, as long
  // as that method is still offered.
  const initialMethod =
    lastPayoutMethod && getPayoutMethod(lastPayoutMethod.method)
      ? lastPayoutMethod.method
      : PAYOUT_METHODS[0].id;
  const [payoutMethod, setPayoutMethod] = useState(initialMethod);
  const [payoutDetails, setPayoutDetails] = useState(
    lastPayoutMethod && lastPayoutMethod.method === initialMethod ? lastPayoutMethod.details : ""
  );
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const selectedMethod = getPayoutMethod(payoutMethod) ?? PAYOUT_METHODS[0];
  const canRequest = !openPayout && earnings.availableCents >= terms.minPayoutCents;

  async function handleRequestPayout() {
    setPayoutError(null);

    // Same check the server runs, so obvious typos are caught instantly.
    if (!selectedMethod.pattern.test(payoutDetails.trim())) {
      setPayoutError(selectedMethod.invalidMessage);
      return;
    }

    setRequesting(true);
    try {
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: payoutMethod, details: payoutDetails }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPayoutError(data.error || "Could not submit your payout request. Please try again.");
        return;
      }

      // Reload the server-rendered summary so balances and history update.
      router.refresh();
    } catch {
      setPayoutError("Could not submit your payout request. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  async function handleCopy(text: string, what: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(null);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopyError("Your browser blocked clipboard access. Select the link and copy it manually.");
    }
  }

  const payoutProgress = Math.min(100, (earnings.availableCents / terms.minPayoutCents) * 100);

  const earningCards = [
    {
      label: "On hold",
      value: earnings.pendingCents,
      hint: `Released ${terms.holdDays} days after each payment`,
      accent: "text-[#b45309]",
    },
    {
      label: "Available",
      value: earnings.availableCents,
      hint: "Ready to withdraw",
      accent: "text-[#059669]",
    },
    {
      label: "In payout",
      value: earnings.inPayoutCents,
      hint: "Requested, being processed",
      accent: "text-[#3b82f6]",
    },
    {
      label: "Paid out",
      value: earnings.paidCents,
      hint: "Sent to you so far",
      accent: "text-[#111827]",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4 sm:space-y-6">
      {/* header */}
      <div>
        <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
          AFFILIATE PROGRAM
        </span>

        <h2 className="mt-3 text-2xl font-bold tracking-[-0.5px] text-[#111827] sm:mt-4 sm:text-3xl md:text-4xl">
          Share CraftX, earn{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
          >
            {terms.ratePercent}%
          </span>
          <span className="text-[#6d5cf5]">.</span>
        </h2>

        <p className="mt-2 text-[15px] text-[#6b7280] sm:text-base">
          When someone signs up with your link and subscribes, you earn {terms.ratePercent}% of
          every payment they make for their first {terms.durationMonths} months.
        </p>
      </div>

      {/* link card */}
      <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
        <label htmlFor="affiliate-link" className="block text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
          Your referral link
        </label>
        <p className="mt-1 text-sm text-[#6b7280]">
          Put it in your video descriptions, bio or posts.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            id="affiliate-link"
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="w-full min-w-0 rounded-xl border border-[#e5e7eb] bg-[#fafafc] px-3.5 py-3 text-[16px] text-[#111827] outline-none sm:py-2.5 sm:text-sm"
          />
          <button
            type="button"
            onClick={() => handleCopy(link, "link")}
            className="shrink-0 rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] sm:py-2.5"
          >
            {copied === "link" ? "Copied ✓" : "Copy link"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#6b7280]">
          <span>Your code:</span>
          <button
            type="button"
            onClick={() => handleCopy(code, "code")}
            className="rounded-lg border border-[#e5e7eb] px-2.5 py-1 font-mono text-[13px] text-[#111827] transition hover:bg-[#f7f8fa]"
          >
            {copied === "code" ? "Copied ✓" : code}
          </button>
        </div>

        {copyError && (
          <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {copyError}
          </p>
        )}
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
          <p className="text-sm text-[#6b7280]">Signups</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">{stats.signups}</p>
          <p className="mt-1 text-xs text-[#9ca3af]">People who created an account with your link</p>
        </div>
        <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
          <p className="text-sm text-[#6b7280]">Paying customers</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">
            {stats.payingCustomers}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Signups who went on to subscribe</p>
        </div>
      </div>

      {/* earnings */}
      <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">Earnings</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {earningCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[#f1f2f6] bg-[#fafafc] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold tracking-tight ${card.accent}`}>
                {formatUsd(card.value)}
              </p>
              <p className="mt-1 text-xs text-[#9ca3af]">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#f1f2f6] pt-4">
          {openPayout ? (
            /* A request is already waiting to be sent. */
            <div className="rounded-xl border border-[#dbe6ff] bg-[#f5f8ff] p-4">
              <p className="text-sm font-medium text-[#111827]">
                Payout of {formatUsd(openPayout.amountCents)} requested on{" "}
                {formatDate(openPayout.requestedAt)}
              </p>
              <p className="mt-1 break-all text-sm text-[#6b7280]">
                {payoutMethodLabel(openPayout.method)} · {openPayout.details}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                It&apos;s waiting to be sent. It&apos;ll show as paid below once it&apos;s on its way.
              </p>
            </div>
          ) : canRequest ? (
            /* Enough available: show the request form. */
            <div>
              <p className="text-sm font-medium text-[#111827]">
                Withdraw {formatUsd(earnings.availableCents)}
              </p>

              <fieldset className="mt-3">
                <legend className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Payout method
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PAYOUT_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition ${
                        payoutMethod === m.id
                          ? "border-[#c9c6f6] bg-[#f7f6ff] text-[#111827]"
                          : "border-[#e5e7eb] text-[#374151] hover:bg-[#fafafc]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payout-method"
                        value={m.id}
                        checked={payoutMethod === m.id}
                        onChange={() => {
                          setPayoutMethod(m.id);
                          setPayoutDetails("");
                          setPayoutError(null);
                        }}
                        className="accent-[#6856fd]"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label
                htmlFor="payout-details"
                className="mb-1.5 mt-4 block text-sm font-medium text-[#374151]"
              >
                {selectedMethod.detailsLabel}
              </label>
              <input
                id="payout-details"
                type="text"
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={selectedMethod.placeholder}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 font-mono text-[16px] outline-none transition focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm"
              />

              <p className="mt-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm leading-6 text-[#92400e]">
                Double-check the address and network. Crypto payments can&apos;t be reversed, and
                money sent to a wrong address or network is lost.
              </p>

              {payoutError && (
                <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                  {payoutError}
                </p>
              )}

              <button
                type="button"
                onClick={handleRequestPayout}
                disabled={requesting}
                className="mt-4 w-full rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:w-auto sm:py-2.5"
              >
                {requesting ? "Submitting…" : `Request ${formatUsd(earnings.availableCents)} payout`}
              </button>
            </div>
          ) : (
            /* Not enough yet: show progress to the minimum. */
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#374151]">
                  {formatUsd(earnings.availableCents)} of {formatUsd(terms.minPayoutCents)} minimum payout
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f1f2f6]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${payoutProgress}%`,
                    backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)",
                  }}
                />
              </div>
              <p className="mt-3 text-sm text-[#6b7280]">
                Reach {formatUsd(terms.minPayoutCents)} available to request a payout in USDT.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* payout history */}
      {payouts.length > 0 && (
        <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
            Payout history
          </h3>
          <div className="mt-3 divide-y divide-[#f1f2f6]">
            {payouts.map((p) => {
              const style = PAYOUT_STATUS_STYLE[p.status] ?? {
                label: p.status,
                className: "bg-[#f4f5f8] text-[#374151]",
              };
              return (
                <div key={p.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111827]">{formatUsd(p.amountCents)}</p>
                      <p className="text-xs text-[#9ca3af]">
                        Requested {formatDate(p.requestedAt)}
                        {p.paidAt && ` · paid ${formatDate(p.paidAt)}`} · {payoutMethodLabel(p.method)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
                      {style.label}
                    </span>
                  </div>
                  {p.adminNote && (
                    <p className="mt-1.5 break-all text-xs text-[#6b7280]">Note: {p.adminNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* how it works */}
      <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">How it works</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#374151]">
          <li>
            You earn {terms.ratePercent}% of each payment a referred customer makes, excluding tax,
            for their first {terms.durationMonths} months.
          </li>
          <li>
            Each commission is held for {terms.holdDays} days in case of a refund, then becomes
            available. Refunded payments don&apos;t earn a commission.
          </li>
          <li>
            Only new CraftX accounts count, and they need to sign up within 60 days of clicking your
            link. If someone clicks more than one link, the first one gets the credit.
          </li>
          <li>
            You can withdraw once your available balance reaches {formatUsd(terms.minPayoutCents)}.
            Payouts are sent in USDT to the wallet you choose.
          </li>
          <li>Referring yourself or using fake accounts isn&apos;t allowed.</li>
        </ul>
      </div>

      {/* recent commissions */}
      <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
          Recent commissions
        </h3>

        {recentCommissions.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#9ca3af]">
            No commissions yet. They&apos;ll appear here when someone you referred makes a payment.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-[#f1f2f6]">
            {recentCommissions.map((c) => {
              const style = STATUS_STYLE[c.status];
              return (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{formatUsd(c.amountCents)}</p>
                    <p className="text-xs text-[#9ca3af]">
                      {formatDate(c.createdAt)}
                      {c.status === "pending" && ` · available ${formatDate(c.availableAt)}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}