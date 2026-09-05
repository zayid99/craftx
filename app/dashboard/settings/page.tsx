import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import SettingsView, { type ProfileDefaults } from "./settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
  });

  // Only the fields the Defaults tab writes back; the rest is passed through
  // untouched so saving here can never wipe the creator profile.
  const defaults: ProfileDefaults | null = profile
    ? {
        creatorName: profile.creatorName,
        niche: profile.niche,
        primaryPlatform: profile.primaryPlatform,
        secondaryPlatforms: profile.secondaryPlatforms,
        contentFormat: profile.contentFormat ?? "",
        contentStyle: profile.contentStyle ?? "",
        audience: profile.audience ?? "",
        targetMarket: profile.targetMarket ?? "",
        experienceLevel: profile.experienceLevel ?? "",
        goals: profile.goals ?? "",
        contentPillars: profile.contentPillars,
      }
    : null;

  return (
    <SettingsView
      email={user.email ?? ""}
      memberSince={user.created_at ?? null}
      defaults={defaults}
    />
  );
}