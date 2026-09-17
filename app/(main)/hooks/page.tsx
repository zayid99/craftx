import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import { readParam, type SearchParams } from "@/lib/search-params";
import type { SavedItem } from "@/components/dashboard/saved-list";
import HooksStudio from "./hooks-studio";

export const dynamic = "force-dynamic";

/** hooks/titles are Json arrays of { text, ... } — pick starred first, else the top 3. */
function linesToText(value: unknown, starred: number[], prefixKey?: string): string {
  if (!Array.isArray(value) || value.length === 0) return "—";

  const indexes = starred.length ? starred : [0, 1, 2];
  const lines = indexes
    .map((i) => value[i])
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .map((o) => {
      const text = typeof o.text === "string" ? o.text : "";
      const prefix = prefixKey && typeof o[prefixKey] === "string" ? `[${o[prefixKey]}] ` : "";
      return text ? `${prefix}${text}` : "";
    })
    .filter(Boolean);

  return lines.length ? lines.join("\n") : "—";
}

export default async function HooksStudioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  // Arriving from Script Studio: /hooks?topic=...&platform=...
  const sp = await searchParams;
  const initialTopic = readParam(sp, "topic", 200);
  const initialPlatform = readParam(sp, "platform", 50);

  const [profile, plan, saved] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
    prisma.savedHookSet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const savedItems: SavedItem[] = saved.map((s) => {
    const starredCount = s.starredHooks.length + s.starredTitles.length;
    return {
      id: s.id,
      kind: "hooks",
      title: s.topic,
      subtitle: s.platform,
      tags: starredCount ? [`${starredCount} starred`] : [],
      createdAt: s.createdAt.toISOString(),
      href: "/hooks",
      preview: [
        {
          label: s.starredHooks.length ? "Starred hooks" : "Hooks",
          value: linesToText(s.hooks, s.starredHooks, "style"),
        },
        {
          label: s.starredTitles.length ? "Starred titles" : "Titles",
          value: linesToText(s.titles, s.starredTitles),
        },
      ],
    };
  });

  return (
    <HooksStudio
      savedItems={savedItems}
      plan={plan}
      defaultAudience={profile?.audience ?? ""}
      defaultPlatform={profile?.primaryPlatform ?? ""}
      initialTopic={initialTopic}
      initialPlatform={initialPlatform}
    />
  );
}