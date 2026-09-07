"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteSavedItem, type SavedKind } from "@/lib/saved/actions";

export type { SavedKind };

export interface SavedItem {
  id: string;
  kind: SavedKind;
  title: string;
  subtitle: string;
  tags: string[];
  createdAt: string;
  /** Pre-formatted on the server so this component never parses Json. */
  preview: { label: string; value: string }[];
  href: string;
}

const KIND_META: Record<SavedKind, { label: string; dot: string; chip: string }> = {
  idea: { label: "Idea", dot: "bg-[#3b82f6]", chip: "bg-[#eef4ff] text-[#2563eb]" },
  script: { label: "Script", dot: "bg-[#8b5cf6]", chip: "bg-[#f3eeff] text-[#7c3aed]" },
  seo: { label: "SEO", dot: "bg-[#10b981]", chip: "bg-[#e9f9f0] text-[#059669]" },
  plan: { label: "Plan", dot: "bg-[#f97316]", chip: "bg-[#fff2e8] text-[#ea580c]" },
  analysis: { label: "Analysis", dot: "bg-[#ec4899]", chip: "bg-[#fdeef6] text-[#db2777]" },
};

const FILTERS: { key: SavedKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas" },
  { key: "script", label: "Scripts" },
  { key: "seo", label: "SEO" },
  { key: "plan", label: "Plans" },
  { key: "analysis", label: "Analyses" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffH = Math.floor((Date.now() - d.getTime()) / 3_600_000);

  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function previewToText(item: SavedItem) {
  return [item.title, ...item.preview.map((p) => `${p.label}: ${p.value}`)].join("\n\n");
}

interface SavedListProps {
  items: SavedItem[];
  title?: string;
  description?: string;
  /** Show the type filter pills. Useful on the dashboard, not on a single tool page. */
  showFilters?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyCta?: { label: string; href: string };
  /** Hide the "Open studio" link when the list already lives inside that studio. */
  showOpenStudio?: boolean;
}

export default function SavedList({
  items,
  title = "Your saved work",
  description = "Everything you've saved, newest first.",
  showFilters = false,
  emptyTitle = "Nothing saved yet.",
  emptyBody = "Generate something and hit save — it will collect here so you can come back to it.",
  emptyCta,
  showOpenStudio = true,
}: SavedListProps) {
  const [filter, setFilter] = useState<SavedKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const alive = items.filter((i) => !removed.has(i.id));
  const visible = alive.filter((i) => filter === "all" || i.kind === filter);

  /**
   * Delete is permanent and there's no undo, so it now takes two taps. The
   * buttons sit close together on a phone and a mis-tap used to destroy saved
   * work outright.
   */
  function handleDelete(item: SavedItem) {
    setError(null);

    if (confirmId !== item.id) {
      setConfirmId(item.id);
      window.setTimeout(() => {
        setConfirmId((current) => (current === item.id ? null : current));
      }, 4000);
      return;
    }

    setConfirmId(null);
    startTransition(async () => {
      const res = await deleteSavedItem(item.kind, item.id);
      if (res.ok) {
        setRemoved((prev) => new Set(prev).add(item.id));
        if (openId === item.id) setOpenId(null);
      } else {
        setError(res.error);
      }
    });
  }

  async function handleCopy(item: SavedItem) {
    try {
      await navigator.clipboard.writeText(previewToText(item));
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
  }

  /** Shared button sizing — a taller target below sm:, original size above. */
  const action =
    "rounded-lg px-3 py-2 text-xs font-medium transition sm:px-2.5 sm:py-1.5";

  return (
    <section className="rounded-2xl border border-[#ececf1] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ececf1] px-4 py-4 sm:items-center sm:gap-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-[#6b7280] sm:text-sm">{description}</p>
        </div>

        {showFilters ? (
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            {FILTERS.map((f) => {
              const count =
                f.key === "all" ? alive.length : alive.filter((i) => i.kind === f.key).length;

              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-2 text-[13px] font-medium transition sm:px-3.5 sm:py-1.5 sm:text-sm ${
                    filter === f.key
                      ? "bg-[#0b1020] text-white"
                      : "border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827]"
                  }`}
                >
                  {f.label}
                  <span className={filter === f.key ? "ml-1.5 text-white/50" : "ml-1.5 text-[#9ca3af]"}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <span className="rounded-full bg-[#f4f5f8] px-3 py-1.5 text-sm font-medium text-[#6b7280]">
            {alive.length} saved
          </span>
        )}
      </div>

      {error && (
        <p className="border-b border-[#ececf1] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] sm:px-6">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="text-sm font-medium text-[#374151]">
            {alive.length === 0 ? emptyTitle : "Nothing saved in this category yet."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9ca3af]">{emptyBody}</p>
          {emptyCta && (
            <Link
              href={emptyCta.href}
              className="mt-5 inline-flex rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] sm:py-2.5"
            >
              {emptyCta.label} →
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-[#f1f2f6]">
          {visible.map((item) => {
            const meta = KIND_META[item.kind];
            const isOpen = openId === item.id;
            const isConfirming = confirmId === item.id;

            return (
              <li key={item.id} className="px-4 py-4 sm:px-6">
                {/* The action row was shrink-0 beside a min-w-0 flex-1 title.
                    Four buttons come to ~248px, which left under 50px for the
                    title on a phone — so it collapsed instead of wrapping.
                    Stack the two below sm: and let the buttons wrap. */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />

                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words text-sm font-medium text-[#111827] sm:truncate">
                          {item.title}
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                          {meta.label}
                        </span>
                      </span>

                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#9ca3af]">
                        <span className="truncate">{item.subtitle}</span>
                        <span>·</span>
                        <span>{formatDate(item.createdAt)}</span>
                        {item.tags.map((t) => (
                          <span key={t} className="rounded bg-[#f4f5f8] px-1.5 py-0.5 text-[#6b7280]">
                            {t}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>

                  <div className="-mx-1 flex flex-wrap items-center gap-1 sm:mx-0 sm:shrink-0 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className={`${action} text-[#6b7280] hover:bg-[#f4f5f8] hover:text-[#111827]`}
                    >
                      {isOpen ? "Hide" : "View"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className={`${action} text-[#6b7280] hover:bg-[#f4f5f8] hover:text-[#111827]`}
                    >
                      {copiedId === item.id ? "Copied ✓" : "Copy"}
                    </button>

                    {showOpenStudio && (
                      <Link
                        href={item.href}
                        className={`${action} text-[#6b7280] hover:bg-[#f4f5f8] hover:text-[#111827]`}
                      >
                        Open studio
                      </Link>
                    )}

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(item)}
                      aria-label={
                        isConfirming ? `Confirm delete ${item.title}` : `Delete ${item.title}`
                      }
                      className={`${action} disabled:opacity-50 ${
                        isConfirming
                          ? "bg-[#fef2f2] text-[#b91c1c]"
                          : "text-[#9ca3af] hover:bg-[#fef2f2] hover:text-[#b91c1c]"
                      }`}
                    >
                      {isConfirming ? "Tap to confirm" : "Delete"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-3 rounded-xl bg-[#fafafc] p-3.5 sm:p-4">
                    {item.preview.map((p) => (
                      <div key={p.label}>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                          {p.label}
                        </p>
                        <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-[#374151]">
                          {p.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}