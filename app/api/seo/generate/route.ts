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
        { error: "You must be logged in to generate SEO content." },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit(`seo:${user.id}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You're generating requests too quickly. Please slow down and try again in a moment." },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "seo");

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
    const { topic, platform, contentDescription, targetAudience, tone } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required to generate SEO content." },
        { status: 400 }
      );
    }
    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required to generate SEO content." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an SEO strategist helping a content creator optimize a piece of content for discoverability.
Return ONLY valid JSON, no markdown, no code fences, no preamble.
The JSON shape must be exactly:
{
  "titles": [
    { "text": "string", "angle": "string" }
  ],
  "description": "string",
  "keywords": ["string"],
  "hashtags": ["string"],
  "searchIntent": "string",
  "disclaimer": "string"
}
Generate 5 distinct title variations, each with a different angle (e.g. curiosity, benefit-driven, direct/keyword-first, question, bold claim).
The "description" should be platform-appropriate length and include a natural keyword placement, not keyword stuffing.
Generate 8-12 relevant keywords and 8-15 relevant hashtags (without the # symbol).
"searchIntent" should be a one-sentence description of what the viewer is likely searching for or wants when they find this content.
"disclaimer" must always be a short note reminding the user that these keyword/hashtag suggestions are AI-generated estimates, not verified search volume or ranking data, and should be validated against real platform data where possible.
Safety rule: if the topic relates to finance, investing, trading, health, medical, legal, or similar high-stakes topics, do not generate titles, descriptions, or keywords that imply guaranteed outcomes or specific results (e.g. "guaranteed returns", "cures", "guaranteed win"). Favor accurate, non-hype phrasing even when optimizing for clicks.`;

    const userPrompt = `Topic: ${topic}
Platform: ${platform}
${contentDescription ? `Content description: ${contentDescription}` : ""}
${targetAudience ? `Target audience: ${targetAudience}` : ""}
${tone ? `Tone: ${tone}` : ""}

Generate optimized SEO content following the JSON schema.`;

    const result = await generateWithProvider("deepseek", {
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1536,
    });

    await trackUsage({
      userId: user.id,
      feature: "seo",
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
      !Array.isArray(parsed.titles) ||
      typeof parsed.description !== "string" ||
      !Array.isArray(parsed.keywords) ||
      !Array.isArray(parsed.hashtags)
    ) {
      return NextResponse.json(
        { error: "AI response missing required SEO fields." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      titles: parsed.titles,
      description: parsed.description,
      keywords: parsed.keywords,
      hashtags: parsed.hashtags,
      searchIntent: parsed.searchIntent ?? "",
      disclaimer:
        parsed.disclaimer ??
        "These suggestions are AI-generated estimates, not verified search data.",
    });
  } catch (error) {
    console.error("SEO generation error:", error);
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}