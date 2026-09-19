import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";

// Must match the cookie name set in middleware.ts.
export const REFERRAL_COOKIE = "craftx_ref";

// Only brand-new accounts can be referred, so an existing user who clicks
// someone's link and logs back in doesn't get attributed.
const NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Links a newly signed-up user to the affiliate whose ?ref= link they arrived
 * through. Call this from auth routes right after a session is established.
 *
 * Never throws: a referral problem must not block the user from signing in.
 */
export async function claimReferral(user: User): Promise<void> {
  try {
    const cookieStore = await cookies();
    const code = cookieStore.get(REFERRAL_COOKIE)?.value;
    if (!code) return;

    // One attempt per cookie, whatever the outcome below.
    cookieStore.delete(REFERRAL_COOKIE);

    const createdAt = new Date(user.created_at).getTime();
    if (Number.isNaN(createdAt) || Date.now() - createdAt > NEW_ACCOUNT_WINDOW_MS) {
      return;
    }

    const referralCode = await prisma.referralCode.findUnique({ where: { code } });
    if (!referralCode) return;
    if (referralCode.userId === user.id) return; // no self-referrals

    await prisma.referral.create({
      data: {
        referrerUserId: referralCode.userId,
        referredUserId: user.id,
        code,
      },
    });

    console.log(`[Referral] ${user.id} referred by ${referralCode.userId} (code: ${code})`);
  } catch (error) {
    // P2002 = unique constraint: this user was already referred. Nothing to do.
    if ((error as { code?: string })?.code === "P2002") return;
    console.error("[Referral] Failed to claim referral:", error);
  }
}