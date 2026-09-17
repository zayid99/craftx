import { NextRequest, NextResponse } from "next/server";
import { generateWithProvider } from "@/lib/ai/router";
import type { AIGenerateResult } from "@/lib/ai/types";
import { trackUsage } from "@/lib/usage/tracker";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { checkAccess } from "@/lib/entitlements/checkAccess";
import { checkRateLimit } from "@/lib/rate-limit/limiter";
import { logger, createRequestId } from "@/lib/logging/logger";
import { checkSpendCap } from "@/lib/usage/spendCap";

/**
 * Hooks & Titles — one generation = one SET (10 hooks + 10 titles), counted as
 * quantity 1 against the "hooks" feature. Free 3 once, Creator 10/month,
 * Pro unlimited (lib/entitlements/limits.ts).
 */

const HOOK_STYLES = ["Question", "Bold claim", "Story", "Statistic", "Contrarian"];
const MAX_ATTEMPTS = 2;
const TOPIC_LIMIT = 200;

type Hook = { text: string; style: string; delivery: string };
type Title = { text: string; angle: string };

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Tolerant parse (same approach as Today's ideas): raw line breaks become
 * spaces, text outside the outer braces is ignored, bad items are dropped.
 */
function parseSet(text: string): { hooks: Hook[]; titles: Title[] } | null {
  const cleaned = stripFences(text).replace(/[\r\n\t]+/g, " ");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    const hooks: Hook[] = (Array.isArray(parsed?.hooks) ? parsed.hooks : [])
      .map((h: Record<string, unknown>) => {
        const style = str(h?.style);
        return {
          text: str(h?.text),
          // Unknown styles are kept as-is but capped, so a stray label can't break the UI.
          style: HOOK_STYLES.find((s) => s.toLowerCase() === style.toLowerCase()) ?? style.slice(0, 30),
          delivery: str(h?.delivery),
        };
      })
      .filter((h: Hook) => h.text)
      .slice(0, 10);

    const titles: Title[] = (Array.isArray(parsed?.titles) ? parsed.titles : [])
      .map((t: Record<string, unknown>) => ({ text: str(t?.text), angle: str(t?.angle) }))
      .filter((t: Title) => t.text)
      .slice(0, 10);

    if (hooks.length === 0 || titles.length === 0) return null;
    return { hooks, titles };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const route = "hooks/generate";

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to generate hooks.", requestId },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const topic = str(body.topic).slice(0, TOPIC_LIMIT);
    const platform = str(body.platform).slice(0, 50);
    const audience = str(body.audience).slice(0, 200);
    const tone = str(body.tone).slice(0, 50);

    if (!topic) {
      return NextResponse.json(
        { error: "Add a video topic to generate hooks and titles.", requestId },
        { status: 400 }
      );
    }

    const spend = await checkSpendCap(user.id);
    if (!spend.allowed) {
      return NextResponse.json({ error: spend.message, requestId }, { status: 503 });
    }

    const rateLimit = checkRateLimit(`hooks:${user.id}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { requestId, route, userId: user.id });
      return NextResponse.json(
        { error: "You're generating requests too quickly. Please try again in a moment.", requestId },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "hooks", 1);
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

    const systemPrompt = `You write scroll-stopping hooks and click-worthy titles for short and long-form video creators.
Return ONLY valid JSON, no markdown, no code fences, no preamble.
The JSON shape must be exactly:
{
  "hooks": [ { "text": "string", "style": "string", "delivery": "string" } ],
  "titles": [ { "text": "string", "angle": "string" } ]
}
Hooks: exactly 10, two for each style in this order: ${HOOK_STYLES.join(", ")}. "text" is the opening line spoken in the first 3 seconds, under 25 words. "style" is one of those five names exactly. "delivery" is one short sentence on how to say or show it on camera.
Titles: exactly 10. "text" is a video title, ideally under 60 characters. "angle" is a 1-3 word label such as Curiosity, How-to, Listicle, Story, Contrarian, Mistake.
Honesty rules: never invent statistics, studies or quotes. Statistic hooks must use a placeholder such as [X%] or [number] for the creator to replace with a real, sourced figure. Never promise results the video cannot guarantee.
Only if the topic is about finance, investing, health, medical or legal matters: do not imply guaranteed outcomes or specific returns. For any other topic, ignore this rule and do not add disclaimers.
Formatting rules: never put double quotes inside a value (use single quotes instead) and never put line breaks inside a value.`;

    const userPrompt = [
      `Video topic: ${topic}`,
      platform ? `Platform: ${platform}` : "",
      audience ? `Audience: ${audience}` : "",
      tone ? `Tone: ${tone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const track = (result: AIGenerateResult, quantity: number) =>
      trackUsage({
        userId: user.id,
        feature: "hooks",
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
        quantity,
      });

    let set: { hooks: Hook[]; titles: Title[] } | null = null;
    let result: AIGenerateResult | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !set; attempt++) {
      result = await generateWithProvider("deepseek", {
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        // Generous: 20 items plus any reasoning the model does first.
        maxTokens: 2500,
        temperature: 0.9,
      });

      set = parseSet(result.text);

      if (!set) {
        logger.error("Failed to parse hooks JSON", {
          requestId,
          route,
          userId: user.id,
          attempt,
          rawLength: result.text.length,
          outputTokens: result.outputTokens,
          rawStart: result.text.slice(0, 300),
          rawEnd: result.text.slice(-300),
        });
        // Tokens were spent; quantity 0 keeps the user's allowance intact.
        await track(result, 0);
      }
    }

    if (!set || !result) {
      return NextResponse.json(
        { error: "Couldn't write hooks for that topic right now. Please try again.", requestId },
        { status: 502 }
      );
    }

    await track(result, 1);

    logger.info("Hooks generated", {
      requestId,
      route,
      userId: user.id,
      hooks: set.hooks.length,
      titles: set.titles.length,
      provider: result.provider,
    });

    return NextResponse.json(set);
  } catch (error) {
    logger.error("Hooks generation error", { requestId, route, error });
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment.", requestId },
      { status: 500 }
    );
  }
}