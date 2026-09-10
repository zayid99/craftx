"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import { SearchIcon } from "@/components/marketing/landing-icons";

type Title = { text: string; angle: string };

type SEOResult = {
  titles: Title[];
  description: string;
  keywords: string[];
  hashtags: string[];
  searchIntent: string;
  disclaimer: string;
};

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

export interface ScriptOption {
  id: string;
  topic: string;
  platform: string;
}

const PLATFORMS = [
  { value: "YouTube Shorts", label: "YouTube Shorts" },
  { value: "YouTube", label: "YouTube (long-form)" },
  { value: "TikTok", label: "TikTok" },
  { value: "Instagram Reels", label: "Instagram Reels" },
];

const TONES = ["Conversational", "Energetic", "Educational", "Professional", "Casual"];

const TITLE_LIMIT = 60; // where YouTube truncates titles in search
const TOPIC_LIMIT = 100;

type TabKey = "overview" | "titles" | "description" | "keywords" | "hashtags" | "checklist";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "titles", label: "Title ideas" },
  { key: "description", label: "Description" },
  { key: "keywords", label: "Keywords" },
  { key: "hashtags", label: "Hashtags" },
  { key: "checklist", label: "Checklist" },
];

interface CheckItem {
  label: string;
  passed: boolean;
  hint: string;
}

/**
 * Every check below is computed from the generated output — no external
 * keyword or ranking data is involved.
 */
function buildChecklist(result: SEOResult | null, topic: string): CheckItem[] {
  if (!result) return [];

  const topicWords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const bestTitle = result.titles[0]?.text ?? "";
  const descLower = result.description.toLowerCase();
  const firstChunk = descLower.slice(0, 150);

  const titleHasTopic = topicWords.some((w) => bestTitle.toLowerCase().includes(w));
  const descHasTopic = topicWords.some((w) => firstChunk.includes(w));

  return [
    {
      label: "Title stays under 60 characters",
      passed: bestTitle.length > 0 && bestTitle.length <= TITLE_LIMIT,
      hint: "Longer titles get cut off in search results.",
    },
    {
      label: "Title includes your topic wording",
      passed: titleHasTopic,
      hint: "Helps the platform match your video to searches.",
    },
    {
      label: "Three or more title options",
      passed: result.titles.length >= 3,
      hint: "Gives you variants to test against each other.",
    },
    {
      label: "Description is 200+ characters",
      passed: result.description.length >= 200,
      hint: "Short descriptions give the algorithm little to read.",
    },
    {
      label: "Topic appears early in the description",
      passed: descHasTopic,
      hint: "The first ~150 characters carry the most weight.",
    },
    {
      label: "At least 5 keywords",
      passed: result.keywords.length >= 5,
      hint: "Broadens the range of searches you can surface in.",
    },
    {
      label: "At least 3 hashtags",
      passed: result.hashtags.length >= 3,
      hint: "Useful for Shorts, Reels and TikTok discovery.",
    },
    {
      label: "Search intent identified",
      passed: Boolean(result.searchIntent?.trim()),
      hint: "Knowing the intent shapes your hook and thumbnail.",
    },
  ];
}

interface Props {
  savedItems: SavedItem[];
  scriptOptions: ScriptOption[];
  plan: string;
  defaultAudience: string;
  defaultPlatform: string;
}

export default function SEOStudio({
  savedItems,
  scriptOptions,
  plan,
  defaultAudience,
  defaultPlatform,
}: Props) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(
    PLATFORMS.some((p) => p.value === defaultPlatform) ? defaultPlatform : "YouTube Shorts"
  );
  const [contentDescription, setContentDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState(defaultAudience);
  const [tone, setTone] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<SEOResult | null>(null);
  const [generatedTopic, setGeneratedTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  /** Bumped after any generate attempt that touched the quota. */
  const [usageRefresh, setUsageRefresh] = useState(0);

  const checklist = useMemo(() => buildChecklist(result, generatedTopic), [result, generatedTopic]);
  const passedCount = checklist.filter((c) => c.passed).length;
  const score = checklist.length ? Math.round((passedCount / checklist.length) * 100) : 0;

  const scoreLabel =
    score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 40 ? "Needs work" : "Weak";
  const scoreColor = score >= 85 ? "#10b981" : score >= 65 ? "#3b82f6" : score >= 40 ? "#f97316" : "#ef4444";

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
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
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, contentDescription, targetAudience, tone }),
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
      setGeneratedTopic(topic);
      setTab("overview");
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
      const res = await fetch("/api/seo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: generatedTopic,
          platform,
          titles: result.titles,
          description: result.description,
          keywords: result.keywords,
          hashtags: result.hashtags,
          searchIntent: result.searchIntent,
        }),
      });

      if (!res.ok) {
        setSavedMessage("Failed to save. Please try again.");
        return;
      }

      setSavedMessage("Saved — it appears in the list below after you refresh.");
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
  const copyBtn =
    "shrink-0 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#374151] transition hover:bg-[#f7f8fa] sm:py-1.5";
  /** Six tabs wrapped to three rows on a phone. One scrolling line instead. */
  const tabRow =
    "-mx-4 flex flex-1 gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden";
  const tabBtn = "shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition sm:py-1.5";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 sm:space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            SEO STUDIO
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-[-0.5px] text-[#111827] sm:mt-4 sm:text-3xl md:text-4xl">
            Rank higher.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              Get discovered.
            </span>
          </h2>

          <p className="mt-2 text-[15px] text-[#6b7280] sm:text-base">
            Optimize your titles, descriptions, keywords and hashtags to reach the right audience.
          </p>
        </div>

        <p className="block max-lg:hidden max-w-[220px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)]">
          Better SEO = more views, more growth.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============ main column ============ */}
        <div className="space-y-4 sm:space-y-6">
          {/* input card */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
                  Enter your video details
                </h3>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Add your topic to generate SEO-optimized content.
                </p>
              </div>

              {scriptOptions.length > 0 && (
                /* Intrinsic-width select next to a heading in a flex-wrap row
                   could exceed the viewport. Full width on a phone instead. */
                <select
                  aria-label="Import a topic from Script Studio"
                  value=""
                  onChange={(e) => {
                    const s = scriptOptions.find((o) => o.id === e.target.value);
                    if (!s) return;
                    setTopic(s.topic.slice(0, TOPIC_LIMIT));
                    if (PLATFORMS.some((p) => p.value === s.platform)) setPlatform(s.platform);
                  }}
                  className="w-full max-w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] text-[#374151] outline-none transition focus:border-[#c9c6f6] sm:w-auto sm:py-2.5 sm:text-sm"
                >
                  <option value="">Import from Script Studio…</option>
                  {scriptOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.topic.length > 55 ? `${s.topic.slice(0, 55)}…` : s.topic}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:mt-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div>
                <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Video topic / title
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  maxLength={TOPIC_LIMIT}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Why people stop watching videos after 3 seconds"
                  className={field}
                />
                <p className="mt-1 text-right text-xs text-[#9ca3af]">
                  {topic.length}/{TOPIC_LIMIT}
                </p>
              </div>

              <div>
                <label htmlFor="platform" className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Platform
                </label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={field}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* advanced options */}
            <div className="mt-2 rounded-xl border border-[#ececf1] bg-[#fafafc]">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-[#374151] sm:py-3"
              >
                Advanced options
                <span className={`text-[#9ca3af] transition-transform ${advancedOpen ? "rotate-180" : ""}`}>
                  ⌄
                </span>
              </button>

              {advancedOpen && (
                <div className="grid gap-4 border-t border-[#ececf1] p-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="audience" className="mb-1.5 block text-sm font-medium text-[#374151]">
                      Target audience
                    </label>
                    <input
                      id="audience"
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. beginner editors"
                      className={field}
                    />
                  </div>

                  <div>
                    <label htmlFor="tone" className="mb-1.5 block text-sm font-medium text-[#374151]">
                      Tone
                    </label>
                    <input
                      id="tone"
                      type="text"
                      list="tone-options"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="e.g. conversational"
                      className={field}
                    />
                    <datalist id="tone-options">
                      {TONES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="desc" className="mb-1.5 block text-sm font-medium text-[#374151]">
                      Content description
                    </label>
                    <textarea
                      id="desc"
                      rows={2}
                      value={contentDescription}
                      onChange={(e) => setContentDescription(e.target.value)}
                      placeholder="Anything specific the video covers — produces sharper keywords."
                      className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] leading-6 outline-none transition placeholder:text-[#9ca3af] focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* remaining quota */}
            <div className="mt-5 border-t border-[#f1f2f6] pt-4">
              <UsageMeter feature="seo" refreshKey={usageRefresh} />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="mt-4 w-full rounded-xl bg-[#0b1020] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:w-auto sm:py-3"
            >
              {loading ? "Generating…" : "Generate SEO →"}
            </button>
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
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl border border-[#ececf1] bg-[#fafafc]" />
              ))}
            </div>
          )}

          {/* results */}
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
                        tab === t.key
                          ? "bg-[#eef0fb] text-[#5b5bd6]"
                          : "text-[#6b7280] hover:text-[#111827]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className={copyBtn}
                >
                  ↻ Regenerate
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {/* OVERVIEW */}
                {tab === "overview" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#ececf1] p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                            Recommended title
                          </p>
                          <p className="mt-2 break-words text-base font-semibold leading-7 text-[#111827]">
                            {result.titles[0]?.text}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#f4f5f8] px-2.5 py-1 text-[11px] text-[#6b7280]">
                              {result.titles[0]?.text.length ?? 0} characters
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] ${
                                (result.titles[0]?.text.length ?? 0) <= TITLE_LIMIT
                                  ? "bg-[#e9f9f0] text-[#059669]"
                                  : "bg-[#fff2e8] text-[#ea580c]"
                              }`}
                            >
                              {(result.titles[0]?.text.length ?? 0) <= TITLE_LIMIT
                                ? "Good length"
                                : "May be truncated"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => copy("t0", result.titles[0]?.text ?? "")}
                          className={copyBtn}
                        >
                          {copiedKey === "t0" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#ececf1] p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                          Recommended description
                        </p>
                        <button
                          type="button"
                          onClick={() => copy("d", result.description)}
                          className={copyBtn}
                        >
                          {copiedKey === "d" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#374151]">
                        {result.description}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#ececf1] p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                          Top keywords
                        </p>
                        <button
                          type="button"
                          onClick={() => copy("k", result.keywords.join(", "))}
                          className={copyBtn}
                        >
                          {copiedKey === "k" ? "Copied ✓" : "Copy all"}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.keywords.slice(0, 8).map((k) => (
                          <span key={k} className="rounded-lg bg-[#f4f5f8] px-2.5 py-1.5 text-xs text-[#374151]">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#fafafc] p-4 sm:p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                        Search intent
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[#374151]">{result.searchIntent}</p>
                    </div>
                  </div>
                )}

                {/* TITLES */}
                {tab === "titles" && (
                  <ul className="divide-y divide-[#f1f2f6]">
                    {result.titles.map((t, i) => {
                      const long = t.text.length > TITLE_LIMIT;
                      return (
                        <li key={i} className="flex items-start justify-between gap-3 py-4 first:pt-0 sm:gap-4">
                          <div className="min-w-0">
                            <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[11px] font-medium text-[#2563eb]">
                              {t.angle}
                            </span>
                            <p className="mt-2 break-words text-sm leading-6 text-[#111827]">{t.text}</p>
                            <p className={`mt-1 text-xs ${long ? "text-[#ea580c]" : "text-[#9ca3af]"}`}>
                              {t.text.length} characters{long ? " · may be truncated in search" : ""}
                            </p>
                          </div>
                          <button type="button" onClick={() => copy(`ti-${i}`, t.text)} className={copyBtn}>
                            {copiedKey === `ti-${i}` ? "Copied ✓" : "Copy"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* DESCRIPTION */}
                {tab === "description" && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-[#6b7280]">
                        {result.description.length} characters
                      </p>
                      <button type="button" onClick={() => copy("d2", result.description)} className={copyBtn}>
                        {copiedKey === "d2" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#fafafc] p-4 text-sm leading-7 text-[#374151] sm:p-5">
                      {result.description}
                    </p>
                  </div>
                )}

                {/* KEYWORDS */}
                {tab === "keywords" && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-[#6b7280]">{result.keywords.length} keywords</p>
                      <button type="button" onClick={() => copy("k2", result.keywords.join(", "))} className={copyBtn}>
                        {copiedKey === "k2" ? "Copied ✓" : "Copy all"}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.keywords.map((k) => (
                        <span key={k} className="rounded-lg bg-[#f4f5f8] px-3 py-2 text-sm text-[#374151]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* HASHTAGS */}
                {tab === "hashtags" && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-[#6b7280]">{result.hashtags.length} hashtags</p>
                      <button
                        type="button"
                        onClick={() => copy("h2", result.hashtags.map((h) => `#${h}`).join(" "))}
                        className={copyBtn}
                      >
                        {copiedKey === "h2" ? "Copied ✓" : "Copy all"}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.hashtags.map((h) => (
                        <span key={h} className="rounded-lg bg-[#eef4ff] px-3 py-2 text-sm text-[#2563eb]">
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CHECKLIST */}
                {tab === "checklist" && (
                  <ul className="space-y-3">
                    {checklist.map((c) => (
                      <li key={c.label} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                            c.passed
                              ? "bg-[#10b981] text-white"
                              : "border border-[#d8d9e4] text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm ${c.passed ? "text-[#374151]" : "text-[#9ca3af]"}`}>
                            {c.label}
                          </p>
                          <p className="mt-0.5 text-xs text-[#9ca3af]">{c.hint}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {result.disclaimer && (
                  <p className="mt-6 rounded-xl bg-[#fafafc] px-4 py-3 text-xs leading-6 text-[#9ca3af]">
                    {result.disclaimer}
                  </p>
                )}

                <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-[#f1f2f6] pt-5 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:py-2.5"
                  >
                    {saving ? "Saving…" : "Save SEO set"}
                  </button>
                  {savedMessage && <span className="text-sm text-[#6b7280]">{savedMessage}</span>}
                </div>
              </div>
            </div>
          )}

          {!loading && !result && !error && !upgradeInfo && (
            <div className="rounded-2xl border border-dashed border-[#dfe1e8] bg-white/60 px-4 py-10 text-center sm:px-6 sm:py-14">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f9f0] text-[#10b981]">
                <SearchIcon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-[#374151]">No SEO generated yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
                Add a topic above to get titles, a description, keywords and hashtags.
              </p>
            </div>
          )}
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold text-[#111827]">Optimization score</p>
            <p className="mt-1 text-xs text-[#9ca3af]">
              Based on the checklist below — not external search data.
            </p>

            {result ? (
              <>
                <div className="mt-5 flex flex-col items-center">
                  <div
                    className="flex h-[120px] w-[120px] items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #f1f2f6 0deg)`,
                    }}
                  >
                    <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-bold text-[#111827]">{score}</span>
                      <span className="text-[11px] text-[#9ca3af]">/100</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold" style={{ color: scoreColor }}>
                    {scoreLabel}
                  </p>
                  <p className="mt-1 text-xs text-[#9ca3af]">
                    {passedCount} of {checklist.length} checks passed
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5 border-t border-[#f1f2f6] pt-4">
                  {checklist.map((c) => (
                    <li key={c.label} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          c.passed ? "bg-[#10b981] text-white" : "border border-[#d8d9e4] text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={`text-xs leading-5 ${c.passed ? "text-[#374151]" : "text-[#9ca3af]"}`}>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-5 rounded-xl bg-[#fafafc] px-4 py-8 text-center text-sm leading-6 text-[#9ca3af]">
                Generate an SEO set to see how it scores against the checklist.
              </p>
            )}
          </div>

          {plan === "free" && (
            <div
              className="rounded-2xl p-4 text-white sm:p-5"
              style={{
                backgroundImage:
                  "linear-gradient(140deg,#0b1020 0%,#151a2e 55%,#3a2f7a 100%)",
              }}
            >
              <p className="text-sm font-semibold">Want higher limits?</p>
              <p className="mt-2 text-sm leading-6 text-[#c8ccdb]">
                Upgrade for more generations each month and priority processing.
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

      {/* saved SEO — bottom of the page */}
      <SavedList
        items={savedItems}
        title="Your saved SEO sets"
        description="Every SEO set you've saved, newest first."
        showOpenStudio={false}
        emptyTitle="You haven't saved any SEO sets yet."
        emptyBody="Generate a set above and hit Save — it will collect here."
      />
    </div>
  );
}