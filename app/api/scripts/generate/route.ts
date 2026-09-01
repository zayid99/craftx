import { NextRequest, NextResponse } from "next/server";
import { generateWithProvider } from "@/lib/ai/router";
import { trackUsage } from "@/lib/usage/tracker";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { checkAccess } from "@/lib/entitlements/checkAccess";
import { checkRateLimit } from "@/lib/rate-limit/limiter";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to generate a script." },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit(`scripts:${user.id}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You're generating requests too quickly. Please slow down and try again in a moment." },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "scripts");

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
    const { topic, platform, format, duration, tone, audience, hookStyle } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required to generate a script." },
        { status: 400 }
      );
    }
    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required to generate a script." },
        { status: 400 }
      );
    }
    if (!format) {
      return NextResponse.json(
        { error: "Format is required to generate a script." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional short-form and long-form video scriptwriter helping a content creator.
Return ONLY valid JSON, no markdown, no code fences, no preamble.
The JSON shape must be exactly:
{
  "hooks": [
    { "text": "string", "style": "string" }
  ],
  "script": {
    "intro": "string",
    "body": "string",
    "cta": "string"
  },
  "altEndings": [
    { "text": "string" }
  ],
  "platformNotes": "string"
}
Generate 3 distinct hook options. Generate 2 alternate endings. The "body" should be structured with clear beats/sections separated by newlines, appropriate for the requested duration and format.
Safety rule: if the topic relates to finance, investing, trading, health, medical, legal, or similar high-stakes topics, never write hooks, scripts, or CTAs that imply guaranteed outcomes, specific percentage returns, or specific results (e.g. "guaranteed 30% gains", "cures X", "guaranteed win"). Frame any example numbers as illustrative only, and favor honest, educational framing over hype.`;

    const userPrompt = `Topic: ${topic}
Platform: ${platform}
Format: ${format}
${duration ? `Target duration: ${duration}` : ""}
${tone ? `Tone: ${tone}` : ""}
${audience ? `Target audience: ${audience}` : ""}
${hookStyle ? `Preferred hook style: ${hookStyle}` : ""}

Write a complete script following the JSON schema.`;

    const result = await generateWithProvider("deepseek", {
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 2048,
    });

    await trackUsage({
      userId: user.id,
      feature: "scripts",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens ?? 0,
      outputTokens: result.outputTokens ?? 0,
    });

    let parsed;
    try {
      const cleaned = result.text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON:", result.text);
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    if (
      !Array.isArray(parsed.hooks) ||
      !parsed.script ||
      typeof parsed.script.body !== "string" ||
      !Array.isArray(parsed.altEndings)
    ) {
      return NextResponse.json(
        { error: "AI response missing required script fields." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      hooks: parsed.hooks,
      script: parsed.script,
      altEndings: parsed.altEndings,
      platformNotes: parsed.platformNotes ?? "",
    });
  } catch (error) {
    console.error("Script generation error:", error);
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}