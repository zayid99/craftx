import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to save an idea." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, angle, reason, niche, audience, platform } = body;

    if (!title || !angle || !reason || !niche) {
      return NextResponse.json(
        { error: "Missing required idea fields." },
        { status: 400 }
      );
    }

    const saved = await prisma.savedIdea.create({
      data: {
        userId: user.id,
        title,
        angle,
        reason,
        niche,
        audience,
        platform,
      },
    });

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Failed to save idea:", error);
    return NextResponse.json(
      { error: "Could not save idea." },
      { status: 500 }
    );
  }
}