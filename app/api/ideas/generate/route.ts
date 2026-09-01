import { NextRequest, NextResponse } from "next/server";
import { generateWithProvider } from "@/lib/ai/router";
import { trackUsage } from "@/lib/usage/tracker";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { checkAccess } from "@/lib/entitlements/checkAccess";
import { checkRateLimit } from "@/lib/rate-limit/limiter";
import { logger, createRequestId } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const route = "ideas/generate";

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to generate ideas.", requestId },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { niche, audience, platform, count = 5, tone } = body;

    if (!niche) {
      return NextResponse.json(
        { error: "Niche is required to generate ideas.", requestId },
        { status: 400 }
      );
    }

    const requestedCount = Math.max(1, Math.min(Number(count) || 5, 20));

    const rateLimit = checkRateLimit(`ideas:${user.id}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { requestId, route, userId: user.id });
      return NextResponse.json(
        { error: "You're generating requests too quickly. Please slow down and try again in a moment.", requestId },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "ideas", requestedCount);

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

    const systemPrompt = `You are a content strategist helping a creator brainstorm video ideas.
Return ONLY valid JSON, no markdown, no code fences, no preamble.
The JSON shape must be exactly:
{
  "ideas": [
    { "title": "string", "angle": "string", "reason": "string" }
  ]
}
Safety rule: if the niche relates to finance, investing, trading, health, medical, legal, or similar high-stakes topics, never imply guaranteed outcomes, specific percentage returns, or specific results (e.g. "30% gains", "cures X", "guaranteed win"). Frame any example numbers or outcomes as illustrative only, not promises, and favor angles that educate or caution rather than hype specific results.`;

    const userPrompt = `Niche: ${niche}
${audience ? `Audience: ${audience}` : ""}
${platform ? `Platform: ${platform}` : ""}
${tone ? `Tone: ${tone}` : ""}

Generate exactly ${requestedCount} distinct video ideas.`;

    const result = await generateWithProvider("deepseek", {
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1024,
    });

    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch (err) {
      logger.error("Failed to parse AI response as JSON", {
        requestId,
        route,
        userId: user.id,
        error: err,
        rawResponse: result.text.slice(0, 500),
      });
      await trackUsage({
        userId: user.id,
        feature: "ideas",
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
        quantity: 0,
      });
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again.", requestId },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.ideas)) {
      logger.error("AI response missing ideas array", { requestId, route, userId: user.id });
      await trackUsage({
        userId: user.id,
        feature: "ideas",
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
        quantity: 0,
      });
      return NextResponse.json(
        { error: "AI response missing ideas array.", requestId },
        { status: 502 }
      );
    }

    await trackUsage({
      userId: user.id,
      feature: "ideas",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens ?? 0,
      outputTokens: result.outputTokens ?? 0,
      quantity: parsed.ideas.length,
    });

    logger.info("Ideas generated", {
      requestId,
      route,
      userId: user.id,
      count: parsed.ideas.length,
      provider: result.provider,
    });

    return NextResponse.json({ ideas: parsed.ideas });
  } catch (error) {
    logger.error("Idea generation error", { requestId, route, error });
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment.", requestId },
      { status: 500 }
    );
  }
}