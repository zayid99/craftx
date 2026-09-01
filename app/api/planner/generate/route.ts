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
        { error: "You must be logged in to generate a content plan." },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit(`planner:${user.id}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You're generating requests too quickly. Please slow down and try again in a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      niche,
      platform,
      goals,
      durationDays,
      autoFill,
      pillars,
      postingFrequency,
    } = body;

    if (!niche) {
      return NextResponse.json(
        { error: "Niche is required to generate a content plan." },
        { status: 400 }
      );
    }
    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required to generate a content plan." },
        { status: 400 }
      );
    }
    if (!durationDays) {
      return NextResponse.json(
        { error: "Duration is required to generate a content plan." },
        { status: 400 }
      );
    }

    let parsed;

    if (autoFill) {
      const access = await checkAccess(user.id, "planner");

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

      const systemPrompt = `You are a content strategist building a posting calendar for a content creator.
Return ONLY valid JSON, no markdown, no code fences, no preamble.
The JSON shape must be exactly:
{
  "pillars": ["string"],
  "days": [
    {
      "day": number,
      "pillar": "string",
      "topic": "string",
      "format": "string",
      "hook": "string",
      "notes": "string"
    }
  ]
}
Generate exactly ${durationDays} day entries, numbered 1 to ${durationDays}.
If a posting frequency is given, mark rest days by setting "topic" to an empty string and "notes" to "Rest day" - do not force content on every single day if frequency is less than daily.
Rotate through 3-5 content pillars relevant to the niche across the plan, unless pillars are already provided by the user.
Keep each "topic" specific enough to become an actual content brief, not generic.
Safety rule: if the niche relates to finance, investing, trading, health, medical, legal, or similar high-stakes topics, never imply guaranteed outcomes, specific percentage returns, or specific results in any topic, hook, or notes field. Frame any example numbers as illustrative only, not promises, and prefer educational or risk-aware framing over hype.`;

      const userPrompt = `Niche: ${niche}
Platform: ${platform}
Duration: ${durationDays} days
${goals ? `Goals: ${goals}` : ""}
${pillars && pillars.length > 0 ? `Content pillars to use: ${pillars.join(", ")}` : ""}
${postingFrequency ? `Posting frequency: ${postingFrequency}` : ""}

Generate the content plan following the JSON schema.`;

      const result = await generateWithProvider("deepseek", {
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 4096,
      });

      await trackUsage({
        userId: user.id,
        feature: "planner",
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
      });

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

      if (!Array.isArray(parsed.days) || !Array.isArray(parsed.pillars)) {
        return NextResponse.json(
          { error: "AI response missing required plan fields." },
          { status: 502 }
        );
      }
    } else {
      parsed = {
        pillars: pillars ?? [],
        days: Array.from({ length: durationDays }, (_, i) => ({
          day: i + 1,
          pillar: "",
          topic: "",
          format: "",
          hook: "",
          notes: "",
        })),
      };
    }

    return NextResponse.json({
      pillars: parsed.pillars,
      days: parsed.days,
    });
  } catch (error) {
    console.error("Content plan generation error:", error);
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}