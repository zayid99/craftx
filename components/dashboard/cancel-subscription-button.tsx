"use client";

import { useState } from "react";

export default function CancelSubscriptionButton({
  onCancelled,
}: {
  onCancelled?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setMessage(data.message);
        onCancelled?.();
      }
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (message) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
        {message}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </p>
      )}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-red-600 underline hover:text-red-800"
        >
          Cancel subscription
        </button>
      ) : (
        <div className="border border-red-200 rounded-md p-4 space-y-3">
          <p className="text-sm text-gray-700">
            Are you sure? You&apos;ll keep access until the end of your current billing period, then your account will move to the Free plan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Cancelling..." : "Yes, cancel"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Never mind
            </button>
          </div>
        </div>
      )}
    </div>
  );
}