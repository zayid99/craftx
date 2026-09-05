import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import type { SavedItem } from "@/components/dashboard/saved-list";
import ScriptStudio, { type IdeaOption } from "./script-studio";

export const dynamic = "force-dynamic";

/** hooks is Json ({ text, style }[]) — flatten safely for the saved preview. */
function hooksToText(value: unknown): string {
  if (!Array.isArray(value)) return "—";
  return value
    .slice(0, 3)
    .map((h) => {
      if (typeof h === "string") return h;
      if (h && typeof h === "object") {
        const o = h as Record<string, unknown>;
        const text = typeof o.text === "string" ? o.text : "";
        const style = typeof o.style === "string" ? o.style : "";
        return style ? `${style}: ${text}` : text;
      }
      return String(h);
    })
    .filter(Boolean)
    .join("\n");
}

/** script is Json ({ intro, body, cta }) — show the intro as the preview. */
function scriptToText(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const intro = typeof o.intro === "string" ? o.intro : "";
    if (intro) return intro.length > 400 ? `${intro.slice(0, 400)}…` : intro;
  }
  return "—";
}

export default async function ScriptStudioPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [profile, plan, saved, ideas] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
    prisma.savedScript.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Powers "Import from Idea Studio" — real saved ideas.
    prisma.savedIdea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const savedItems: SavedItem[] = saved.map((s) => ({
    id: s.id,
    kind: "script",
    title: s.topic,
    subtitle: `${s.platform} · ${s.format}`,
    tags: [s.duration, s.tone].filter((v): v is string => Boolean(v)),
    createdAt: s.createdAt.toISOString(),
    href: "/scripts",
    preview: [
      { label: "Hooks", value: hooksToText(s.hooks) },
      { label: "Intro", value: scriptToText(s.script) },
      ...(s.platformNotes ? [{ label: "Platform notes", value: s.platformNotes }] : []),
    ],
  }));

  const ideaOptions: IdeaOption[] = ideas.map((i) => ({
    id: i.id,
    title: i.title,
    platform: i.platform,
    audience: i.audience,
  }));

  return (
    <ScriptStudio
      savedItems={savedItems}
      ideaOptions={ideaOptions}
      plan={plan}
      defaultAudience={profile?.audience ?? ""}
      defaultPlatform={profile?.primaryPlatform ?? ""}
    />
  );
}