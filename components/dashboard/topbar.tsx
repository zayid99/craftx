"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BellIcon, UserIcon, SettingsIcon } from "@/components/marketing/landing-icons";

const TITLE_MATCHERS: [string, string][] = [
  ["/dashboard/settings", "Settings"],
  ["/dashboard", "Dashboard"],
  ["/creator-profile", "Creator Profile"],
  ["/ideas", "Idea Studio"],
  ["/scripts", "Script Studio"],
  ["/seo", "SEO Studio"],
  ["/planner", "Content Planner"],
  ["/analyzer", "Script Analyzer"],
  ["/coach", "Creator Coach"],
  ["/help", "Help & Support"],
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free plan",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

export interface Notice {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: "info" | "warn";
}

interface Props {
  email: string;
  plan: string;
  /** Derived server-side from real account state — never invented. */
  notices: Notice[];
}

export default function Topbar({ email, plan, notices }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [openMenu, setOpenMenu] = useState<"none" | "notices" | "profile">("none");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const title = TITLE_MATCHERS.find(([p]) => pathname.startsWith(p))?.[1] ?? "CraftX";
  const visible = notices.filter((n) => !dismissed.has(n.id));
  const initial = (email?.[0] ?? "C").toUpperCase();

  // Close either dropdown on outside click or Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenMenu("none");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu("none");
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#ececf1] bg-white px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[1px] text-[#9ca3af]">
          Creator Workspace
        </p>
        <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-[#111827]">{title}</h1>
      </div>

      <div ref={wrapRef} className="flex items-center gap-2">
        {/* notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications${visible.length ? ` (${visible.length} unread)` : ""}`}
            aria-expanded={openMenu === "notices"}
            onClick={() => setOpenMenu(openMenu === "notices" ? "none" : "notices")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#6b7280] transition hover:bg-[#f4f5f8] hover:text-[#111827]"
          >
            <BellIcon className="h-[19px] w-[19px]" />
            {visible.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-semibold text-white">
                {visible.length}
              </span>
            )}
          </button>

          {openMenu === "notices" && (
            <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_20px_50px_rgba(17,19,24,0.12)]">
              <div className="flex items-center justify-between border-b border-[#ececf1] px-4 py-3">
                <p className="text-sm font-semibold text-[#111827]">Notifications</p>
                {visible.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDismissed(new Set(notices.map((n) => n.id)))}
                    className="text-xs font-medium text-[#5b5bd6] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {visible.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[#9ca3af]">
                  You&apos;re all caught up.
                </p>
              ) : (
                <ul className="max-h-[320px] divide-y divide-[#f1f2f6] overflow-y-auto">
                  {visible.map((n) => (
                    <li key={n.id} className="group flex items-start gap-3 px-4 py-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.tone === "warn" ? "bg-[#f97316]" : "bg-[#3b82f6]"
                        }`}
                      />
                      <Link href={n.href} onClick={() => setOpenMenu("none")} className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-[#111827]">{n.title}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#6b7280]">{n.body}</span>
                      </Link>
                      <button
                        type="button"
                        aria-label={`Dismiss ${n.title}`}
                        onClick={() => setDismissed((prev) => new Set(prev).add(n.id))}
                        className="shrink-0 text-xs text-[#d1d5db] transition hover:text-[#6b7280]"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* profile */}
        <div className="relative">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={openMenu === "profile"}
            onClick={() => setOpenMenu(openMenu === "profile" ? "none" : "profile")}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#f4f5f8]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b1020] text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[150px] truncate text-sm font-medium text-[#111827]">
                {email}
              </span>
              <span className="block text-xs text-[#9ca3af]">
                {PLAN_LABELS[plan] ?? "Free plan"}
              </span>
            </span>
            <span className="text-[#9ca3af]">⌄</span>
          </button>

          {openMenu === "profile" && (
            <div className="absolute right-0 top-14 z-50 w-[240px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_20px_50px_rgba(17,19,24,0.12)]">
              <div className="border-b border-[#ececf1] px-4 py-3">
                <p className="truncate text-sm font-medium text-[#111827]">{email}</p>
                <p className="mt-0.5 text-xs text-[#9ca3af]">{PLAN_LABELS[plan] ?? "Free plan"}</p>
              </div>

              <div className="p-1.5">
                <Link
                  href="/creator-profile"
                  onClick={() => setOpenMenu("none")}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[#374151] transition hover:bg-[#f4f5f8]"
                >
                  <UserIcon className="h-4 w-4" />
                  Creator profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpenMenu("none")}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[#374151] transition hover:bg-[#f4f5f8]"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-[#ececf1] p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[#b91c1c] transition hover:bg-[#fef2f2]"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}