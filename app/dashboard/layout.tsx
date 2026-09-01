import Sidebar from "@/components/dashboard/Sidebar";
import { LogoutButton } from "@/components/logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-black">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-black/10 bg-white px-6">
            <div>
              <p className="text-sm font-medium text-black/50">
                Creator Workspace
              </p>
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-black/5"
              >
                Help
              </button>

              <LogoutButton />

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                Z
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}