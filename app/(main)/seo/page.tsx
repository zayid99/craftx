import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import type { SavedItem } from "@/components/dashboard/saved-list";
import SEOStudio, { type ScriptOption } from "./seo-studio";

export const dynamic = "force-dynamic";

/** Titles are stored as Json ({ text, angle }[]); flatten safely for preview. */
function titlesToText(value: unknown): string {
  if (!Array.isArray(value)) return "—";
  return value
    .slice(0, 5)
    .map((t) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object") {
        const o = t as Record<string, unknown>;
        const text = typeof o.text === "string" ? o.text : "";
        const angle = typeof o.angle === "string" ? o.angle : "";
        return angle ? `${angle}: ${text}` : text;
      }
      return String(t);
    })
    .filter(Boolean)
    .join("\n");
}

export default async function SEOStudioPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [profile, plan, saved, scripts] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
    prisma.savedSEO.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Powers "Import from Script Studio" — real saved scripts, not a mock.
    prisma.savedScript.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const savedItems: SavedItem[] = saved.map((s) => ({
    id: s.id,
    kind: "seo",
    title: s.topic,
    subtitle: s.platform,
    tags: s.searchIntent ? [s.searchIntent] : [],
    createdAt: s.createdAt.toISOString(),
    href: "/seo",
    preview: [
      { label: "Titles", value: titlesToText(s.titles) },
      { label: "Description", value: s.description },
      { label: "Keywords", value: s.keywords.join(", ") || "—" },
      { label: "Hashtags", value: s.hashtags.map((h) => `#${h}`).join(" ") || "—" },
    ],
  }));

  const scriptOptions: ScriptOption[] = scripts.map((s) => ({
    id: s.id,
    topic: s.topic,
    platform: s.platform,
  }));

  return (
    <SEOStudio
      savedItems={savedItems}
      scriptOptions={scriptOptions}
      plan={plan}
      defaultAudience={profile?.audience ?? ""}
      defaultPlatform={profile?.primaryPlatform ?? ""}
    />
  );
}