import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getAffiliateSummary } from "@/lib/referrals/affiliate";
import AffiliateDashboard from "./affiliate-dashboard";

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const summary = await getAffiliateSummary(user.id);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://craftxapp.com").replace(/\/$/, "");

  return <AffiliateDashboard summary={summary} link={`${baseUrl}/?ref=${summary.code}`} />;
}