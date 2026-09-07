"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/auth/google-button";
import {
  LightbulbIcon,
  UserIcon,
  PlayCircleIcon,
  CalendarIcon,
} from "@/components/marketing/landing-icons";

/**
 * These used to load PNGs from /public/decor, which don't exist — the browser
 * 404'd on every one and rendered an empty box. Using the same icon set as the
 * rest of the app means no image request, no layout shift, and colours that
 * follow the brand instead of a flat bitmap.
 *
 * Coaching removed from the copy: Creator Coach is disabled pre-launch, so
 * promising it on the signup page is a promise the product can't keep.
 */
const FEATURES = [
  {
    title: "Five AI studios",
    body: "Ideas, scripts, SEO, planning and analysis.",
    Icon: LightbulbIcon,
  },
  {
    title: "Shaped by your profile",
    body: "Your niche, audience and goals feed every generation.",
    Icon: UserIcon,
  },
  {
    title: "See what's working",
    body: "Score a script out of 100 and get the weak points named.",
    Icon: PlayCircleIcon,
  },
  {
    title: "Plan ahead",
    body: "Build a 7, 14 or 30-day schedule you can actually follow.",
    Icon: CalendarIcon,
  },
];

/** Matches the minimum enforced in Settings, so the rule never changes on you. */
const MIN_PASSWORD = 8;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setError(
          error.message.includes("already registered")
            ? "An account with that email already exists. Try logging in instead."
            : error.message
        );
        return;
      }

      // With email confirmation switched on, Supabase returns no session — the
      // user has to click the link first. Sending them to /dashboard here would
      // just bounce them back to /login with no explanation.
      if (!data.session) {
        setCheckInbox(true);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * 16px on mobile is not a style choice. iOS Safari zooms the viewport
   * whenever a focused input has a font-size below 16px, and it does not zoom
   * back out afterwards — the page just stays shifted sideways. This is the
   * form a paying customer meets first; keep the mobile value at 16px and
   * step down to 14px only from sm: upward.
   */
  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] outline-none transition focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
      {/* ============ left: the pitch ============ */}
      <aside
        className="relative hidden overflow-hidden p-[52px] lg:flex lg:flex-col lg:justify-center"
        style={{
          backgroundImage:
            "linear-gradient(150deg,#0b1020 0%,#141a33 45%,#2c2464 78%,#4a3a86 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[80px] top-[12%] h-[360px] w-[360px] rounded-full opacity-40 blur-[100px]"
          style={{ background: "radial-gradient(circle,#6856fd 0%,transparent 70%)" }}
        />

        <div className="relative max-w-[440px]">
          <Link href="/" className="inline-flex">
            <Image
              src="/brand/craftx-logo.png"
              alt="CraftX"
              width={1780}
              height={356}
              priority
              className="h-[52px] w-auto brightness-0 invert"
            />
          </Link>

          <h1 className="mt-[34px] text-[40px] font-bold leading-[50px] tracking-[-0.8px] text-white">
            Everything you need to{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#8fa6ff,#7fd3ff)" }}
            >
              create and grow
            </span>
            .
          </h1>

          <p className="mt-[16px] text-[16.5px] leading-[28px] text-[#b8bdd4]">
            Start free. All five tools, no card required, no trial to expire.
          </p>

          <ul className="mt-[36px] space-y-[20px]">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-[14px]">
                <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] border border-white/[0.12] bg-white/[0.07] text-[#8fa6ff]">
                  <f.Icon className="h-[21px] w-[21px]" />
                </span>
                <span>
                  <span className="block text-[15.5px] font-medium text-white">{f.title}</span>
                  <span className="mt-[2px] block text-[14px] leading-[21px] text-[#b8bdd4]">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ============ right: the form ============ */}
      <main className="flex min-h-screen flex-col bg-white">
        {/* A 44px logo is 220px wide at this 5:1 aspect ratio; with the log-in
            line beside it the row overflowed a 390px viewport. */}
        <header className="flex items-center justify-between gap-4 px-5 py-[12px] sm:px-6 sm:py-[16px] lg:px-[52px]">
          <Link href="/" className="flex min-w-0 shrink items-center lg:hidden">
            <Image
              src="/brand/craftx-logo.png"
              alt="CraftX"
              width={1780}
              height={356}
              className="h-[32px] w-auto sm:h-[44px]"
            />
          </Link>
          <p className="ml-auto shrink-0 text-[13px] text-[#6b7280] sm:text-[14.5px]">
            <Link href="/login" className="font-medium text-[#5b5bd6] hover:underline">
              Log in
            </Link>
          </p>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-[24px] sm:px-6 sm:py-[32px] lg:px-[52px]">
          <div className="w-full max-w-[420px]">
            {checkInbox ? (
              <div className="rounded-[20px] border border-[#ececf1] bg-[#fafbfd] p-[22px] text-center sm:p-[32px]">
                <span className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-[#e9f9f0] text-[22px] text-[#059669]">
                  ✓
                </span>
                <h2 className="mt-[18px] text-[21px] font-bold tracking-[-0.3px] text-[#111827] sm:text-[22px]">
                  Check your inbox
                </h2>
                <p className="mt-[10px] text-[15px] leading-[25px] text-[#6b7280]">
                  We sent a confirmation link to{" "}
                  <span className="break-all font-medium text-[#111827]">{email}</span>. Click it to
                  activate your account, then log in.
                </p>
                <Link
                  href="/login"
                  className="mt-[22px] inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#1b2338] sm:py-3"
                >
                  Go to login
                </Link>
                <p className="mt-[14px] text-[13.5px] text-[#9ca3af]">
                  Nothing after a few minutes? Check your spam folder.
                </p>
              </div>
            ) : (
              <>
                <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[14px] py-[6px] text-[12px] tracking-[1.1px] text-[#5b5bd6]">
                  FREE TO START
                </span>

                <h2 className="mt-[16px] text-[27px] font-bold tracking-[-0.5px] text-[#111827] sm:text-[30px]">
                  Create your account
                </h2>
                <p className="mt-[8px] text-[15px] leading-[25px] text-[#6b7280]">
                  All five tools on the free plan. No credit card needed.
                </p>

                <div className="mt-[22px] sm:mt-[26px]">
                  <GoogleButton label="Sign up with Google" />
                </div>

                <form onSubmit={handleSignup} className="mt-0 space-y-[16px]">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#374151]">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      /* Without these a mobile keyboard capitalises and
                         autocorrects the address on the way in. */
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

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#374151]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
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

                  {/* 15px was below the 24px minimum for a comfortable touch
                      target, and this checkbox gates the submit button. */}
                  <label className="flex cursor-pointer items-start gap-[10px] py-[2px] text-[14px] leading-[21px] text-[#6b7280]">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-[2px] h-[18px] w-[18px] shrink-0 rounded border-[#d8d9e4] accent-[#6856fd]"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="text-[#5b5bd6] hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-[#5b5bd6] hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {error && (
                    <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-5 py-3.5 text-[15px] font-medium text-white transition hover:opacity-95 disabled:opacity-50 sm:py-3"
                    style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
                  >
                    {loading ? "Creating account…" : "Create free account →"}
                  </button>
                </form>

                {/* The Google button skips the Terms checkbox above, so consent
                    has to be stated somewhere the user will actually see it —
                    next to the buttons, not in the page footer. */}
                <p className="mt-4 text-[13px] leading-[19px] text-[#9ca3af]">
                  By continuing with Google, you agree to our{" "}
                  <Link href="/terms" className="text-[#5b5bd6] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#5b5bd6] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>

                <div className="mt-[22px] flex items-start gap-[12px] rounded-[14px] border border-[#e9ebf3] bg-[#fafbfd] p-[14px] sm:p-[16px]">
                  <span className="mt-[1px] text-[16px]">🔒</span>
                  <p className="text-[13.5px] leading-[21px] text-[#6b7280]">
                    Your work stays private. We never use your content to train AI models, and we
                    don&apos;t sell your data.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="border-t border-[#eceef2] px-5 py-[16px] sm:px-6 sm:py-[18px] lg:px-[52px]">
          <div className="flex flex-col gap-[10px] text-[13px] text-[#9ca3af] sm:flex-row sm:items-center sm:justify-between sm:text-[13.5px]">
            <span>© 2026 CraftX. All rights reserved.</span>
            <div className="flex flex-wrap gap-[18px]">
              <Link href="/terms" className="transition hover:text-[#111827]">Terms</Link>
              <Link href="/privacy" className="transition hover:text-[#111827]">Privacy</Link>
              <Link href="/refunds" className="transition hover:text-[#111827]">Refunds</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}