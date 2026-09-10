import WorkspaceShell from "@/components/dashboard/workspace-shell";

export const dynamic = "force-dynamic";

/**
 * Chrome for the studios: /ideas, /scripts, /seo, /analyzer, /planner,
 * /creator-profile and /help.
 *
 * This file used to be a full second copy of WorkspaceShell — same auth call,
 * same four queries, same sidebar and topbar markup. The two drifted, and the
 * sidebar stayed broken here for days while every fix went into the shell that
 * only /dashboard rendered.
 *
 * There is now exactly one shell. If the workspace chrome needs to change,
 * change components/dashboard/workspace-shell.tsx and both route groups get
 * it. Do not reintroduce the markup here.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}