"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * Kicks off the Google OAuth flow.
 *
 * redirectTo points at /auth/callback on THIS origin, so it works on
 * localhost and on craftxapp.com without a code change. That path must also
 * be covered by the Redirect URLs allow-list in Supabase (the /** wildcards),
 * or Supabase refuses to send the user back.
 *
 * On success the browser leaves for Google, so there's no success state to
 * handle here — only failure to launch.
 */
export default function GoogleButton({
  label = "Continue with Google",
}: {
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError("Could not start Google sign-in. Please try again.");
        setLoading(false);
      }
      // No else: a successful call navigates away from this page.
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-5 py-3 text-[15px] font-medium text-[#111827] transition hover:bg-[#f7f8fa] disabled:opacity-50"
      >
        <GoogleMark className="h-[18px] w-[18px] shrink-0" />
        {loading ? "Redirecting…" : label}
      </button>

      {error && (
        <p className="mt-2 text-sm text-[#b91c1c]">{error}</p>
      )}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#eceef2]" />
        <span className="text-[13px] text-[#9ca3af]">or</span>
        <span className="h-px flex-1 bg-[#eceef2]" />
      </div>
    </div>
  );
}