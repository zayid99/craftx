import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import CreatorCoach, { type CoachContext, type ChatMessage } from "./creator-coach";

export const dynamic = "force-dynamic";

/** Json string[] columns -> plain string[]. */
function toStringList(value: unknown, max = 3): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, max)
    .map((v) => (typeof v === "string" ? v : String(v)))
    .filter(Boolean);
}

export default async function CoachPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [profile, plan, history, analyses, ideaCount, scriptCount, seoCount, planCount] =
    await Promise.all([
      prisma.creatorProfile.findUnique({ where: { userId: user.id } }),
      getUserPlan(user.id),
      prisma.coachMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.videoAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.savedIdea.count({ where: { userId: user.id } }),
      prisma.savedScript.count({ where: { userId: user.id } }),
      prisma.savedSEO.count({ where: { userId: user.id } }),
      prisma.savedContentPlan.count({ where: { userId: user.id } }),
    ]);

  const latest = analyses[0] ?? null;

  const context: CoachContext = {
    creatorName: profile?.creatorName ?? "",
    niche: profile?.niche ?? "",
    primaryPlatform: profile?.primaryPlatform ?? "",
    goals: profile?.goals ?? "",
    hasProfile: Boolean(profile),
    counts: {
      ideas: ideaCount,
      scripts: scriptCount,
      seo: seoCount,
      plans: planCount,
      analyses: analyses.length,
    },
    latestAnalysis: latest
      ? {
          id: latest.id,
          title: latest.title || "Untitled analysis",
          score: latest.overallScore,
          weaknesses: toStringList(latest.weaknesses),
          recommendations: toStringList(latest.recommendations, 5),
          createdAt: latest.createdAt.toISOString(),
        }
      : null,
    recentAnalyses: analyses.map((a) => ({
      id: a.id,
      title: a.title || "Untitled analysis",
      score: a.overallScore,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  const messages: ChatMessage[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));

  return <CreatorCoach initialMessages={messages} context={context} plan={plan} />;
}