"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export type SavedKind = "idea" | "script" | "seo" | "plan" | "analysis";

const STUDIO_PATH: Record<SavedKind, string> = {
  idea: "/ideas",
  script: "/scripts",
  seo: "/seo",
  plan: "/planner",
  analysis: "/analyzer",
};

/**
 * Deletes one saved item belonging to the signed-in user.
 *
 * Every branch scopes the delete to `userId` as well as `id`, so a user can
 * never remove another account's row even if they forge an id.
 */
export async function deleteSavedItem(kind: SavedKind, id: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false as const, error: "Not signed in." };
  }

  try {
    switch (kind) {
      case "idea":
        await prisma.savedIdea.deleteMany({ where: { id, userId: user.id } });
        break;
      case "script":
        await prisma.savedScript.deleteMany({ where: { id, userId: user.id } });
        break;
      case "seo":
        await prisma.savedSEO.deleteMany({ where: { id, userId: user.id } });
        break;
      case "plan":
        await prisma.savedContentPlan.deleteMany({
          where: { id, userId: user.id },
        });
        break;
      case "analysis":
        await prisma.videoAnalysis.deleteMany({
          where: { id, userId: user.id },
        });
        break;
      default:
        return { ok: false as const, error: "Unknown item type." };
    }

    revalidatePath("/dashboard");
    revalidatePath(STUDIO_PATH[kind]);
    return { ok: true as const };
  } catch (error) {
    console.error("[deleteSavedItem] failed", error);
    return { ok: false as const, error: "Could not delete that item." };
  }
}