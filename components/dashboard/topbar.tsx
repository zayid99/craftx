"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/dashboard/Sidebar";
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

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function Topbar({ email, plan, notices }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [openMenu, setOpenMenu] = useState<"none" | "notices" | "profile">("none");
  const [navOpen, setNavOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  /**
   * Close the drawer when the route changes.
   *
   * This was a useEffect calling setNavOpen(false), which Next 15's
   * react-hooks/set-state-in-effect rule rejects — it fails the production
   * build, not just the linter. Adjusting state during render is React's
   * documented pattern for state derived from a prop or hook value, and it
   * closes the drawer in the same render as the navigation rather than a
   * frame later. https://react.dev/learn/you-might-not-need-an-effect
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (navOpen) setNavOpen(false);
    if (openMenu !== "none") setOpenMenu("none");
  }

  const title = TITLE_MATCHERS.find(([p]) => pathname.startsWith(p))?.[1] ?? "CraftX";
  const visible = notices.filter((n) => !dismissed.has(n.id));
  const initial = (email?.[0] ?? "C").toUpperCase();

  // Close either dropdown on outside click, and everything on Escape.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenMenu("none");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu("none");
        setNavOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Stop the page behind the drawer from scrolling under it. This effect only
  // touches the DOM — no setState — so the rule above doesn't apply to it.
  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Sticky on mobile: the studios scroll a long way and the nav trigger
          has to stay reachable. */}
      <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-[#ececf1] bg-white px-4 sm:px-6 md:h-[72px]">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#374151] transition hover:bg-[#f4f5f8] md:hidden"
          >
            <MenuIcon className="h-[20px] w-[20px]" />
          </button>

          <div className="min-w-0">
            <p className="block max-md:hidden text-xs font-medium uppercase tracking-[1px] text-[#9ca3af]">
              Creator Workspace
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-[#111827] md:mt-0.5 md:text-lg">
              {title}
            </h1>
          </div>
        </div>

        <div ref={wrapRef} className="flex shrink-0 items-center gap-1 sm:gap-2">
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
              /* Clamped to the viewport — a fixed 320px panel hanging off a
                 button near the right edge overflows a 360px screen. */
              <div className="absolute right-0 top-12 z-50 w-[calc(100vw-32px)] max-w-[320px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_20px_50px_rgba(17,19,24,0.12)]">
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
              className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-[#f4f5f8] sm:px-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b1020] text-sm font-semibold text-white">
                {initial}
              </span>
              <span className="block max-lg:hidden text-left">
                <span className="block max-w-[150px] truncate text-sm font-medium text-[#111827]">
                  {email}
                </span>
                <span className="block text-xs text-[#9ca3af]">
                  {PLAN_LABELS[plan] ?? "Free plan"}
                </span>
              </span>
              <span className="inline max-sm:hidden text-[#9ca3af]">⌄</span>
            </button>

            {openMenu === "profile" && (
              <div className="absolute right-0 top-14 z-50 w-[calc(100vw-32px)] max-w-[240px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_20px_50px_rgba(17,19,24,0.12)]">
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

      {/* ============ MOBILE NAV DRAWER ============ */}
      {/* WorkspaceShell hides the sidebar below md. Without this, every studio
          is unreachable on a phone once you're signed in. */}
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            role="presentation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-[#0b1020]/40"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-[248px] flex-col bg-white shadow-[0_0_60px_rgba(17,19,24,0.25)]"
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setNavOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-[#9ca3af] transition hover:bg-[#f4f5f8] hover:text-[#111827]"
            >
              ✕
            </button>

            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}