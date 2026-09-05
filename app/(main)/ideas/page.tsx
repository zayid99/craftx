import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import type { SavedItem } from "@/components/dashboard/saved-list";
import IdeaStudio from "./idea-studio";

export const dynamic = "force-dynamic";

export default async function IdeaStudioPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [profile, saved] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
    prisma.savedIdea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const savedItems: SavedItem[] = saved.map((i) => ({
    id: i.id,
    kind: "idea",
    title: i.title,
    subtitle: i.niche,
    tags: [i.platform, i.audience].filter((v): v is string => Boolean(v)),
    createdAt: i.createdAt.toISOString(),
    href: "/ideas",
    preview: [
      { label: "Angle", value: i.angle },
      { label: "Why it works", value: i.reason },
    ],
  }));

  return (
    <IdeaStudio
      savedItems={savedItems}
      defaultNiche={profile?.niche ?? ""}
      defaultAudience={profile?.audience ?? ""}
      defaultPlatform={profile?.primaryPlatform ?? ""}
    />
  );
}