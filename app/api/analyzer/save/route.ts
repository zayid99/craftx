import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to save a video analysis." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      transcript,
      overallScore,
      strengths,
      weaknesses,
      recommendations,
      suggestedRewrite,
      suggestedNextVideo,
    } = body;

    if (
      !transcript ||
      typeof overallScore !== "number" ||
      !Array.isArray(strengths) ||
      !Array.isArray(weaknesses) ||
      !Array.isArray(recommendations)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid analysis data." },
        { status: 400 }
      );
    }

    const saved = await prisma.videoAnalysis.create({
      data: {
        userId: user.id,
        title: title || null,
        transcript,
        overallScore,
        strengths,
        weaknesses,
        recommendations,
        suggestedRewrite: suggestedRewrite || null,
        suggestedNextVideo: suggestedNextVideo || null,
      },
    });

    return NextResponse.json({ saved });
  } catch (err) {
    console.error("Video analysis save error:", err);
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}