import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to save a content plan." },
        { status: 401 }
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
      days,
    } = body;

    if (!niche || !platform || !durationDays || !days) {
      return NextResponse.json(
        { error: "Missing required fields to save content plan." },
        { status: 400 }
      );
    }

    const saved = await prisma.savedContentPlan.create({
      data: {
        userId: user.id,
        niche,
        platform,
        goals,
        durationDays,
        autoFill: autoFill ?? false,
        pillars: pillars ?? [],
        days,
      },
    });

    return NextResponse.json({ plan: saved });
  } catch (error) {
    console.error("Content plan save error:", error);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}