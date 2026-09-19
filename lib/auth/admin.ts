/**
 * Admin access for internal pages like /admin/payouts.
 *
 * Set ADMIN_EMAILS to a comma-separated list, e.g.
 *   ADMIN_EMAILS=you@example.com
 * in .env.local (local) and in Railway's Variables (production).
 * If it's missing, nobody is an admin.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.trim().toLowerCase());
}