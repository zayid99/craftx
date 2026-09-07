import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import type { SavedItem } from "@/components/dashboard/saved-list";
import ScriptAnalyzer from "./script-analyzer";

export const dynamic = "force-dynamic";

/** strengths/weaknesses/recommendations are Json string[] — flatten safely. */
function listToText(value: unknown, max = 4): string {
  if (!Array.isArray(value)) return "—";
  const items = value.slice(0, max).map((v) => (typeof v === "string" ? v : String(v)));
  const extra = value.length > max ? `\n+${value.length - max} more` : "";
  return items.map((t) => `• ${t}`).join("\n") + extra;
}

export default async function AnalyzerPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const [plan, saved] = await Promise.all([
    getUserPlan(user.id),
    prisma.videoAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      /**
       * `transcript` and `suggestedRewrite` are @db.Text and nothing below
       * reads them. Without this select, fifty full transcripts were pulled
       * from the database, serialised into the RSC payload, and sent to the
       * browser to render a title and a score.
       *
       * If you ever add a field to the SavedItem mapping below, add it here
       * too or it will silently arrive undefined.
       */
      select: {
        id: true,
        title: true,
        overallScore: true,
        strengths: true,
        weaknesses: true,
        recommendations: true,
        suggestedNextVideo: true,
        createdAt: true,
      },
    }),
  ]);

  const savedItems: SavedItem[] = saved.map((a) => ({
    id: a.id,
    kind: "analysis",
    title: a.title || "Untitled analysis",
    subtitle: `Score ${a.overallScore}/100`,
    tags: [],
    createdAt: a.createdAt.toISOString(),
    href: "/analyzer",
    preview: [
      { label: "Strengths", value: listToText(a.strengths) },
      { label: "Weaknesses", value: listToText(a.weaknesses) },
      { label: "Recommendations", value: listToText(a.recommendations) },
      ...(a.suggestedNextVideo
        ? [{ label: "Suggested next video", value: a.suggestedNextVideo }]
        : []),
    ],
  }));

  const previousScores = saved
    .slice(0, 10)
    .map((a) => ({ score: a.overallScore, createdAt: a.createdAt.toISOString() }))
    .reverse();

  return (
    <ScriptAnalyzer savedItems={savedItems} previousScores={previousScores} plan={plan} />
  );
}