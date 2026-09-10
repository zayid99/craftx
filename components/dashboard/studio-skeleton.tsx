/**
 * Rendered instantly by Next.js while a studio's server component fetches.
 *
 * Without a loading.tsx in a route folder, Next holds the PREVIOUS page on
 * screen until the new one is fully ready — so a 2s fetch feels like a frozen
 * app rather than a loading one. This doesn't make anything faster; it makes
 * the wait legible, which is most of the perceived problem.
 *
 * Deliberately dumb: no data, no client JS, no props. It has to render before
 * anything is known about the page.
 */
export default function StudioSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1500px] animate-pulse space-y-4 sm:space-y-6">
      {/* header */}
      <div>
        <div className="h-7 w-[130px] rounded-full bg-[#f1f2f6]" />
        <div className="mt-3 h-8 w-[85%] rounded-lg bg-[#f1f2f6] sm:mt-4 sm:h-10 sm:w-[60%]" />
        <div className="mt-2 h-4 w-[70%] rounded bg-[#f4f5f8]" />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* input card */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
            <div className="h-5 w-[55%] rounded bg-[#f1f2f6]" />
            <div className="mt-2 h-4 w-[75%] rounded bg-[#f4f5f8]" />
            <div className="mt-5 h-[110px] w-full rounded-xl bg-[#fafafc]" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="h-[46px] rounded-xl bg-[#fafafc]" />
              <div className="h-[46px] rounded-xl bg-[#fafafc]" />
            </div>
            <div className="mt-5 h-[46px] w-full rounded-xl bg-[#f1f2f6] sm:w-[180px]" />
          </div>

          {/* results placeholder */}
          <div className="h-[180px] rounded-2xl border border-dashed border-[#ececf1] bg-[#fafafc]" />
        </div>

        {/* right rail */}
        <aside className="block max-xl:hidden space-y-4 sm:space-y-6">
          <div className="h-[220px] rounded-2xl border border-[#ececf1] bg-white" />
          <div className="h-[160px] rounded-2xl border border-[#ececf1] bg-white" />
        </aside>
      </div>
    </div>
  );
}