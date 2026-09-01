import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

// GET — fetch the authenticated user's creator profile
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Failed to fetch creator profile:", error);
    return NextResponse.json(
      { error: "Could not load creator profile." },
      { status: 500 }
    );
  }
}

// POST — create or update the authenticated user's creator profile (upsert)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const { creatorName, niche, primaryPlatform } = body;

    if (!creatorName || !niche || !primaryPlatform) {
      return NextResponse.json(
        { error: "Creator name, niche, and primary platform are required." },
        { status: 400 }
      );
    }

    const profileData = {
      creatorName,
      niche,
      primaryPlatform,
      audience: body.audience || null,
      targetMarket: body.targetMarket || null,
      secondaryPlatforms: body.secondaryPlatforms || [],
      contentFormat: body.contentFormat || null,
      goals: body.goals || null,
      experienceLevel: body.experienceLevel || null,
      contentStyle: body.contentStyle || null,
      contentPillars: body.contentPillars || [],
    };

    const profile = await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...profileData,
      },
      update: profileData,
    });

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("Failed to save creator profile:", error);
    return NextResponse.json(
      { error: "Could not save creator profile." },
      { status: 500 }
    );
  }
}