import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

/**
 * POST without `id` -> saves a new hook set.
 * POST with `id`    -> updates the starred items of a set this user owns.
 *
 * Saving doesn't touch the "hooks" allowance — only generating does.
 */

type Hook = { text: string; style: string; delivery: string };
type Title = { text: string; angle: string };

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function cleanHooks(value: unknown): Hook[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 20)
    .map((h) => ({
      text: str(h?.text, 500),
      style: str(h?.style, 30),
      delivery: str(h?.delivery, 300),
    }))
    .filter((h) => h.text);
}

function cleanTitles(value: unknown): Title[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 20)
    .map((t) => ({ text: str(t?.text, 200), angle: str(t?.angle, 40) }))
    .filter((t) => t.text);
}

/** Unique, in-range integer indexes only. */
function cleanStars(value: unknown, length: number): number[] {
  if (!Array.isArray(value)) return [];
  const out = new Set<number>();
  for (const v of value) {
    if (Number.isInteger(v) && v >= 0 && v < length) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to save hooks." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // ---- update stars on an existing set ----
    if (typeof body.id === "string" && body.id) {
      const existing = await prisma.savedHookSet.findFirst({
        where: { id: body.id, userId: user.id },
        select: { id: true, hooks: true, titles: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "That saved set no longer exists." }, { status: 404 });
      }

      const hookCount = Array.isArray(existing.hooks) ? existing.hooks.length : 0;
      const titleCount = Array.isArray(existing.titles) ? existing.titles.length : 0;

      await prisma.savedHookSet.update({
        where: { id: existing.id },
        data: {
          starredHooks: cleanStars(body.starredHooks, hookCount),
          starredTitles: cleanStars(body.starredTitles, titleCount),
        },
      });

      return NextResponse.json({ saved: { id: existing.id } });
    }

    // ---- create a new set ----
    const topic = str(body.topic, 200);
    const platform = str(body.platform, 50);
    const audience = str(body.audience, 200);
    const hooks = cleanHooks(body.hooks);
    const titles = cleanTitles(body.titles);

    if (!topic || !platform || hooks.length === 0 || titles.length === 0) {
      return NextResponse.json({ error: "Missing required hook set fields." }, { status: 400 });
    }

    const saved = await prisma.savedHookSet.create({
      data: {
        userId: user.id,
        topic,
        platform,
        audience: audience || null,
        hooks,
        titles,
        starredHooks: cleanStars(body.starredHooks, hooks.length),
        starredTitles: cleanStars(body.starredTitles, titles.length),
      },
      select: { id: true },
    });

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Failed to save hook set:", error);
    return NextResponse.json({ error: "Could not save hook set." }, { status: 500 });
  }
}