"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { USAGE_UPDATED_EVENT } from "@/components/dashboard/usage-meter";

type TodayIdea = { title: string; angle: string; reason: string };

interface TodayResponse {
  date: string;
  hasProfile: boolean;
  plan: "free" | "creator" | "creator_pro";
  ideas: TodayIdea[] | null;
  autoGenerate: boolean;
  freeRemaining: number | null;
}

type State =
  | { kind: "loading" }
  | { kind: "hidden" }
  | { kind: "generating" }
  | { kind: "idle"; freeRemaining: number }
  | { kind: "ready"; ideas: TodayIdea[] }
  | { kind: "error"; message?: string };

/**
 * Where a picked idea goes next. Script Studio will read ?topic= once the
 * studios are connected; until then the link still opens Script Studio.
 */
function scriptHref(idea: TodayIdea) {
  return `/scripts?topic=${encodeURIComponent(idea.title)}`;
}

export default function TodayIdeas() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const runGenerate = useCallback(async (isCancelled: () => boolean = () => false) => {
    setState({ kind: "generating" });
    try {
      const res = await fetch("/api/today/ideas", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (isCancelled()) return;

      if (res.status === 403 && data.upgradeRequired) {
        setState({ kind: "idle", freeRemaining: 0 });
        return;
      }
      if (!res.ok || !Array.isArray(data.ideas)) {
        setState({ kind: "error", message: data.error });
        return;
      }

      setState({ kind: "ready", ideas: data.ideas });
      window.dispatchEvent(new Event(USAGE_UPDATED_EVENT));
    } catch {
      if (!isCancelled()) setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    // All state updates happen after an await, never synchronously on mount.
    (async () => {
      try {
        const res = await fetch("/api/today/ideas", { cache: "no-store" });
        if (!res.ok) throw new Error("load failed");
        const data: TodayResponse = await res.json();
        if (cancelled) return;

        if (!data.hasProfile) {
          setState({ kind: "hidden" });
        } else if (data.ideas && data.ideas.length > 0) {
          setState({ kind: "ready", ideas: data.ideas });
        } else if (data.autoGenerate) {
          // Paid plans: ideas are unlimited, so today's set is made automatically.
          await runGenerate(isCancelled);
        } else {
          // Free plan: each set spends one-time free ideas — wait for a click.
          setState({ kind: "idle", freeRemaining: data.freeRemaining ?? 0 });
        }
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, runGenerate]);

  if (state.kind === "hidden") return null;

  return (
    <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
          Today&apos;s ideas
        </h3>
        <p className="mt-0.5 text-xs text-[#9ca3af] sm:text-sm">
          Picked for your creator profile. New picks every day.
        </p>
      </div>

      {(state.kind === "loading" || state.kind === "generating") && (
        <div className="mt-4">
          {state.kind === "generating" && (
            <p className="mb-3 text-sm text-[#6b7280]">Picking today&apos;s ideas for you…</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[148px] animate-pulse rounded-xl bg-[#f4f5f8]" />
            ))}
          </div>
        </div>
      )}

      {state.kind === "idle" &&
        (state.freeRemaining > 0 ? (
          <div className="mt-4 rounded-xl bg-[#fafafc] p-4">
            <p className="text-sm leading-6 text-[#374151]">
              Get {Math.min(3, state.freeRemaining)} video{" "}
              {Math.min(3, state.freeRemaining) === 1 ? "idea" : "ideas"} picked for your niche and
              audience.
            </p>
            <p className="mt-1 text-xs text-[#9ca3af]">
              Uses {Math.min(3, state.freeRemaining)} of your {state.freeRemaining} remaining free
              ideas.
            </p>
            <button
              type="button"
              onClick={() => runGenerate()}
              className="mt-4 w-full rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] sm:w-auto sm:py-2.5"
            >
              Get today&apos;s ideas
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-[#fafafc] p-4">
            <p className="text-sm leading-6 text-[#374151]">
              You&apos;ve used your free ideas. Creator includes unlimited ideas, with fresh picks
              waiting here every day.
            </p>
            {/* Plain <a>, not <Link>: Link prefetches, and prefetching the
                checkout route could start a checkout session on page load. */}
            <a
              href="/api/checkout?plan=creator"
              className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] sm:w-auto sm:py-2.5"
            >
              Upgrade to Creator →
            </a>
          </div>
        ))}

      {state.kind === "error" && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#fafafc] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#6b7280]">
            {state.message || "Couldn't load today's ideas."}
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              setReloadKey((k) => k + 1);
            }}
            className="shrink-0 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === "ready" && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {state.ideas.map((idea, i) => (
              <div
                key={`${idea.title}-${i}`}
                className="flex flex-col rounded-xl border border-[#f1f2f6] p-4"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0fb] text-xs font-semibold text-[#6856fd]">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold leading-5 text-[#111827]">{idea.title}</p>
                <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-[#6b7280]">
                  {idea.angle}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#9ca3af]">
                  Why: {idea.reason}
                </p>

                <div className="mt-auto pt-4">
                  {i === 0 ? (
                    <Link
                      href={scriptHref(idea)}
                      className="inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
                    >
                      Start this video →
                    </Link>
                  ) : (
                    <Link
                      href={scriptHref(idea)}
                      className="text-sm font-medium text-[#6856fd] hover:underline"
                    >
                      Write script →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#9ca3af]">Come back tomorrow for new picks.</p>
        </>
      )}
    </div>
  );
}