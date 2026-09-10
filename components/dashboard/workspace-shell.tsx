import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar, { type Notice } from "@/components/dashboard/topbar";

/**
 * Shared chrome for every signed-in page. Both app/(main)/layout.tsx and
 * app/dashboard/layout.tsx render this so the sidebar and topbar stay
 * identical across the whole workspace.
 *
 * Below md the sidebar column is hidden and Topbar renders the same Sidebar
 * inside a slide-in drawer instead. Don't remove one without the other — the
 * studios have no other entry point on a phone.
 */
export default async function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [profile, plan, ideaCount, scriptCount] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
    prisma.savedIdea.count({ where: { userId: user.id } }),
    prisma.savedScript.count({ where: { userId: user.id } }),
  ]);

  /* ---- Notifications derived from real account state ---- */
  const notices: Notice[] = [];

  if (!profile) {
    notices.push({
      id: "no-profile",
      title: "Set up your creator profile",
      body: "Every studio uses it to tailor what it generates for you.",
      href: "/creator-profile",
      tone: "warn",
    });
  } else {
    const checks = [
      profile.creatorName,
      profile.niche,
      profile.primaryPlatform,
      profile.contentFormat,
      profile.audience,
      profile.targetMarket,
      profile.experienceLevel,
      profile.goals,
      profile.contentStyle,
      profile.contentPillars.length ? "x" : "",
    ];
    const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    if (pct < 100) {
      notices.push({
        id: "profile-incomplete",
        title: `Your profile is ${pct}% complete`,
        body: "Filling the rest sharpens every recommendation.",
        href: "/creator-profile",
        tone: "info",
      });
    }
  }

  if (ideaCount === 0) {
    notices.push({
      id: "no-ideas",
      title: "You haven't saved any ideas yet",
      body: "Generate a batch in Idea Studio to get started.",
      href: "/ideas",
      tone: "info",
    });
  } else if (scriptCount === 0) {
    notices.push({
      id: "no-scripts",
      title: "Turn a saved idea into a script",
      body: `You have ${ideaCount} saved ${ideaCount === 1 ? "idea" : "ideas"} waiting.`,
      href: "/scripts",
      tone: "info",
    });
  }

  if (plan === "free") {
    notices.push({
      id: "free-plan",
      title: "You're on the Free plan",
      body: "Upgrade for higher limits and priority processing.",
      href: "/dashboard/settings",
      tone: "info",
    });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#111827]">
      <div className="flex">
        {/* The sticky/height wrapper lives here rather than on the aside, so
            the same Sidebar can also render inside Topbar's mobile drawer.

            cx-desktop-only is plain CSS from globals.css, not a Tailwind
            utility. Both `hidden md:block` and `block max-md:hidden` failed
            in this build — the sidebar stayed gone at every width — so this
            deliberately uses a class that carries its own media query and
            competes with nothing. Don't "simplify" it back to Tailwind
            without checking the sidebar still renders on desktop. */}
        <div className="cx-desktop-only sticky top-0 h-screen shrink-0">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar email={user.email ?? "Creator"} plan={plan} notices={notices} />
          <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}