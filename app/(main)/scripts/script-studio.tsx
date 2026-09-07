"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import { FileTextIcon } from "@/components/marketing/landing-icons";

type Hook = { text: string; style: string };

type ScriptResult = {
  hooks: Hook[];
  script: { intro: string; body: string; cta: string };
  altEndings: { text: string }[];
  platformNotes: string;
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
  audience: string | null;
}

const PLATFORMS = ["TikTok", "YouTube Shorts", "YouTube", "Instagram Reels", "LinkedIn"];
const FORMATS = [
  { value: "short-form", label: "Short-form" },
  { value: "long-form", label: "Long-form" },
];
const TONES = ["Conversational", "Energetic", "Educational", "Professional", "Storytelling"];
const DURATIONS = ["30 seconds", "60 seconds", "3-5 minutes", "5-8 minutes", "10+ minutes"];
const HOOK_STYLES = ["Question", "Bold claim", "Story", "Statistic", "Contrarian"];

/** Average conversational speaking pace, used for the estimated runtime. */
const WORDS_PER_MINUTE = 150;
const TOPIC_LIMIT = 200;

type TabKey = "script" | "hooks" | "endings" | "notes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "script", label: "Script" },
  { key: "hooks", label: "Hooks" },
  { key: "endings", label: "Alt endings" },
  { key: "notes", label: "Platform notes" },
];

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function fullScriptText(topic: string, r: ScriptResult) {
  const lines = [
    topic,
    "",
    "HOOK OPTIONS",
    ...r.hooks.map((h, i) => `${i + 1}. [${h.style}] ${h.text}`),
    "",
    "INTRO",
    r.script.intro,
    "",
    "BODY",
    r.script.body,
    "",
    "CALL TO ACTION",
    r.script.cta,
  ];

  if (r.altEndings.length) {
    lines.push("", "ALTERNATE ENDINGS", ...r.altEndings.map((e, i) => `${i + 1}. ${e.text}`));
  }
  if (r.platformNotes) {
    lines.push("", "PLATFORM NOTES", r.platformNotes);
  }

  return lines.join("\n");
}

interface Props {
  savedItems: SavedItem[];
  ideaOptions: IdeaOption[];
  plan: string;
  defaultAudience: string;
  defaultPlatform: string;
}

export default function ScriptStudio({
  savedItems,
  ideaOptions,
  plan,
  defaultAudience,
  defaultPlatform,
}: Props) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(
    PLATFORMS.includes(defaultPlatform) ? defaultPlatform : "TikTok"
  );
  const [format, setFormat] = useState("short-form");
  const [duration, setDuration] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState(defaultAudience);
  const [hookStyle, setHookStyle] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [generatedTopic, setGeneratedTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("script");

  /**
   * Bumped after any generate attempt that touched the quota, so the usage
   * meter refetches without a page reload.
   */
  const [usageRefresh, setUsageRefresh] = useState(0);

  /* ---- Real stats, computed from the generated script ---- */
  const stats = useMemo(() => {
    if (!result) return null;
    const words =
      countWords(result.script.intro) +
      countWords(result.script.body) +
      countWords(result.script.cta);
    const minutes = words / WORDS_PER_MINUTE;
    const runtime =
      minutes < 1 ? `${Math.max(1, Math.round(minutes * 60))} sec` : `${minutes.toFixed(1)} min`;

    return {
      words,
      runtime,
      sections: 3 + (result.altEndings.length ? 1 : 0),
      hooks: result.hooks.length,
    };
  }, [result]);

  /* ---- Stepper reflects real page state ---- */
  const step = loading ? 3 : result ? 4 : topic.trim() ? 2 : 1;
  const STEPS = [
    { n: 1, title: "Topic", sub: "Your idea" },
    { n: 2, title: "Settings", sub: "Style & audience" },
    { n: 3, title: "Generate", sub: "AI writes it" },
    { n: 4, title: "Review", sub: "Edit & export" },
  ];

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
  }

  function downloadTxt() {
    if (!result) return;
    const blob = new Blob([fullScriptText(generatedTopic, result)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generatedTopic.slice(0, 40).replace(/[^\w\s-]/g, "").trim() || "craftx-script"}.txt`;
    // Safari (including every iOS browser) ignores a click on an anchor that
    // isn't in the document, so the download silently did nothing on iPhone.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Please enter a video topic.");
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setResult(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, format, duration, tone, audience, hookStyle }),
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
          // Blocked by the quota — resync so the meter shows zero left.
          setUsageRefresh((n) => n + 1);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data);
      setGeneratedTopic(topic);
      setTab("script");
      // A script was consumed — refresh the remaining count.
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
      const res = await fetch("/api/scripts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: generatedTopic,
          platform,
          format,
          duration,
          tone,
          audience,
          hookStyle,
          hooks: result.hooks,
          script: result.script,
          altEndings: result.altEndings,
          platformNotes: result.platformNotes,
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

  /**
   * 16px on mobile is not a style choice. iOS Safari zooms the viewport when a
   * focused input or select is under 16px and never zooms back out.
   */
  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] outline-none transition focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm";
  const label = "mb-1.5 block text-sm font-medium text-[#374151]";
  const copyBtn =
    "shrink-0 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#374151] transition hover:bg-[#f7f8fa] sm:py-1.5";
  /** Tabs scroll on one line below sm: rather than wrapping to three rows. */
  const tabRow =
    "-mx-4 flex flex-1 gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden";
  const tabBtn = "shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition sm:py-1.5";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            SCRIPT STUDIO
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-[-0.5px] text-[#111827] sm:mt-4 sm:text-3xl md:text-4xl">
            Turn your ideas into{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              powerful scripts
            </span>
            <span className="text-[#6d5cf5]">.</span>
          </h2>

          <p className="mt-2 max-w-2xl text-[15px] text-[#6b7280] sm:text-base">
            Get structured scripts with hooks, a clear flow and a call to action — built for your audience.
          </p>
        </div>

        <p className="hidden max-w-[230px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)] lg:block">
          A better script creates a better video.
        </p>
      </div>

      {/* stepper */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#ececf1] bg-white p-2 sm:gap-3 sm:p-3 sm:grid-cols-4">
        {STEPS.map((s) => {
          const active = step === s.n;
          const done = step > s.n;
          return (
            <div
              key={s.n}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 ${
                active ? "bg-[#eef0fb]" : ""
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  active
                    ? "bg-[#6856fd] text-white"
                    : done
                    ? "bg-[#e9f9f0] text-[#059669]"
                    : "bg-[#f1f2f6] text-[#9ca3af]"
                }`}
              >
                {done ? "✓" : s.n}
              </span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${active ? "text-[#111827]" : "text-[#6b7280]"}`}>
                  {s.title}
                </p>
                <p className="truncate text-xs text-[#9ca3af]">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[320px_minmax(0,1fr)_290px]">
        {/* ============ left: form ============ */}
        <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
              Tell us about your video
            </h3>
          </div>

          {ideaOptions.length > 0 && (
            <select
              aria-label="Import a topic from Idea Studio"
              value=""
              onChange={(e) => {
                const idea = ideaOptions.find((o) => o.id === e.target.value);
                if (!idea) return;
                setTopic(idea.title.slice(0, TOPIC_LIMIT));
                if (idea.platform && PLATFORMS.includes(idea.platform)) setPlatform(idea.platform);
                if (idea.audience) setAudience(idea.audience);
              }}
              className={`${field} mt-4`}
            >
              <option value="">Import from Idea Studio…</option>
              {ideaOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title.length > 45 ? `${i.title.slice(0, 45)}…` : i.title}
                </option>
              ))}
            </select>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="topic" className={label}>
                Video topic / idea
              </label>
              <textarea
                id="topic"
                rows={3}
                maxLength={TOPIC_LIMIT}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why people stop watching videos after 3 seconds and how to fix it"
                className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-[#fafafc] px-3.5 py-3 text-[16px] leading-6 outline-none transition placeholder:text-[#9ca3af] focus:border-[#c9c6f6] focus:bg-white sm:py-2.5 sm:text-sm"
              />
              <p className="mt-1 text-right text-xs text-[#9ca3af]">
                {topic.length}/{TOPIC_LIMIT}
              </p>
            </div>

            <div>
              <label htmlFor="platform" className={label}>Platform</label>
              <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className={field}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="format" className={label}>Video type</label>
              <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className={field}>
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tone" className={label}>Tone / style</label>
              <input id="tone" type="text" list="tone-opts" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. conversational" className={field} />
              <datalist id="tone-opts">{TONES.map((t) => <option key={t} value={t} />)}</datalist>
            </div>

            <div>
              <label htmlFor="audience" className={label}>Target audience</label>
              <input id="audience" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. beginners" className={field} />
            </div>

            <div>
              <label htmlFor="duration" className={label}>Video length</label>
              <input id="duration" type="text" list="dur-opts" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 60 seconds" className={field} />
              <datalist id="dur-opts">{DURATIONS.map((d) => <option key={d} value={d} />)}</datalist>
            </div>

            <div>
              <label htmlFor="hookStyle" className={label}>
                Hook style <span className="text-[#9ca3af]">(optional)</span>
              </label>
              <input id="hookStyle" type="text" list="hook-opts" value={hookStyle} onChange={(e) => setHookStyle(e.target.value)} placeholder="e.g. bold claim" className={field} />
              <datalist id="hook-opts">{HOOK_STYLES.map((h) => <option key={h} value={h} />)}</datalist>
            </div>

            {/* remaining quota — sits where the user decides to spend one */}
            <div className="border-t border-[#f1f2f6] pt-4">
              <UsageMeter feature="scripts" refreshKey={usageRefresh} />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full rounded-xl bg-[#0b1020] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:py-3"
            >
              {loading ? "Generating…" : "Generate script →"}
            </button>
          </div>
        </div>

        {/* ============ center: script ============ */}
        <div className="space-y-4">
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
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-[#ececf1] bg-[#fafafc]" />
              ))}
            </div>
          )}

          {!loading && result && (
            <div className="rounded-2xl border border-[#ececf1] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf1] px-4 py-3 sm:px-5 sm:py-4">
                <div className={tabRow}>
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`${tabBtn} ${
                        tab === t.key ? "bg-[#eef0fb] text-[#5b5bd6]" : "text-[#6b7280] hover:text-[#111827]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={handleGenerate} disabled={loading} className={copyBtn}>
                  ↻ Regenerate
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="break-words text-lg font-bold leading-7 tracking-tight text-[#111827] sm:text-xl sm:leading-8">
                  {generatedTopic}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[platform, FORMATS.find((f) => f.value === format)?.label, duration, tone, audience]
                    .filter(Boolean)
                    .map((chip) => (
                      <span key={chip as string} className="rounded-full bg-[#f4f5f8] px-2.5 py-1 text-xs text-[#6b7280]">
                        {chip}
                      </span>
                    ))}
                </div>

                {/* SCRIPT */}
                {tab === "script" && (
                  <div className="mt-5 space-y-3 sm:mt-6">
                    {[
                      { key: "intro", label: "Intro", body: result.script.intro },
                      { key: "body", label: "Body", body: result.script.body },
                      { key: "cta", label: "Call to action", body: result.script.cta },
                    ].map((sec) => (
                      <div key={sec.key} className="rounded-xl border border-[#ececf1] p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <p className="text-sm font-semibold text-[#111827]">{sec.label}</p>
                          <button type="button" onClick={() => copy(sec.key, sec.body)} className={copyBtn}>
                            {copiedKey === sec.key ? "Copied ✓" : "Copy"}
                          </button>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#374151]">
                          {sec.body}
                        </p>
                        <p className="mt-3 text-xs text-[#9ca3af]">{countWords(sec.body)} words</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* HOOKS */}
                {tab === "hooks" && (
                  <ul className="mt-5 divide-y divide-[#f1f2f6] sm:mt-6">
                    {result.hooks.map((h, i) => (
                      <li key={i} className="flex items-start justify-between gap-3 py-4 first:pt-0 sm:gap-4">
                        <div className="min-w-0">
                          <span className="rounded-full bg-[#f3eeff] px-2 py-0.5 text-[11px] font-medium text-[#7c3aed]">
                            {h.style}
                          </span>
                          <p className="mt-2 break-words text-sm leading-7 text-[#374151]">{h.text}</p>
                        </div>
                        <button type="button" onClick={() => copy(`h-${i}`, h.text)} className={copyBtn}>
                          {copiedKey === `h-${i}` ? "Copied ✓" : "Copy"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* ALT ENDINGS */}
                {tab === "endings" && (
                  <div className="mt-5 sm:mt-6">
                    {result.altEndings.length === 0 ? (
                      <p className="rounded-xl bg-[#fafafc] px-4 py-8 text-center text-sm text-[#9ca3af]">
                        No alternate endings were generated for this script.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#f1f2f6]">
                        {result.altEndings.map((e, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 py-4 first:pt-0 sm:gap-4">
                            <p className="min-w-0 break-words text-sm leading-7 text-[#374151]">{e.text}</p>
                            <button type="button" onClick={() => copy(`e-${i}`, e.text)} className={copyBtn}>
                              {copiedKey === `e-${i}` ? "Copied ✓" : "Copy"}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* PLATFORM NOTES */}
                {tab === "notes" && (
                  <div className="mt-5 sm:mt-6">
                    {result.platformNotes ? (
                      <p className="whitespace-pre-wrap break-words rounded-xl bg-[#fafafc] p-4 text-sm leading-7 text-[#374151] sm:p-5">
                        {result.platformNotes}
                      </p>
                    ) : (
                      <p className="rounded-xl bg-[#fafafc] px-4 py-8 text-center text-sm text-[#9ca3af]">
                        No platform notes for this script.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !result && !error && !upgradeInfo && (
            <div className="rounded-2xl border border-dashed border-[#dfe1e8] bg-white/60 px-4 py-12 text-center sm:px-6 sm:py-20">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3eeff] text-[#8b5cf6]">
                <FileTextIcon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-[#374151]">No script yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
                Fill in your video details above and generate your first script.
              </p>
            </div>
          )}
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold text-[#111827]">Script stats</p>

            {stats ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f3eeff] p-3">
                  <p className="text-lg font-bold text-[#111827]">~{stats.words}</p>
                  <p className="text-xs text-[#6b7280]">Total words</p>
                </div>
                <div className="rounded-xl bg-[#eef4ff] p-3">
                  <p className="text-lg font-bold text-[#111827]">{stats.sections}</p>
                  <p className="text-xs text-[#6b7280]">Sections</p>
                </div>
                <div className="rounded-xl bg-[#e9f9f0] p-3">
                  <p className="text-lg font-bold text-[#111827]">{stats.runtime}</p>
                  <p className="text-xs text-[#6b7280]">Est. runtime</p>
                </div>
                <div className="rounded-xl bg-[#fff2e8] p-3">
                  <p className="text-lg font-bold text-[#111827]">{stats.hooks}</p>
                  <p className="text-xs text-[#6b7280]">Hook options</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-[#fafafc] px-4 py-8 text-center text-sm leading-6 text-[#9ca3af]">
                Generate a script to see its stats.
              </p>
            )}

            {stats && (
              <p className="mt-3 text-xs leading-5 text-[#9ca3af]">
                Runtime assumes ~{WORDS_PER_MINUTE} spoken words per minute.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold text-[#111827]">Save &amp; export</p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!result || saving}
                className="w-full rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-40 sm:py-2.5"
              >
                {saving ? "Saving…" : "Save script"}
              </button>

              <button
                type="button"
                onClick={() => result && copy("full", fullScriptText(generatedTopic, result))}
                disabled={!result}
                className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa] disabled:opacity-40 sm:py-2.5"
              >
                {copiedKey === "full" ? "Copied ✓" : "Copy full script"}
              </button>

              <button
                type="button"
                onClick={downloadTxt}
                disabled={!result}
                className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa] disabled:opacity-40 sm:py-2.5"
              >
                Download .txt
              </button>
            </div>

            {savedMessage && <p className="mt-3 text-xs text-[#6b7280]">{savedMessage}</p>}
          </div>

          <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold text-[#111827]">Next steps</p>
            <div className="mt-4 space-y-2">
              <Link
                href="/seo"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#ececf1] px-4 py-3 text-sm transition hover:bg-[#fafafc]"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-[#111827]">Optimize for search</span>
                  <span className="block text-xs text-[#9ca3af]">Titles, keywords, hashtags</span>
                </span>
                <span className="shrink-0 text-[#9ca3af]">→</span>
              </Link>

              <Link
                href="/planner"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#ececf1] px-4 py-3 text-sm transition hover:bg-[#fafafc]"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-[#111827]">Schedule it</span>
                  <span className="block text-xs text-[#9ca3af]">Add to your content plan</span>
                </span>
                <span className="shrink-0 text-[#9ca3af]">→</span>
              </Link>
            </div>
          </div>

          {plan === "free" && (
            <div
              className="rounded-2xl p-4 text-white sm:p-5"
              style={{ backgroundImage: "linear-gradient(140deg,#0b1020 0%,#151a2e 55%,#3a2f7a 100%)" }}
            >
              <p className="text-sm font-semibold">Want higher limits?</p>
              <p className="mt-2 text-sm leading-6 text-[#c8ccdb]">
                Upgrade for more scripts each month and priority processing.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-4 inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#111827] transition hover:bg-white/90 sm:py-2.5"
              >
                Upgrade now →
              </Link>
            </div>
          )}
        </aside>
      </div>

      <SavedList
        items={savedItems}
        title="Your saved scripts"
        description="Every script you've saved, newest first."
        showOpenStudio={false}
        emptyTitle="You haven't saved any scripts yet."
        emptyBody="Generate a script above and hit Save — it will collect here."
      />
    </div>
  );
}