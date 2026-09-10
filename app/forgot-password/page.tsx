"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const params = useSearchParams();
  const linkError = params.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });

      if (error) {
        setError("Could not send the reset link right now. Please try again.");
        return;
      }

      /**
       * Always show the same confirmation, whether or not the address has an
       * account. Saying "no account with that email" turns this form into a
       * way to check which addresses are registered.
       */
      setSent(true);
    } catch {
      setError("Could not send the reset link right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] outline-none transition focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ backgroundImage: "linear-gradient(120deg,#ffffff 0%,#f8f9fd 55%,#eef1fc 100%)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[120px] top-[10%] h-[420px] w-[420px] rounded-full opacity-60 blur-[110px]"
        style={{ background: "radial-gradient(circle,#d9d3ff 0%,transparent 70%)" }}
      />

      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-[1180px] items-center px-5 py-[12px] sm:px-6 sm:py-[16px]">
          <Link href="/" className="flex min-w-0 shrink items-center">
            <Image
              src="/brand/craftx-logo.png"
              alt="CraftX"
              width={1780}
              height={356}
              priority
              className="h-[34px] w-auto sm:h-[48px]"
            />
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-[32px] sm:px-6">
        <div className="w-full max-w-[440px] rounded-[22px] border border-[#ececf1] bg-white p-[22px] shadow-[0_20px_60px_rgba(17,19,24,0.07)] sm:p-[32px]">
          {sent ? (
            <>
              <span className="flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[#e9f9f0] text-[20px] text-[#059669]">
                ✓
              </span>
              <h1 className="mt-[18px] text-[22px] font-bold tracking-[-0.4px] text-[#111827] sm:text-[24px]">
                Check your inbox
              </h1>
              <p className="mt-[10px] text-[15px] leading-[25px] text-[#6b7280]">
                If an account exists for{" "}
                <span className="break-all font-medium text-[#111827]">{email}</span>, we&apos;ve
                sent a link to reset your password. It expires in an hour.
              </p>
              <p className="mt-[14px] text-[13.5px] leading-[21px] text-[#9ca3af]">
                Nothing after a few minutes? Check your spam folder, and make sure you used the
                address you signed up with.
              </p>

              <Link
                href="/login"
                className="mt-[22px] inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#1b2338] sm:py-3"
              >
                Back to login
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
                className="mt-[12px] w-full py-2 text-center text-[14px] text-[#6b7280] transition hover:text-[#111827]"
              >
                Use a different email
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-bold tracking-[-0.4px] text-[#111827] sm:text-[24px]">
                Reset your password
              </h1>
              <p className="mt-[6px] text-[15px] leading-[25px] text-[#6b7280]">
                Enter the email you signed up with and we&apos;ll send you a link.
              </p>

              {linkError && (
                <p className="mt-[18px] rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm leading-6 text-[#c2410c]">
                  {linkError === "expired"
                    ? "That reset link has expired or was already used. Request a new one below."
                    : "That link wasn't valid. Request a new one below."}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-[22px] space-y-[16px]">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={field}
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-xl bg-[#0b1020] px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:py-3"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="mt-[20px] border-t border-[#f1f2f6] pt-[18px] text-center text-[14.5px] text-[#6b7280]">
                Remembered it?{" "}
                <Link href="/login" className="font-medium text-[#5b5bd6] hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-[#eceef2] bg-white/60">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-[10px] px-5 py-[18px] text-[13px] text-[#9ca3af] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-[20px] sm:text-[13.5px]">
          <span>© 2026 CraftX. All rights reserved.</span>
          <div className="flex flex-wrap gap-[18px]">
            <Link href="/terms" className="transition hover:text-[#111827]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[#111827]">Privacy</Link>
            <Link href="/refunds" className="transition hover:text-[#111827]">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}