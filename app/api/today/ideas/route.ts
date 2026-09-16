import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateWithProvider } from "@/lib/ai/router";
import { trackUsage } from "@/lib/usage/tracker";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { checkAccess, getUserPlan } from "@/lib/entitlements/checkAccess";
import { checkRateLimit } from "@/lib/rate-limit/limiter";
import { logger, createRequestId } from "@/lib/logging/logger";
import { checkSpendCap } from "@/lib/usage/spendCap";
import type { AIGenerateResult } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

/**
 * Dashboard "Today's ideas".
 *
 *   GET  -> read-only. Returns today's set if it exists, plus what the client
 *           should do if it doesn't: paid plans auto-generate (ideas are
 *           unlimited on Creator and Pro); free users must press a button,
 *           because each set spends their one-time free ideas.
 *   POST -> generates today's set once. If one already exists it is returned
 *           without another AI call, so reloads and extra tabs cost nothing.
 *
 * "Today" is the UTC date. Usage is tracked under the normal "ideas" feature,
 * so the dashboard and Idea Studio meters include these.
 */

const IDEAS_PER_DAY = 3;
/** One retry if the model returns broken JSON, so users rarely see an error. */
const MAX_ATTEMPTS = 2;

type TodayIdea = { title: string; angle: string; reason: string };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Same fence-stripping as Idea Studio: models wrap JSON in ```json often. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
}

/**
 * Tolerant parse: strips fences, turns raw line breaks/tabs into spaces (a raw
 * newline inside a JSON string is invalid and models emit them), and ignores
 * any text before the first "{" or after the last "}". Returns [] on failure.
 */
function parseIdeas(text: string): TodayIdea[] {
  const cleaned = stripFences(text).replace(/[\r\n\t]+/g, " ");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return [];
  try {
    return toIdeas(JSON.parse(cleaned.slice(start, end + 1))?.ideas);
  } catch {
    return [];
  }
}

function toIdeas(value: unknown): TodayIdea[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is TodayIdea =>
      !!v &&
      typeof v === "object" &&
      typeof (v as TodayIdea).title === "string" &&
      typeof (v as TodayIdea).angle === "string" &&
      typeof (v as TodayIdea).reason === "string"
  );
}

export async function GET() {
  const requestId = createRequestId();

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated.", requestId }, { status: 401 });
    }

    const date = todayKey();

    const [profile, existing, plan] = await Promise.all([
      prisma.creatorProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
      prisma.dailyIdeaSet.findUnique({ where: { userId_date: { userId: user.id, date } } }),
      getUserPlan(user.id),
    ]);

    let freeRemaining: number | null = null;
    if (plan === "free" && !existing) {
      const access = await checkAccess(user.id, "ideas", 1);
      freeRemaining = access.remaining ?? 0;
    }

    return NextResponse.json({
      date,
      hasProfile: Boolean(profile),
      plan,
      ideas: existing ? toIdeas(existing.ideas) : null,
      autoGenerate: plan !== "free",
      freeRemaining,
    });
  } catch (error) {
    logger.error("Today ideas load error", { requestId, route: "today/ideas", error });
    return NextResponse.json(
      { error: "Could not load today's ideas.", requestId },
      { status: 500 }
    );
  }
}

export async function POST() {
  const requestId = createRequestId();
  const route = "today/ideas";

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to get ideas.", requestId },
        { status: 401 }
      );
    }

    const date = todayKey();

    const existing = await prisma.dailyIdeaSet.findUnique({
      where: { userId_date: { userId: user.id, date } },
    });
    if (existing) {
      return NextResponse.json({ date, ideas: toIdeas(existing.ideas) });
    }

    const profile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json(
        { error: "Set up your creator profile to get daily ideas.", requestId },
        { status: 400 }
      );
    }

    const spend = await checkSpendCap(user.id);
    if (!spend.allowed) {
      return NextResponse.json({ error: spend.message, requestId }, { status: 503 });
    }

    const rateLimit = checkRateLimit(`today:${user.id}`, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { requestId, route, userId: user.id });
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment.", requestId },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "ideas", 1);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          upgradeRequired: true,
          plan: access.plan,
          currentUsage: access.currentUsage,
          limit: access.limit,
          remaining: access.remaining,
          requestId,
        },
        { status: 403 }
      );
    }

    // Free users with fewer than 3 ideas left get what remains.
    const count =
      access.remaining == null ? IDEAS_PER_DAY : Math.min(IDEAS_PER_DAY, access.remaining);

    // Avoid repeating recent daily picks and ideas they've already saved.
    const [recentSets, recentSaved] = await Promise.all([
      prisma.dailyIdeaSet.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.savedIdea.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { title: true },
      }),
    ]);

    const avoid = [
      ...recentSets.flatMap((s) => toIdeas(s.ideas).map((i) => i.title)),
      ...recentSaved.map((s) => s.title),
    ].slice(0, 25);

    const systemPrompt = `You are a content strategist who picks a creator's next videos.
Return ONLY valid JSON, no markdown, no code fences, no preamble.
The JSON shape must be exactly:
{
  "ideas": [
    { "title": "string", "angle": "string", "reason": "string" }
  ]
}
"title" is a clickable working title, under 12 words. "angle" is how to approach the video, under 35 words. "reason" is why this fits this creator right now, under 20 words.
Formatting rules: never put double quotes inside a value (use single quotes instead) and never put line breaks inside a value.
Safety rule: if the niche relates to finance, investing, trading, health, medical, legal, or similar high-stakes topics, never imply guaranteed outcomes, specific percentage returns, or specific results (e.g. "30% gains", "cures X", "guaranteed win"). Frame any example numbers or outcomes as illustrative only, not promises, and favor angles that educate or caution rather than hype specific results.`;

    const lines = [
      `Creator: ${profile.creatorName}`,
      `Niche: ${profile.niche}`,
      `Primary platform: ${profile.primaryPlatform}`,
      profile.audience ? `Audience: ${profile.audience}` : "",
      profile.targetMarket ? `Target market: ${profile.targetMarket}` : "",
      profile.contentFormat ? `Content format: ${profile.contentFormat}` : "",
      profile.contentStyle ? `Style/tone: ${profile.contentStyle}` : "",
      profile.experienceLevel ? `Experience level: ${profile.experienceLevel}` : "",
      profile.goals ? `Goals: ${profile.goals}` : "",
      profile.contentPillars.length ? `Content pillars: ${profile.contentPillars.join(", ")}` : "",
      avoid.length ? `Do not repeat or closely resemble these recent ideas:\n- ${avoid.join("\n- ")}` : "",
    ].filter(Boolean);

    const userPrompt = `${lines.join("\n")}

Generate exactly ${count} distinct video ideas this creator could make next. Spread them across different content pillars where possible.`;

    // Tokens were spent on every attempt, so each one is recorded — spend
    // caps read these rows. Anything that didn't produce saved ideas records
    // quantity 0 so the user keeps their allowance (same rule as Idea Studio).
    const track = (result: AIGenerateResult, quantity: number) =>
      trackUsage({
        userId: user.id,
        feature: "ideas",
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
        quantity,
      });

    let ideas: TodayIdea[] = [];
    let result: AIGenerateResult | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && ideas.length === 0; attempt++) {
      result = await generateWithProvider("deepseek", {
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        // Generous on purpose: reasoning models can spend part of this budget
        // before writing, and a cut-off reply is unparseable JSON.
        maxTokens: 2000,
        temperature: 0.9,
      });

      ideas = parseIdeas(result.text).slice(0, count);

      if (ideas.length === 0) {
        logger.error("Failed to parse today ideas JSON", {
          requestId,
          route,
          userId: user.id,
          attempt,
          rawLength: result.text.length,
          outputTokens: result.outputTokens,
          rawStart: result.text.slice(0, 300),
          rawEnd: result.text.slice(-300),
        });
        await track(result, 0);
      }
    }

    if (ideas.length === 0 || !result) {
      return NextResponse.json(
        { error: "Couldn't pick today's ideas right now. Please try again.", requestId },
        { status: 502 }
      );
    }
    const finalResult = result;

    try {
      await prisma.dailyIdeaSet.create({
        data: { userId: user.id, date, ideas },
      });
    } catch (err) {
      // Another tab created today's set first — return that one and don't
      // charge this user's allowance for the duplicate.
      if ((err as { code?: string }).code === "P2002") {
        await track(finalResult, 0);
        const winner = await prisma.dailyIdeaSet.findUnique({
          where: { userId_date: { userId: user.id, date } },
        });
        return NextResponse.json({ date, ideas: winner ? toIdeas(winner.ideas) : ideas });
      }
      throw err;
    }

    await track(finalResult, ideas.length);

    logger.info("Today ideas generated", {
      requestId,
      route,
      userId: user.id,
      count: ideas.length,
      provider: finalResult.provider,
    });

    return NextResponse.json({ date, ideas });
  } catch (error) {
    logger.error("Today ideas generation error", { requestId, route, error });
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment.", requestId },
      { status: 500 }
    );
  }
}