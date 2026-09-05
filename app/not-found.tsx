import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafc] px-6">
      <div className="max-w-md text-center">
        <p className="text-[13px] tracking-[1.2px] text-[#9ca3af]">404</p>
        <h1 className="mt-3 text-[26px] font-bold text-[#111827]">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-3 text-[15px] leading-[24px] text-[#6b7280]">
          The link may be broken, or the page may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#0b1020] px-6 py-3 text-[15px] text-white transition hover:bg-[#1b2338]"
        >
          Back to home →
        </Link>
      </div>
    </main>
  );
}
