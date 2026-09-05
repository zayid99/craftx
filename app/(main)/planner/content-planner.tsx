"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import { CalendarIcon, LightbulbIcon } from "@/components/marketing/landing-icons";

type PlanDay = {
  day: number;
  pillar: string;
  topic: string;
  format: string;
  hook: string;
  notes: string;
};

type PlanResult = {
  pillars: string[];
  days: PlanDay[];
};

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

export interface IdeaOption {
  id: string;
  title: string;
  platform: string | null;
  niche: string;
}

const PLATFORMS = ["YouTube Shorts", "YouTube", "TikTok", "Instagram Reels", "LinkedIn"];
const DURATIONS = [7, 14, 30];
const FREQUENCIES = ["Daily", "5x per week", "3x per week", "2x per week", "Weekly"];

/** Stable palette so a given format keeps its colour across the page. */
const SWATCHES = [
  { bg: "bg-[#eef4ff]", text: "text-[#2563eb]", hex: "#3b82f6" },
  { bg: "bg-[#f3eeff]", text: "text-[#7c3aed]", hex: "#8b5cf6" },
  { bg: "bg-[#e9f9f0]", text: "text-[#059669]", hex: "#10b981" },
  { bg: "bg-[#fff2e8]", text: "text-[#ea580c]", hex: "#f97316" },
  { bg: "bg-[#fdeef6]", text: "text-[#db2777]", hex: "#ec4899" },
  { bg: "bg-[#eef0fb]", text: "text-[#5b5bd6]", hex: "#6856fd" },
];

function swatchFor(value: string, all: string[]) {
  const i = Math.max(0, all.indexOf(value));
  return SWATCHES[i % SWATCHES.length];
}

interface Props {
  savedItems: SavedItem[];
  ideaOptions: IdeaOption[];
  plan: string;
  defaultNiche: string;
  defaultPlatform: string;
  defaultGoals: string;
}

export default function ContentPlanner({
  savedItems,
  ideaOptions,
  plan,
  defaultNiche,
  defaultPlatform,
  defaultGoals,
}: Props) {
  const [niche, setNiche] = useState(defaultNiche);
  const [platform, setPlatform] = useState(
    PLATFORMS.includes(defaultPlatform) ? defaultPlatform : "YouTube Shorts"
  );
  const [goals, setGoals] = useState(defaultGoals);
  const [durationDays, setDurationDays] = useState(7);
  const [autoFill, setAutoFill] = useState(true);
  const [postingFrequency, setPostingFrequency] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [week, setWeek] = useState(0);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  /** Bumped after any generate attempt that touched the quota. */
  const [usageRefresh, setUsageRefresh] = useState(0);

  /* ---- Real distribution, computed from the generated days ---- */
  const mix = useMemo(() => {
    if (!result) return [];
    const counts = new Map<string, number>();
    result.days.forEach((d) => counts.set(d.format, (counts.get(d.format) ?? 0) + 1));
    const formats = [...counts.keys()];
    return formats.map((f) => ({
      label: f,
      count: counts.get(f) ?? 0,
      pct: Math.round(((counts.get(f) ?? 0) / result.days.length) * 100),
      hex: swatchFor(f, formats).hex,
    }));
  }, [result]);

  const pillarCounts = useMemo(() => {
    if (!result) return [];
    const counts = new Map<string, number>();
    result.days.forEach((d) => counts.set(d.pillar, (counts.get(d.pillar) ?? 0) + 1));
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  }, [result]);

  const weeks = useMemo(() => {
    if (!result) return [];
    const out: PlanDay[][] = [];
    for (let i = 0; i < result.days.length; i += 7) out.push(result.days.slice(i, i + 7));
    return out;
  }, [result]);

  const donut = useMemo(() => {
    if (!mix.length) return "none";
    let acc = 0;
    const stops = mix.map((m) => {
      const from = acc;
      acc += m.pct * 3.6;
      return `${m.hex} ${from}deg ${acc}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [mix]);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
  }

  function updateDay(dayNumber: number, field: keyof PlanDay, value: string) {
    if (!result) return;
    setResult({
      ...result,
      days: result.days.map((d) => (d.day === dayNumber ? { ...d, [field]: value } : d)),
    });
  }

  async function handleGenerate() {
    if (!niche.trim()) {
      setError("Please enter a niche.");
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setResult(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform, goals, durationDays, autoFill, postingFrequency }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setUpgradeInfo({
            plan: data.plan,
            message: data.error,
            currentUsage: data.currentUsage ?? null,
            limit: data.limit ?? null,
          });
          setUsageRefresh((n) => n + 1);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data);
      setWeek(0);
      setFormOpen(false);
      setUsageRefresh((n) => n + 1);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/planner/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          platform,
          goals,
          durationDays,
          autoFill,
          pillars: result.pillars,
          days: result.days,
        }),
      });

      if (!res.ok) {
        setSavedMessage("Failed to save. Please try again.");
        return;
      }

      setSavedMessage("Saved — it appears below after you refresh.");
    } catch {
      setSavedMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]";
  const label = "mb-1.5 block text-sm font-medium text-[#374151]";
  const smallBtn =
    "shrink-0 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#374151] transition hover:bg-[#f7f8fa]";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            CONTENT PLANNER
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
            Plan today. Post with purpose.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              Grow consistently.
            </span>
          </h2>

          <p className="mt-2 text-[#6b7280]">
            Organize your content, plan ahead and never run out of ideas.
          </p>
        </div>

        <p className="hidden max-w-[210px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)] lg:block">
          Consistency creates growth.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ============ main ============ */}
        <div className="space-y-4">
          {/* setup form */}
          <div className="rounded-2xl border border-[#ececf1] bg-white">
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
                  {result ? "Plan settings" : "Set up your content plan"}
                </h3>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {result
                    ? `${durationDays} days · ${platform} · ${niche || "no niche set"}`
                    : "Tell CraftX your niche, platform and how far ahead to plan."}
                </p>
              </div>
              <span className={`text-[#9ca3af] transition-transform ${formOpen ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>

            {formOpen && (
              <div className="border-t border-[#ececf1] p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label htmlFor="niche" className={label}>Niche</label>
                    <input
                      id="niche"
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. productivity for students"
                      className={field}
                    />
                  </div>

                  <div>
                    <label htmlFor="platform" className={label}>Platform</label>
                    <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className={field}>
                      {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="freq" className={label}>
                      Posting frequency <span className="text-[#9ca3af]">(optional)</span>
                    </label>
                    <input
                      id="freq"
                      type="text"
                      list="freq-opts"
                      value={postingFrequency}
                      onChange={(e) => setPostingFrequency(e.target.value)}
                      placeholder="e.g. 3x per week"
                      className={field}
                    />
                    <datalist id="freq-opts">
                      {FREQUENCIES.map((f) => <option key={f} value={f} />)}
                    </datalist>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="goals" className={label}>
                      Goals <span className="text-[#9ca3af]">(optional)</span>
                    </label>
                    <input
                      id="goals"
                      type="text"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="e.g. grow to 10k subscribers"
                      className={field}
                    />
                  </div>

                  <div>
                    <span className={label}>Plan length</span>
                    <div className="flex gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDurationDays(d)}
                          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            durationDays === d
                              ? "border-transparent bg-[#0b1020] text-white"
                              : "border-[#e5e7eb] text-[#374151] hover:bg-[#f7f8fa]"
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="mt-4 flex items-center gap-2.5 text-sm text-[#374151]">
                  <input
                    type="checkbox"
                    checked={autoFill}
                    onChange={(e) => setAutoFill(e.target.checked)}
                    className="h-4 w-4 rounded border-[#d8d9e4]"
                  />
                  Auto-fill every day with a topic
                </label>

                {/* remaining quota */}
                <div className="mt-5 border-t border-[#f1f2f6] pt-4">
                  <UsageMeter feature="planner" refreshKey={usageRefresh} />
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !niche.trim()}
                  className="mt-4 rounded-xl bg-[#0b1020] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
                >
                  {loading ? "Building your plan…" : result ? "Regenerate plan →" : "Generate plan →"}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {error}
            </div>
          )}

          {upgradeInfo && (
            <UpgradePrompt
              plan={upgradeInfo.plan}
              message={upgradeInfo.message}
              currentUsage={upgradeInfo.currentUsage}
              limit={upgradeInfo.limit}
            />
          )}

          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#ececf1] bg-[#fafafc]" />
              ))}
            </div>
          )}

          {/* the plan */}
          {!loading && result && (
            <div className="rounded-2xl border border-[#ececf1] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf1] px-6 py-4">
                <div className="flex flex-wrap items-center gap-1">
                  {weeks.length > 1 ? (
                    weeks.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setWeek(i)}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                          week === i ? "bg-[#eef0fb] text-[#5b5bd6]" : "text-[#6b7280] hover:text-[#111827]"
                        }`}
                      >
                        Week {i + 1}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-[#111827]">
                      {result.days.length}-day plan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copy(
                        "plan",
                        result.days
                          .map(
                            (d) =>
                              `Day ${d.day} — ${d.topic}\nPillar: ${d.pillar} | Format: ${d.format}\nHook: ${d.hook}\nNotes: ${d.notes}`
                          )
                          .join("\n\n")
                      )
                    }
                    className={smallBtn}
                  >
                    {copiedKey === "plan" ? "Copied ✓" : "Copy plan"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-[#0b1020] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save plan"}
                  </button>
                </div>
              </div>

              {savedMessage && (
                <p className="border-b border-[#ececf1] bg-[#fafafc] px-6 py-2.5 text-sm text-[#6b7280]">
                  {savedMessage}
                </p>
              )}

              <ul className="divide-y divide-[#f1f2f6]">
                {(weeks[week] ?? []).map((d) => {
                  const s = swatchFor(d.format, mix.map((m) => m.label));
                  const isEditing = editingDay === d.day;

                  return (
                    <li key={d.day} className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f4f5f8]">
                          <span className="text-[10px] uppercase text-[#9ca3af]">Day</span>
                          <span className="text-sm font-bold text-[#111827]">{d.day}</span>
                        </span>

                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                aria-label="Topic"
                                value={d.topic}
                                onChange={(e) => updateDay(d.day, "topic", e.target.value)}
                                className={field}
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                  aria-label="Pillar"
                                  value={d.pillar}
                                  onChange={(e) => updateDay(d.day, "pillar", e.target.value)}
                                  placeholder="Pillar"
                                  className={field}
                                />
                                <input
                                  aria-label="Format"
                                  value={d.format}
                                  onChange={(e) => updateDay(d.day, "format", e.target.value)}
                                  placeholder="Format"
                                  className={field}
                                />
                              </div>
                              <input
                                aria-label="Hook"
                                value={d.hook}
                                onChange={(e) => updateDay(d.day, "hook", e.target.value)}
                                placeholder="Hook"
                                className={field}
                              />
                              <textarea
                                aria-label="Notes"
                                rows={2}
                                value={d.notes}
                                onChange={(e) => updateDay(d.day, "notes", e.target.value)}
                                placeholder="Notes"
                                className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-[#c9c6f6]"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-[15px] font-semibold leading-6 text-[#111827]">
                                {d.topic}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${s.bg} ${s.text}`}>
                                  {d.format}
                                </span>
                                <span className="rounded-full bg-[#f4f5f8] px-2.5 py-1 text-[11px] text-[#6b7280]">
                                  {d.pillar}
                                </span>
                              </div>
                              {d.hook && (
                                <p className="mt-3 text-sm leading-6 text-[#374151]">
                                  <span className="text-[#9ca3af]">Hook: </span>
                                  {d.hook}
                                </p>
                              )}
                              {d.notes && (
                                <p className="mt-1.5 text-sm leading-6 text-[#6b7280]">{d.notes}</p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingDay(isEditing ? null : d.day)}
                            className={smallBtn}
                          >
                            {isEditing ? "Done" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copy(
                                `d-${d.day}`,
                                `Day ${d.day} — ${d.topic}\nPillar: ${d.pillar} | Format: ${d.format}\nHook: ${d.hook}\nNotes: ${d.notes}`
                              )
                            }
                            className={smallBtn}
                          >
                            {copiedKey === `d-${d.day}` ? "Copied ✓" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!loading && !result && !error && !upgradeInfo && (
            <div className="rounded-2xl border border-dashed border-[#dfe1e8] bg-white/60 px-6 py-16 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff2e8] text-[#f97316]">
                <CalendarIcon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-[#374151]">No plan yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
                Set your niche and plan length above to build your first schedule.
              </p>
            </div>
          )}
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-sm font-semibold text-[#111827]">Plan overview</p>

            {result ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#eef4ff] p-3">
                  <p className="text-lg font-bold text-[#111827]">{result.days.length}</p>
                  <p className="text-xs text-[#6b7280]">Days planned</p>
                </div>
                <div className="rounded-xl bg-[#f3eeff] p-3">
                  <p className="text-lg font-bold text-[#111827]">{result.pillars.length}</p>
                  <p className="text-xs text-[#6b7280]">Content pillars</p>
                </div>
                <div className="rounded-xl bg-[#e9f9f0] p-3">
                  <p className="text-lg font-bold text-[#111827]">{mix.length}</p>
                  <p className="text-xs text-[#6b7280]">Formats used</p>
                </div>
                <div className="rounded-xl bg-[#fff2e8] p-3">
                  <p className="text-lg font-bold text-[#111827]">{weeks.length}</p>
                  <p className="text-xs text-[#6b7280]">Weeks</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-[#fafafc] px-4 py-8 text-center text-sm leading-6 text-[#9ca3af]">
                Generate a plan to see its breakdown.
              </p>
            )}
          </div>

          {result && mix.length > 0 && (
            <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
              <p className="text-sm font-semibold text-[#111827]">Content mix</p>
              <p className="mt-1 text-xs text-[#9ca3af]">Formats across your plan.</p>

              <div className="mt-5 flex items-center gap-5">
                <div
                  className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: donut }}
                >
                  <div className="h-[58px] w-[58px] rounded-full bg-white" />
                </div>

                <ul className="min-w-0 flex-1 space-y-2">
                  {mix.map((m) => (
                    <li key={m.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.hex }} />
                        <span className="truncate text-[#374151]">{m.label}</span>
                      </span>
                      <span className="shrink-0 text-[#9ca3af]">
                        {m.pct}% ({m.count})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result && pillarCounts.length > 0 && (
            <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
              <p className="text-sm font-semibold text-[#111827]">Pillar balance</p>
              <ul className="mt-4 space-y-3">
                {pillarCounts.map((p) => {
                  const pct = Math.round((p.count / result.days.length) * 100);
                  return (
                    <li key={p.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-[#374151]">{p.label}</span>
                        <span className="shrink-0 text-[#9ca3af]">
                          {p.count} {p.count === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f2f6]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#111827]">Ideas to plan</p>
              <Link href="/ideas" className="text-xs font-medium text-[#5b5bd6] hover:underline">
                View all
              </Link>
            </div>

            {ideaOptions.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[#fafafc] px-4 py-6 text-center text-sm leading-6 text-[#9ca3af]">
                Save ideas in Idea Studio and they&apos;ll show up here.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ideaOptions.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#3b82f6]">
                      <LightbulbIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs leading-5 text-[#374151]">{i.title}</span>
                      <span className="block text-[11px] text-[#9ca3af]">
                        {i.platform ? `Best for ${i.platform}` : i.niche}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {plan === "free" && (
            <div
              className="rounded-2xl p-5 text-white"
              style={{ backgroundImage: "linear-gradient(140deg,#0b1020 0%,#151a2e 55%,#3a2f7a 100%)" }}
            >
              <p className="text-sm font-semibold">Plan further ahead</p>
              <p className="mt-2 text-sm leading-6 text-[#c8ccdb]">
                Upgrade for more content plans each month and extended planning.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-4 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-white/90"
              >
                Upgrade now →
              </Link>
            </div>
          )}
        </aside>
      </div>

      <SavedList
        items={savedItems}
        title="Your saved plans"
        description="Every content plan you've saved, newest first."
        showOpenStudio={false}
        emptyTitle="You haven't saved any plans yet."
        emptyBody="Generate a plan above and hit Save — it will collect here."
      />
    </div>
  );
}