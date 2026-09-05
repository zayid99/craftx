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