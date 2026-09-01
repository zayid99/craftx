import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { buildCoachContext } from "@/lib/coach/context";
import { trackUsage } from "@/lib/usage/tracker";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { checkAccess } from "@/lib/entitlements/checkAccess";
import { checkRateLimit } from "@/lib/rate-limit/limiter";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30 * 1000,
  maxRetries: 2,
});

const MODEL = "claude-sonnet-4-6";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to chat with the Creator Coach." },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit(`coach:${user.id}`, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You're sending messages too quickly. Please slow down and try again in a moment." },
        { status: 429 }
      );
    }

    const access = await checkAccess(user.id, "coach");

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
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    await prisma.coachMessage.create({
      data: { userId: user.id, role: "user", content: message },
    });

    const recentHistory = await prisma.coachMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const orderedHistory = recentHistory.reverse();

    const context = await buildCoachContext(user.id);

    const systemPrompt = `You are the CraftX Creator Coach — an AI advisor helping a content creator grow. Use the creator's actual profile and saved content below to give specific, grounded advice instead of generic tips. Reference their real ideas, scripts, SEO work, plans, or video analyses when relevant. If they ask something you don't have data for, say so honestly rather than inventing numbers or performance data. Never guarantee virality or specific outcomes. Keep responses focused and actionable.

CREATOR CONTEXT:
${context}`;

    let response;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: orderedHistory.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      });
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(
          `[Coach] Claude API error (status ${err.status ?? "unknown"}):`,
          err.message
        );
      } else {
        console.error("[Coach] Unexpected provider error:", err);
      }
      return NextResponse.json(
        { error: "CraftX is temporarily busy. Please try again in a moment." },
        { status: 502 }
      );
    }

    await trackUsage({
      userId: user.id,
      feature: "coach",
      provider: "claude",
      model: MODEL,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "CraftX is temporarily busy. Please try again in a moment." },
        { status: 502 }
      );
    }

    const reply = textBlock.text;

    await prisma.coachMessage.create({
      data: { userId: user.id, role: "assistant", content: reply },
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Coach chat error:", err);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}