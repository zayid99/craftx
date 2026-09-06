import Link from "next/link";
import Image from "next/image";
import { LEGAL_CONTACT } from "./legal-ui";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#eceef2]">
        <div className="mx-auto flex w-full max-w-[820px] items-center justify-between px-6 py-[14px]">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/brand/craftx-logo.png"
              alt="CraftX"
              width={1780}
              height={356}
              className="h-[46px] w-auto"
            />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#e5e7eb] px-[20px] py-[9px] text-[14.5px] text-[#111827] transition hover:bg-[#f7f8fa]"
          >
            Back to CraftX
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] px-6 pb-[80px] pt-[48px]">{children}</main>

      <footer className="border-t border-[#eceef2]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-[12px] px-6 py-[28px] text-[14px] text-[#9ca3af] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 CraftX. All rights reserved.</span>
          <div className="flex flex-wrap gap-[20px]">
            <Link href="/terms" className="transition hover:text-[#111827]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[#111827]">Privacy</Link>
            <Link href="/refunds" className="transition hover:text-[#111827]">Refunds</Link>
            <a href={`mailto:${LEGAL_CONTACT}`} className="transition hover:text-[#111827]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
