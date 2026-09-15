"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FeedbackType = "bug" | "feature" | "complaint" | "other";

const TYPES: { id: FeedbackType; label: string; placeholder: string }[] = [
  { id: "bug", label: "Bug", placeholder: "What happened, and what did you expect to happen?" },
  { id: "feature", label: "Feature", placeholder: "What would you like CraftX to do, and how would it help you?" },
  { id: "complaint", label: "Complaint", placeholder: "What went wrong? Honest details help me fix it." },
  { id: "other", label: "Other", placeholder: "Anything else on your mind about CraftX." },
];

const MIN_LENGTH = 5;
const MAX_LENGTH = 5000;

/**
 * Mount this only while it's open:  {feedbackOpen && <FeedbackModal ... />}
 * Unmounting on close resets the form, so there's no reset logic here.
 *
 * Rendered through a portal to document.body because the sidebar also lives
 * inside the mobile drawer — a transformed ancestor there would trap `fixed`
 * positioning inside the drawer instead of covering the screen.
 */
export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the latest onClose without re-running the setup effect below —
  // re-running it would steal focus from the textarea mid-typing.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  const current = TYPES.find((t) => t.id === type) ?? TYPES[0];
  const canSend = message.trim().length >= MIN_LENGTH && status !== "sending";

  async function handleSubmit() {
    if (!canSend) return;
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, pageUrl: window.location.href }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Could not send feedback. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("sent");
    } catch {
      setError("Network error. Check your connection and try again.");
      setStatus("idle");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      // mousedown + target check: a text selection that ends on the backdrop
      // shouldn't close the modal and lose what the user typed.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        tabIndex={-1}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl outline-none sm:max-w-[480px] sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="feedback-title" className="text-lg font-semibold text-[#111827]">
              Send feedback
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Found a bug or have an idea? I read every message.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-[#9ca3af] transition hover:bg-[#f4f5f8] hover:text-[#111827]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === "sent" ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ecfdf5] text-xl text-[#059669]">
              ✓
            </div>
            <p className="mt-4 font-semibold text-[#111827]">Thanks, got it.</p>
            <p className="mt-1 text-sm text-[#6b7280]">
              Your feedback helps shape what CraftX builds next.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-xl bg-[#0b1020] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a2140]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm font-medium text-[#111827]">What&apos;s this about?</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPES.map((t) => {
                const active = t.id === type;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    aria-pressed={active}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "border-[#0b1020] bg-[#0b1020] text-white"
                        : "border-[#ececf1] text-[#6b7280] hover:bg-[#f4f5f8] hover:text-[#111827]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <label
              htmlFor="feedback-message"
              className="mt-5 block text-sm font-medium text-[#111827]"
            >
              Details
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={5}
              placeholder={current.placeholder}
              className="mt-2 w-full resize-none rounded-xl border border-[#ececf1] px-3.5 py-3 text-[16px] text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1020] sm:text-sm"
            />
            <div className="mt-1 flex justify-between gap-3 text-xs text-[#9ca3af]">
              <span>Your current page and browser are included automatically.</span>
              <span className="shrink-0">
                {message.length}/{MAX_LENGTH}
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-[#fef2f2] px-3.5 py-2.5 text-sm text-[#b91c1c]"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#ececf1] px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f4f5f8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                className="rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a2140] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}