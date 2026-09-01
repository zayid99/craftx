"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { usePathname } from "next/navigation";

const TITLE_MATCHERS: [string, string][] = [
  ["/dashboard/settings", "Settings"],
  ["/dashboard", "Dashboard"],
  ["/creator-profile", "Creator Profile"],
  ["/ideas", "Idea Studio"],
  ["/scripts", "Script Studio"],
  ["/seo", "SEO Studio"],
  ["/planner", "Content Planner"],
  ["/analyzer", "Video Analyzer"],
  ["/coach", "Creator Coach"],
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title =
    TITLE_MATCHERS.find(([path]) => pathname.startsWith(path))?.[1] ??
    "Creova";

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-black/10 bg-white px-6">
            <div>
              <p className="text-sm font-medium text-black/50">
                Creator Workspace
              </p>
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-black/5"
              >
                Help
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                Z
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}