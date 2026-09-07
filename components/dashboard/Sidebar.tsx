"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeIcon,
  LightbulbIcon,
  FileTextIcon,
  SearchIcon,
  PlayCircleIcon,
  CalendarIcon,
  UserIcon,
  SettingsIcon,
  PlusIcon,
} from "@/components/marketing/landing-icons";

type PlanId = "free" | "creator" | "creator_pro";

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free plan",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

/** Shown on the sidebar plan card — copy only, no entitlement logic here. */
const PLAN_PERKS: Record<PlanId, string[]> = {
  free: ["Higher usage limits", "Advanced insights", "Priority support"],
  creator: ["Full studio access", "More projects", "Priority processing"],
  creator_pro: ["Unlimited projects", "Advanced insights", "Priority support"],
};

function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 8.5 6.5 12 12 5l5.5 7L21 8.5V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

// Creator Coach removed pre-launch — it ran on Claude Sonnet and accounted for
// ~95% of projected API cost. The route and page still exist but are gated by
// COACH_ENABLED; re-add the nav entry here when the Coach comes back.
const mainNav = [
  { name: "Home", href: "/dashboard", Icon: HomeIcon },
  { name: "Idea Studio", href: "/ideas", Icon: LightbulbIcon },
  { name: "Script Studio", href: "/scripts", Icon: FileTextIcon },
  { name: "SEO Studio", href: "/seo", Icon: SearchIcon },
  { name: "Script Analyzer", href: "/analyzer", Icon: PlayCircleIcon },
  { name: "Content Planner", href: "/planner", Icon: CalendarIcon },
];

const accountNav = [
  { name: "Creator Profile", href: "/creator-profile", Icon: UserIcon },
  { name: "Settings", href: "/dashboard/settings", Icon: SettingsIcon },
  { name: "Help & Support", href: "/help", Icon: PlusIcon },
];

/**
 * Rendered in two places:
 *   - desktop: a fixed column in WorkspaceShell (>= md)
 *   - mobile:  inside the slide-in drawer owned by Topbar (< md)
 *
 * `onNavigate` is only passed by the drawer. It fires on every link tap so the
 * drawer closes itself — without it, tapping a studio navigates behind an
 * overlay that stays open.
 */
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [plan, setPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/subscription/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.plan) setPlan(d.plan as PlanId);
      })
      .catch(() => {
        /* sidebar still renders without the plan card */
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderLink(item: { name: string; href: string; Icon: typeof HomeIcon }) {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-[#0b1020] text-white"
            : "text-[#6b7280] hover:bg-[#f4f5f8] hover:text-[#111827]"
        }`}
      >
        <item.Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  }

  return (
    /* h-full, not h-screen: inside the drawer the parent already sets the
       height, and h-screen there overflows past the bottom of the viewport
       on browsers with a dynamic URL bar. */
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-[#ececf1] bg-white">
      {/* logo */}
      <div className="flex h-[60px] shrink-0 items-center px-5 md:h-[72px]">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center">
          <Image
            src="/brand/craftx-logo.png"
            alt="CRAFTX"
            width={1780}
            height={356}
            priority
            className="h-[26px] w-auto"
          />
        </Link>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">{mainNav.map(renderLink)}</div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#9ca3af]">
          Account
        </p>
        <div className="space-y-1">{accountNav.map(renderLink)}</div>
      </nav>

      {/* plan card */}
      <div className="shrink-0 p-3">
        {plan ? (
          <div
            className="rounded-2xl p-4 text-white"
            style={{
              backgroundImage: "linear-gradient(150deg,#0b1020 0%,#191f38 55%,#3a2f7a 100%)",
            }}
          >
            <div className="flex items-center gap-2">
              <CrownIcon className="h-[18px] w-[18px] text-[#f5b544]" />
              <div className="min-w-0">
                <p className="text-[11px] leading-4 text-white/50">
                  {plan === "free" ? "Upgrade to" : "You're on"}
                </p>
                <p className="truncate text-[15px] font-semibold leading-5">
                  {plan === "free" ? "Creator Pro" : PLAN_LABELS[plan]}
                </p>
              </div>
            </div>

            <ul className="mt-3.5 space-y-1.5">
              {PLAN_PERKS[plan].map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-xs text-[#c8ccdb]">
                  <span className="text-[#5eead4]">✓</span>
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/settings"
              onClick={onNavigate}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-white/90"
            >
              {plan === "free" ? "Upgrade now" : "Manage plan"}
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <div className="h-[186px] animate-pulse rounded-2xl bg-[#f4f5f8]" />
        )}
      </div>
    </aside>
  );
}