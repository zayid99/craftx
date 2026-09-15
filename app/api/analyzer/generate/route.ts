import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { trackUsage } from "@/lib/usage/tracker";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { checkAccess } from "@/lib/entitlements/checkAccess";
import { checkRateLimit } from "@/lib/rate-limit/limiter";
import { checkSpendCap } from "@/lib/usage/spendCap";

const client = new Anthropic({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/anthropic",
  timeout: 30 * 1000,
  maxRetries: 2,
});

const MODEL = "deepseek-v4-flash";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to analyze a video." },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit(`analyzer:${user.id}`, 10, 60 * 1000);
        const spend = await checkSpendCap(user.id);
    if (!spend.allowed) {
      return NextResponse.json({ error: spend.message }, { status: 503 });
    }
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You're generating requests too quickly. Please slow down and try again in a moment." },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "analyzer");

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          upgradeRequired: true,
          plan: access.plan,
          currentUsage: access.currentUsage,
          limit: access.limit,
          remaining: access.remaining,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { transcript, title } = body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a transcript of at least 50 characters." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a video content analyst for CraftX, a creator growth platform. Analyze the given video transcript and return ONLY valid JSON, no markdown fences, no preamble.

Return this exact structure:
{
  "overallScore": number (0-100),
  "strengths": string[] (3-5 specific strengths),
  "weaknesses": string[] (3-5 specific weaknesses),
  "recommendations": string[] (3-5 actionable, specific recommendations),
  "suggestedRewrite": string (a rewritten opening/hook, 2-3 sentences),
  "suggestedNextVideo": string (one specific next video idea based on this content, 1-2 sentences)
}

Evaluate: hook strength, clarity, pacing, structure, storytelling, CTA presence, engagement potential.
Do not claim the score guarantees virality. Be specific to the actual transcript content, not generic.
Safety rule: if the transcript relates to finance, investing, trading, health, medical, legal, or similar high-stakes topics, do not write a suggestedRewrite, recommendation, or suggestedNextVideo that implies guaranteed outcomes or specific results. Keep any example numbers illustrative only.`;

    const userPrompt = title
      ? `Video title: ${title}\n\nTranscript:\n${transcript}`
      : `Transcript:\n${transcript}`;

    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(
          `[Analyzer] Provider error (status ${err.status ?? "unknown"}):`,
          err.message
        );
      } else {
        console.error("[Analyzer] Unexpected provider error:", err);
      }
      return NextResponse.json(
        { error: "CraftX is temporarily busy. Please try again in a moment." },
        { status: 502 }
      );
    }

    /**
     * The provider call succeeded, so the tokens below were really spent and
     * must be recorded either way — checkSpendCap reads these rows.
     *
     * But the user only loses an allowance if they actually receive a usable
     * analysis. Every failure path past this point records the real token cost
     * with quantity: 0, so it counts against spend but not against the user.
     *
     * Order matters here: trackUsage used to sit directly below the provider
     * call, above the three validation checks. A malformed AI response then
     * burned a generation and returned an error, which is how a user with 4
     * analyses left could drop to 2 without ever seeing output.
     */
    const trackFailed = () =>
      trackUsage({
        userId: user.id,
        feature: "analyzer",
        provider: "deepseek",
        model: MODEL,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        quantity: 0,
      });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[Analyzer] Provider returned no text block");
      await trackFailed();
      return NextResponse.json(
        { error: "CraftX is temporarily busy. Please try again in a moment." },
        { status: 502 }
      );
    }

    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error(
        "[Analyzer] Failed to parse AI response as JSON:",
        cleaned.slice(0, 500)
      );
      await trackFailed();
      return NextResponse.json(
        { error: "CraftX is temporarily busy. Please try again in a moment." },
        { status: 502 }
      );
    }

    if (
      typeof parsed.overallScore !== "number" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !Array.isArray(parsed.recommendations)
    ) {
      console.error("[Analyzer] AI response has unexpected shape");
      await trackFailed();
      return NextResponse.json(
        { error: "CraftX is temporarily busy. Please try again in a moment." },
        { status: 502 }
      );
    }

    // Validated output — now the user has genuinely consumed a generation.
    await trackUsage({
      userId: user.id,
      feature: "analyzer",
      provider: "deepseek",
      model: MODEL,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    });

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Video analyzer generate error:", err);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}