"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FolderIcon,
  UserIcon,
  TrendingUpIcon,
} from "@/components/marketing/landing-icons";

/**
 * These used to load PNGs from /public/decor, which don't exist — the browser
 * 404'd on every one and rendered an empty box. Using the same icon set as the
 * rest of the app means no image request, no layout shift, and colours that
 * follow the brand instead of a flat bitmap.
 */
const POINTS = [
  {
    title: "All-in-one workspace",
    body: "Ideas, scripts, SEO, planning and analysis in one place.",
    Icon: FolderIcon,
  },
  {
    title: "Knows your channel",
    body: "Every generation is shaped by your creator profile.",
    Icon: UserIcon,
  },
  {
    title: "Built for creators",
    body: "Made for people publishing every week, not enterprises.",
    Icon: TrendingUpIcon,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "That email and password don't match an account."
            : error.message
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not sign you in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]";

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundImage: "linear-gradient(120deg,#ffffff 0%,#f8f9fd 55%,#eef1fc 100%)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[120px] top-[10%] h-[420px] w-[420px] rounded-full opacity-60 blur-[110px]"
        style={{ background: "radial-gradient(circle,#d9d3ff 0%,transparent 70%)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[120px] bottom-[6%] h-[420px] w-[420px] rounded-full opacity-60 blur-[110px]"
        style={{ background: "radial-gradient(circle,#cfe1ff 0%,transparent 70%)" }}
      />

      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-[16px]">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/brand/craftx-logo.png"
              alt="CraftX"
              width={1780}
              height={356}
              priority
              className="h-[48px] w-auto"
            />
          </Link>
          <p className="text-[14.5px] text-[#6b7280]">
            No account yet?{" "}
            <Link href="/signup" className="font-medium text-[#5b5bd6] hover:underline">
              Sign up
            </Link>
          </p>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1180px] items-center gap-[56px] px-6 pb-[80px] pt-[28px] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        {/* left — why bother signing in */}
        <div className="hidden lg:block">
          <span className="inline-flex items-center gap-[9px] rounded-full border border-[#e3e5ef] bg-white/70 px-[16px] py-[7px] text-[12.5px] tracking-[1.1px] text-[#6b7280]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#7c5cff]" />
            THE CREATOR GROWTH WORKSPACE
          </span>

          <h1 className="mt-[22px] text-[46px] font-extrabold leading-[56px] tracking-[-1px] text-[#111827]">
            Welcome back,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              creator
            </span>
            <span className="text-[#6d5cf5]">.</span>
          </h1>

          <p className="mt-[16px] max-w-[420px] text-[16.5px] leading-[28px] text-[#4b5563]">
            Pick up where you left off — your saved ideas, scripts and plans are
            exactly where you left them.
          </p>

          <ul className="mt-[34px] space-y-[16px]">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-[14px]">
                <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border border-[#e9ebf3] bg-white text-[#6856fd]">
                  <p.Icon className="h-[22px] w-[22px]" />
                </span>
                <span>
                  <span className="block text-[15.5px] font-medium text-[#111827]">{p.title}</span>
                  <span className="mt-[2px] block text-[14px] leading-[21px] text-[#6b7280]">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* right — the form */}
        <div className="rounded-[22px] border border-[#ececf1] bg-white p-[32px] shadow-[0_20px_60px_rgba(17,19,24,0.07)]">
          <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#111827]">Log in</h2>
          <p className="mt-[6px] text-[15px] text-[#6b7280]">Continue to your workspace.</p>

          <form onSubmit={handleLogin} className="mt-[26px] space-y-[16px]">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#374151]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${field} pr-[68px]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#6b7280] transition hover:text-[#111827]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0b1020] px-5 py-3 text-[15px] font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-[20px] border-t border-[#f1f2f6] pt-[18px] text-center text-[14.5px] text-[#6b7280]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-[#5b5bd6] hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 border-t border-[#eceef2] bg-white/60">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-[10px] px-6 py-[20px] text-[13.5px] text-[#9ca3af] sm:flex-row sm:items-center sm:justify-between">
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