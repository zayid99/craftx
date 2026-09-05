import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import type { SavedItem } from "@/components/dashboard/saved-list";
import ContentPlanner, { type IdeaOption } from "./content-planner";

export const dynamic = "force-dynamic";

/** days is Json (PlanDay[]) — summarise safely for the saved preview. */
function daysToText(value: unknown): string {
  if (!Array.isArray(value)) return "—";
  const lines = value.slice(0, 5).map((d) => {
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>;
      const day = typeof o.day === "number" ? `Day ${o.day}` : "";
      const topic = typeof o.topic === "string" ? o.topic : "";
      const format = typeof o.format === "string" ? ` (${o.format})` : "";
      return [day, topic].filter(Boolean).join(": ") + format;
    }
    return String(d);
  });
  const extra = value.length > 5 ? `\n+${value.length - 5} more days` : "";
  return lines.join("\n") + extra;
}

export default async function ContentPlannerPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [profile, plan, saved, ideas] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
    prisma.savedContentPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // "Ideas to plan" rail — real saved ideas.
    prisma.savedIdea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const savedItems: SavedItem[] = saved.map((p) => ({
    id: p.id,
    kind: "plan",
    title: `${p.durationDays}-day plan · ${p.niche}`,
    subtitle: p.platform,
    tags: p.pillars.slice(0, 3),
    createdAt: p.createdAt.toISOString(),
    href: "/planner",
    preview: [
      ...(p.goals ? [{ label: "Goals", value: p.goals }] : []),
      { label: "Pillars", value: p.pillars.join(", ") || "—" },
      { label: "Schedule", value: daysToText(p.days) },
    ],
  }));

  const ideaOptions: IdeaOption[] = ideas.map((i) => ({
    id: i.id,
    title: i.title,
    platform: i.platform,
    niche: i.niche,
  }));

  return (
    <ContentPlanner
      savedItems={savedItems}
      ideaOptions={ideaOptions}
      plan={plan}
      defaultNiche={profile?.niche ?? ""}
      defaultPlatform={profile?.primaryPlatform ?? ""}
      defaultGoals={profile?.goals ?? ""}
    />
  );
}