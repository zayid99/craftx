import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to save SEO content." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      topic,
      platform,
      titles,
      description,
      keywords,
      hashtags,
      searchIntent,
    } = body;

    if (!topic || !platform || !titles || !description) {
      return NextResponse.json(
        { error: "Missing required SEO fields to save." },
        { status: 400 }
      );
    }

    const saved = await prisma.savedSEO.create({
      data: {
        userId: user.id,
        topic,
        platform,
        titles,
        description,
        keywords: keywords ?? [],
        hashtags: hashtags ?? [],
        searchIntent: searchIntent ?? null,
      },
    });

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("SEO save error:", error);
    return NextResponse.json(
      { error: "CraftX is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}