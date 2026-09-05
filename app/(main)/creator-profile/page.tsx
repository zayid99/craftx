import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import CreatorProfileForm, { type ProfileValues } from "./creator-profile-form";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
  });

  const initial: ProfileValues = {
    creatorName: profile?.creatorName ?? "",
    niche: profile?.niche ?? "",
    primaryPlatform: profile?.primaryPlatform ?? "",
    secondaryPlatforms: profile?.secondaryPlatforms ?? [],
    contentFormat: profile?.contentFormat ?? "",
    audience: profile?.audience ?? "",
    targetMarket: profile?.targetMarket ?? "",
    experienceLevel: profile?.experienceLevel ?? "",
    goals: profile?.goals ?? "",
    contentPillars: profile?.contentPillars ?? [],
    contentStyle: profile?.contentStyle ?? "",
  };

  return <CreatorProfileForm initial={initial} hasProfile={Boolean(profile)} />;
}