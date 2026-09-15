import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

const FEEDBACK_TYPES = ["bug", "feature", "complaint", "other"] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

const MIN_MESSAGE_LENGTH = 5;
const MAX_MESSAGE_LENGTH = 5000;

// Simple spam guard: max submissions per user per hour.
const MAX_PER_HOUR = 10;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to send feedback." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, message, pageUrl } = body;

    if (!FEEDBACK_TYPES.includes(type as FeedbackType)) {
      return NextResponse.json(
        { error: "Please choose a feedback type." },
        { status: 400 }
      );
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Please write a little more detail." },
        { status: 400 }
      );
    }
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Please keep it under ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.feedback.count({
      where: { userId: user.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= MAX_PER_HOUR) {
      return NextResponse.json(
        { error: "You've sent a lot of feedback recently. Please try again later." },
        { status: 429 }
      );
    }

    // Works whether getAuthenticatedUser returns the Supabase user or a custom
    // object — email is only stored if it's actually there.
    const userEmail =
      "email" in user && typeof user.email === "string" ? user.email : null;

    const saved = await prisma.feedback.create({
      data: {
        userId: user.id,
        userEmail,
        type,
        message: trimmedMessage,
        pageUrl: typeof pageUrl === "string" ? pageUrl.slice(0, 500) : null,
        // Read from the request itself rather than trusting the client.
        userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: saved.id });
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return NextResponse.json(
      { error: "Could not send feedback. Please try again." },
      { status: 500 }
    );
  }
}