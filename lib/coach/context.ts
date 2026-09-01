import { prisma } from "@/lib/db/prisma";

export async function buildCoachContext(userId: string) {
  const [profile, ideas, scripts, seo, plans, analyses] = await Promise.all([
    prisma.creatorProfile.findFirst({ where: { userId } }),
    prisma.savedIdea.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.savedScript.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.savedSEO.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.savedContentPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.videoAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const contextParts: string[] = [];

  if (profile) {
    contextParts.push(
      `CREATOR PROFILE:\n${JSON.stringify(profile, null, 2)}`
    );
  }

  if (ideas.length > 0) {
    contextParts.push(
      `RECENT SAVED IDEAS (${ideas.length}):\n` +
        ideas.map((i) => `- ${JSON.stringify(i)}`).join("\n")
    );
  }

  if (scripts.length > 0) {
    contextParts.push(
      `RECENT SAVED SCRIPTS (${scripts.length}):\n` +
        scripts.map((s) => `- ${JSON.stringify(s)}`).join("\n")
    );
  }

  if (seo.length > 0) {
    contextParts.push(
      `RECENT SAVED SEO (${seo.length}):\n` +
        seo.map((s) => `- ${JSON.stringify(s)}`).join("\n")
    );
  }

  if (plans.length > 0) {
    contextParts.push(
      `RECENT CONTENT PLANS (${plans.length}):\n` +
        plans.map((p) => `- ${JSON.stringify(p)}`).join("\n")
    );
  }

  if (analyses.length > 0) {
    contextParts.push(
      `RECENT VIDEO ANALYSES (${analyses.length}):\n` +
        analyses.map((a) => `- ${JSON.stringify(a)}`).join("\n")
    );
  }

  if (contextParts.length === 0) {
    return "No creator profile or saved content yet. Give general creator advice and encourage them to fill out their profile and save some content first.";
  }

  return contextParts.join("\n\n");
}