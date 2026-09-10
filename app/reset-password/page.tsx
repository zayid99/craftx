"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Matches the minimum enforced on signup and in Settings. */
const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  /**
   * /auth/confirm establishes a recovery session before redirecting here, so
   * the presence of a session IS the proof that this person controls the
   * inbox. No session means the link expired, was already used, or someone
   * navigated to this URL directly — all of which get sent back to request a
   * fresh link rather than shown a password form that would fail on submit.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setHasSession(Boolean(data.session));
      } catch {
        if (!cancelled) setHasSession(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setDone(true);
      // They're already signed in on this device, so send them straight in.
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch {
      setError("Could not update your password. Please try again.");
    } finally {
      setSaving(false);
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
        className="pointer-events-none absolute -right-[120px] bottom-[6%] h-[420px] w-[420px] rounded-full opacity-60 blur-[110px]"
        style={{ background: "radial-gradient(circle,#cfe1ff 0%,transparent 70%)" }}
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
          {checking ? (
            <div className="space-y-3">
              <div className="h-6 w-[60%] animate-pulse rounded bg-[#f1f2f6]" />
              <div className="h-4 w-[85%] animate-pulse rounded bg-[#f4f5f8]" />
              <div className="h-[46px] w-full animate-pulse rounded-xl bg-[#fafafc]" />
            </div>
          ) : !hasSession ? (
            <>
              <span className="flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[#fff7ed] text-[20px] text-[#c2410c]">
                !
              </span>
              <h1 className="mt-[18px] text-[22px] font-bold tracking-[-0.4px] text-[#111827] sm:text-[24px]">
                This link has expired
              </h1>
              <p className="mt-[10px] text-[15px] leading-[25px] text-[#6b7280]">
                Reset links work once and expire after an hour. Request a new one and it&apos;ll
                arrive in a moment.
              </p>
              <Link
                href="/forgot-password"
                className="mt-[22px] inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#1b2338] sm:py-3"
              >
                Request a new link
              </Link>
            </>
          ) : done ? (
            <>
              <span className="flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[#e9f9f0] text-[20px] text-[#059669]">
                ✓
              </span>
              <h1 className="mt-[18px] text-[22px] font-bold tracking-[-0.4px] text-[#111827] sm:text-[24px]">
                Password updated
              </h1>
              <p className="mt-[10px] text-[15px] leading-[25px] text-[#6b7280]">
                Taking you to your workspace…
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-bold tracking-[-0.4px] text-[#111827] sm:text-[24px]">
                Choose a new password
              </h1>
              <p className="mt-[6px] text-[15px] leading-[25px] text-[#6b7280]">
                You&apos;ll be signed in straight after.
              </p>

              <form onSubmit={handleSubmit} className="mt-[22px] space-y-[16px]">
                <div>
                  <label htmlFor="pw" className="mb-1.5 block text-sm font-medium text-[#374151]">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="pw"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={MIN_PASSWORD}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={`At least ${MIN_PASSWORD} characters`}
                      className={`${field} pr-[68px]`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-0 flex h-full items-center px-[14px] text-[13px] font-medium text-[#6b7280] transition hover:text-[#111827]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="pw2" className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Confirm new password
                  </label>
                  <input
                    id="pw2"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter it"
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
                  disabled={saving || !password || !confirm}
                  className="w-full rounded-xl bg-[#0b1020] px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:py-3"
                >
                  {saving ? "Updating…" : "Update password"}
                </button>
              </form>
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