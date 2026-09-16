"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Creator → Creator Pro upgrade for users who already have a subscription.
 * Two steps on purpose: this charges money immediately, so the first click
 * only explains what will happen and the second one does it.
 */
export default function UpgradeToProButton({
  onUpgraded,
}: {
  onUpgraded?: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscription/change-plan", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(data.message || "You're now on Creator Pro.");
      setConfirming(false);
      onUpgraded?.();
      // Server components (dashboard, sidebar plan fetch) pick up the new plan.
      router.refresh();
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="rounded-xl border border-[#d1fae5] bg-[#ecfdf5] p-3 text-sm text-[#065f46]">
        {success}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] sm:w-auto sm:py-2.5"
        >
          Upgrade to Creator Pro <span aria-hidden>→</span>
        </button>
      ) : (
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f7f8fa] p-4">
          <p className="text-sm font-medium text-[#111827]">Switch to Creator Pro?</p>
          <p className="mt-1 text-sm leading-6 text-[#6b7280]">
            Your current subscription will change to Creator Pro on the same
            billing cycle. You&apos;ll be charged the prorated difference today.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-60"
            >
              {loading ? "Upgrading..." : "Confirm upgrade"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[#b91c1c]">{error}</p>}
    </div>
  );
}