import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to save a script." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      topic,
      platform,
      format,
      duration,
      tone,
      audience,
      hookStyle,
      hooks,
      script,
      altEndings,
      platformNotes,
    } = body;

    if (!topic || !platform || !format || !hooks || !script || !altEndings) {
      return NextResponse.json(
        { error: "Missing required fields to save script." },
        { status: 400 }
      );
    }

    const saved = await prisma.savedScript.create({
      data: {
        userId: user.id,
        topic,
        platform,
        format,
        duration,
        tone,
        audience,
        hookStyle,
        hooks,
        script,
        altEndings,
        platformNotes,
      },
    });

    return NextResponse.json({ script: saved });
  } catch (error) {
    console.error("Script save error:", error);
    return NextResponse.json(
      { error: "Creova is temporarily busy. Please try again in a moment." },
      { status: 500 }
    );
  }
}