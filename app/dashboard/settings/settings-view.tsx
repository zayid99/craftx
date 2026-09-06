"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CancelSubscriptionButton from "@/components/dashboard/cancel-subscription-button";
import { UserIcon, SettingsIcon, SearchIcon } from "@/components/marketing/landing-icons";

export interface ProfileDefaults {
  creatorName: string;
  niche: string;
  primaryPlatform: string;
  secondaryPlatforms: string[];
  contentFormat: string;
  contentStyle: string;
  audience: string;
  targetMarket: string;
  experienceLevel: string;
  goals: string;
  contentPillars: string[];
}

type Subscription = {
  plan: string;
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
  isCancelling: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

const PLAN_PERKS: Record<string, string[]> = {
    // Mirrors lib/entitlements/limits.ts. There is no "basic" tier — free users
  // get every studio, just a smaller one-time allocation.
  free: [
    "All five studios included",
    "A one-time set of free generations",
    "Creator profile context",
  ],
  creator: ["Unlimited ideas", "Full studio access", "Priority processing"],
  creator_pro: ["Higher usage limits", "Advanced insights", "Priority support"],
};

const PLATFORMS = ["YouTube", "YouTube Shorts", "TikTok", "Instagram Reels", "LinkedIn"];
const FORMATS = ["Short-form videos", "Long-form videos", "Tutorials", "Vlogs", "Talking head"];
const TONES = ["Conversational", "Educational", "Informative", "Energetic", "Storytelling", "Professional"];

type TabKey = "account" | "billing" | "defaults" | "security";

const TABS: { key: TabKey; label: string; Icon: typeof UserIcon }[] = [
  { key: "account", label: "Account", Icon: UserIcon },
  { key: "billing", label: "Plan & billing", Icon: SettingsIcon },
  { key: "defaults", label: "Defaults", Icon: SearchIcon },
  { key: "security", label: "Security", Icon: SettingsIcon },
];

function formatDate(s: string | null) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

interface Props {
  email: string;
  memberSince: string | null;
  defaults: ProfileDefaults | null;
}

export default function SettingsView({ email, memberSince, defaults }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("account");

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const [contentFormat, setContentFormat] = useState(defaults?.contentFormat ?? "");
  const [primaryPlatform, setPrimaryPlatform] = useState(defaults?.primaryPlatform ?? "");
  const [contentStyle, setContentStyle] = useState(defaults?.contentStyle ?? "");
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [defaultsMsg, setDefaultsMsg] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    setLoadingSub(true);
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) setSubscription(await res.json());
    } finally {
      setLoadingSub(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // The fetch runs inside the effect so no state is set synchronously on mount.
    (async () => {
      try {
        const res = await fetch("/api/subscription/status");
        if (res.ok && !cancelled) setSubscription(await res.json());
      } finally {
        if (!cancelled) setLoadingSub(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const plan = subscription?.plan ?? "free";
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const isPaid = plan !== "free";

  async function handleSaveDefaults() {
    if (!defaults) {
      setDefaultsMsg("Create your creator profile first.");
      return;
    }

    setSavingDefaults(true);
    setDefaultsMsg(null);

    try {
      // Send the whole profile back so nothing outside this tab is lost.
      const res = await fetch("/api/creator-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...defaults, contentFormat, primaryPlatform, contentStyle }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDefaultsMsg(data.error || "Could not save. Please try again.");
        return;
      }

      setDefaultsMsg("Defaults saved.");
      router.refresh();
    } catch {
      setDefaultsMsg("Could not save. Please try again.");
    } finally {
      setSavingDefaults(false);
    }
  }

  async function handleChangePassword() {
    setPasswordErr(null);
    setPasswordMsg(null);

    if (password.length < 8) {
      setPasswordErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordErr("Passwords don't match.");
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordErr(error.message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordMsg("Password updated.");
    } catch {
      setPasswordErr("Could not update your password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteErr(null);

    if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setDeleteErr("The email you typed doesn't match this account.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteErr(data.error || "Could not delete your account. Please try again.");
        return;
      }

      // The server already signed the session out; clear the local one too.
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleteErr("Could not delete your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const card = "rounded-2xl border border-[#ececf1] bg-white p-6";
  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]";
  const label = "mb-1.5 block text-sm font-medium text-[#374151]";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
          Settings
        </h2>
        <p className="mt-2 text-[#6b7280]">
          Manage your account, plan and workspace defaults.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ============ main ============ */}
        <div className="space-y-4">
          {/* tabs */}
          <div className="flex flex-wrap gap-1 border-b border-[#ececf1]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab === t.key
                    ? "border-[#6856fd] text-[#111827]"
                    : "border-transparent text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                <t.Icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ACCOUNT */}
          {tab === "account" && (
            <div className={card}>
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Account</h3>
              <p className="mt-1 text-sm text-[#6b7280]">Your sign-in details.</p>

              <dl className="mt-5 divide-y divide-[#f1f2f6]">
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-sm text-[#6b7280]">Email</dt>
                  <dd className="text-sm font-medium text-[#111827]">{email || "—"}</dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-sm text-[#6b7280]">Member since</dt>
                  <dd className="text-sm font-medium text-[#111827]">
                    {formatDate(memberSince) ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-sm text-[#6b7280]">Creator profile</dt>
                  <dd className="text-sm font-medium text-[#111827]">
                    {defaults ? (
                      <Link href="/creator-profile" className="text-[#5b5bd6] hover:underline">
                        Edit profile →
                      </Link>
                    ) : (
                      <Link href="/creator-profile" className="text-[#5b5bd6] hover:underline">
                        Set up →
                      </Link>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-[#f1f2f6] pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-[#e5e7eb] px-5 py-2.5 text-sm font-medium text-[#b91c1c] transition hover:bg-[#fef2f2]"
                >
                  Log out
                </button>
              </div>

              {/* Deleting is irreversible, so it asks for the account email
                  rather than a yes/no a stray click could get through. */}
              <div className="mt-6 rounded-xl border border-[#fecaca] bg-[#fffbfb] p-5">
                <p className="text-sm font-semibold text-[#b91c1c]">Delete account</p>
                <p className="mt-1.5 text-sm leading-6 text-[#6b7280]">
                                   Permanently removes your profile, saved ideas, scripts, SEO sets, content plans
                  and analyses. This cannot be undone.
                </p>

                {isPaid && !subscription?.isCancelling ? (
                  <p className="mt-4 rounded-lg bg-[#fff2e8] px-4 py-3 text-sm leading-6 text-[#ea580c]">
                    Cancel your subscription first, in Plan &amp; billing. You&apos;ll keep access
                    until the end of the period you&apos;ve paid for, and can delete your account
                    any time after that.
                  </p>
                ) : !deleteOpen ? (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="mt-4 rounded-xl border border-[#fecaca] bg-white px-5 py-2.5 text-sm font-medium text-[#b91c1c] transition hover:bg-[#fef2f2]"
                  >
                    Delete my account
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label htmlFor="confirmEmail" className="block text-sm font-medium text-[#374151]">
                      Type <span className="font-semibold text-[#111827]">{email}</span> to confirm
                    </label>
                    <input
                      id="confirmEmail"
                      type="email"
                      autoComplete="off"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="your email address"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#fecaca] sm:max-w-sm"
                    />

                    {deleteErr && (
                      <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
                        {deleteErr}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting || !confirmEmail}
                        className="rounded-xl bg-[#b91c1c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#991b1b] disabled:opacity-50"
                      >
                        {deleting ? "Deleting…" : "Permanently delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteOpen(false);
                          setConfirmEmail("");
                          setDeleteErr(null);
                        }}
                        disabled={deleting}
                        className="text-sm text-[#6b7280] transition hover:text-[#111827]"
                      >
                        Never mind
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BILLING */}
          {tab === "billing" && (
            <div className={card}>
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
                Plan &amp; billing
              </h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                Your current subscription and renewal details.
              </p>

              {loadingSub ? (
                <div className="mt-5 h-28 animate-pulse rounded-xl bg-[#f4f5f8]" />
              ) : (
                <>
                  <div className="mt-5 rounded-xl border border-[#ececf1] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-bold text-[#111827]">{planLabel}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            subscription?.isCancelling
                              ? "bg-[#fff2e8] text-[#ea580c]"
                              : "bg-[#e9f9f0] text-[#059669]"
                          }`}
                        >
                          {subscription?.isCancelling ? "Cancelling" : "Active"}
                        </span>
                      </div>

                      {!isPaid && (
                        <Link
                          href="/#pricing"
                          className="rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
                        >
                          Upgrade →
                        </Link>
                      )}
                    </div>

                    <ul className="mt-4 space-y-2">
                      {(PLAN_PERKS[plan] ?? []).map((p) => (
                        <li key={p} className="flex items-center gap-2 text-sm text-[#374151]">
                          <span className="text-[#059669]">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>

                    {subscription?.renewsAt && !subscription.isCancelling && (
                      <p className="mt-4 border-t border-[#f1f2f6] pt-4 text-sm text-[#6b7280]">
                        Renews on {formatDate(subscription.renewsAt)}.
                      </p>
                    )}

                    {subscription?.isCancelling && subscription.endsAt && (
                      <p className="mt-4 border-t border-[#f1f2f6] pt-4 text-sm text-[#ea580c]">
                        Your plan ends on {formatDate(subscription.endsAt)}. You keep full access
                        until then.
                      </p>
                    )}
                  </div>

                  {isPaid && !subscription?.isCancelling && (
                    <div className="mt-5 border-t border-[#f1f2f6] pt-5">
                      <CancelSubscriptionButton onCancelled={loadSubscription} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DEFAULTS */}
          {tab === "defaults" && (
            <div className={card}>
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
                Workspace defaults
              </h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                These pre-fill every studio. They&apos;re part of your creator profile.
              </p>

              {!defaults ? (
                <div className="mt-5 rounded-xl bg-[#fafafc] px-4 py-8 text-center">
                  <p className="text-sm text-[#6b7280]">
                    Set up your creator profile first to choose defaults.
                  </p>
                  <Link
                    href="/creator-profile"
                    className="mt-4 inline-flex rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
                  >
                    Set up profile →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="dFormat" className={label}>Default content type</label>
                      <input
                        id="dFormat"
                        list="fmt-opts"
                        value={contentFormat}
                        onChange={(e) => setContentFormat(e.target.value)}
                        placeholder="e.g. Long-form videos"
                        className={field}
                      />
                      <datalist id="fmt-opts">
                        {FORMATS.map((f) => <option key={f} value={f} />)}
                      </datalist>
                    </div>

                    <div>
                      <label htmlFor="dPlatform" className={label}>Default platform</label>
                      <select
                        id="dPlatform"
                        value={primaryPlatform}
                        onChange={(e) => setPrimaryPlatform(e.target.value)}
                        className={field}
                      >
                        <option value="">Select a platform</option>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="dTone" className={label}>Default tone</label>
                      <input
                        id="dTone"
                        list="tone-opts"
                        value={contentStyle}
                        onChange={(e) => setContentStyle(e.target.value)}
                        placeholder="e.g. Conversational"
                        className={field}
                      />
                      <datalist id="tone-opts">
                        {TONES.map((t) => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#f1f2f6] pt-5">
                    <button
                      type="button"
                      onClick={handleSaveDefaults}
                      disabled={savingDefaults}
                      className="rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
                    >
                      {savingDefaults ? "Saving…" : "Save defaults"}
                    </button>
                    {defaultsMsg && <span className="text-sm text-[#6b7280]">{defaultsMsg}</span>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* SECURITY */}
          {tab === "security" && (
            <div className={card}>
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Security</h3>
              <p className="mt-1 text-sm text-[#6b7280]">Change the password you sign in with.</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pw" className={label}>New password</label>
                  <input
                    id="pw"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="pw2" className={label}>Confirm new password</label>
                  <input
                    id="pw2"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter it"
                    className={field}
                  />
                </div>
              </div>

              {passwordErr && (
                <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                  {passwordErr}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#f1f2f6] pt-5">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={savingPassword || !password || !confirmPassword}
                  className="rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
                >
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
                {passwordMsg && <span className="text-sm text-[#059669]">{passwordMsg}</span>}
              </div>
            </div>
          )}
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-6">
          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Account overview</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b1020] text-lg font-semibold text-white">
                {(defaults?.creatorName?.[0] ?? email?.[0] ?? "C").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {defaults?.creatorName || email || "Creator"}
                </p>
                <p className="text-xs text-[#9ca3af]">{planLabel}</p>
              </div>
            </div>

            {memberSince && (
              <p className="mt-3 text-xs text-[#9ca3af]">
                Member since {formatDate(memberSince)}
              </p>
            )}

            <Link
              href="/creator-profile"
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
            >
              View profile
            </Link>
          </div>

          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Your plan</p>
            {loadingSub ? (
              <div className="mt-4 h-24 animate-pulse rounded-xl bg-[#f4f5f8]" />
            ) : (
              <>
                <div className="mt-4 flex items-center gap-2">
                  <p className="text-base font-semibold text-[#111827]">{planLabel}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      subscription?.isCancelling
                        ? "bg-[#fff2e8] text-[#ea580c]"
                        : "bg-[#e9f9f0] text-[#059669]"
                    }`}
                  >
                    {subscription?.isCancelling ? "Cancelling" : "Active"}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {(PLAN_PERKS[plan] ?? []).map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-[#6b7280]">
                      <span className="text-[#059669]">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setTab("billing")}
                  className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
                >
                  Manage plan
                </button>
              </>
            )}
          </div>

          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Need help?</p>
            <div className="mt-4 space-y-2">
              <Link
                href="/help"
                className="flex items-center justify-between rounded-xl border border-[#ececf1] px-4 py-3 text-sm transition hover:bg-[#fafafc]"
              >
                <span>
                  <span className="block font-medium text-[#111827]">Help centre</span>
                  <span className="block text-xs text-[#9ca3af]">Answers to common questions</span>
                </span>
                <span className="text-[#9ca3af]">→</span>
              </Link>

              <a
                href="mailto:craftxofficialbd@gmail.com"
                className="flex items-center justify-between rounded-xl border border-[#ececf1] px-4 py-3 text-sm transition hover:bg-[#fafafc]"
              >
                <span>
                  <span className="block font-medium text-[#111827]">Contact support</span>
                  <span className="block text-xs text-[#9ca3af]">We usually reply within a day</span>
                </span>
                <span className="text-[#9ca3af]">→</span>
              </a>
            </div>
          </div>

          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Policies</p>
            <div className="mt-4 space-y-1">
              {[
                { href: "/terms", label: "Terms of Service" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/refunds", label: "Refund Policy" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-[#6b7280] transition hover:bg-[#fafafc] hover:text-[#111827]"
                >
                  {l.label}
                  <span className="text-[#c3c7d0]">→</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}