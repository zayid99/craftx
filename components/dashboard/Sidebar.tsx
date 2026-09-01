"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PlanBadge from "./plan-badge";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    name: "Creator Profile",
    href: "/creator-profile",
    icon: "◍",
  },
  {
    name: "Idea Studio",
    href: "/ideas",
    icon: "✦",
  },
  {
    name: "Script Studio",
    href: "/scripts",
    icon: "▤",
  },
  {
    name: "SEO Studio",
    href: "/seo",
    icon: "⌕",
  },
  {
    name: "Content Planner",
    href: "/planner",
    icon: "□",
  },
  {
    name: "Video Analyzer",
    href: "/analyzer",
    icon: "▷",
  },
  {
    name: "Creator Coach",
    href: "/coach",
    icon: "✧",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-black/10 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-black/10 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple text-sm font-bold text-white">
            C
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Craft<span className="text-brand-gradient">X</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-black text-white"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <span className="flex w-5 justify-center text-base">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/10 p-4 space-y-1">
        <PlanBadge />

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black"
        >
          <span className="flex w-5 justify-center text-base">⚙</span>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}