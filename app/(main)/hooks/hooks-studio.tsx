"use client";

import { useState } from "react";
import Link from "next/link";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import { HookIcon } from "@/components/dashboard/hook-icon";
import { studioHref } from "@/lib/search-params";

type Hook = { text: string; style: string; delivery: string };
type Title = { text: string; angle: string };

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

/** Same list as Script Studio, so "Write the script" can pass the style across. */
const PLATFORMS = ["TikTok", "YouTube Shorts", "YouTube", "Instagram Reels", "LinkedIn"];
const HOOK_STYLES = ["Question", "Bold claim", "Story", "Statistic", "Contrarian"];
const TONES = ["Conversational", "Energetic", "Educational", "Professional", "Storytelling"];

const TOPIC_LIMIT = 200;
const TITLE_LIMIT = 60; // where YouTube truncates titles in search

const STYLE_CHIP: Record<string, string> = {
  Question: "bg-[#eef4ff] text-[#2563eb]",
  "Bold claim": "bg-[#f3eeff] text-[#7c3aed]",
  Story: "bg-[#fff2e8] text-[#ea580c]",
  Statistic: "bg-[#e9f9f0] text-[#059669]",
  Contrarian: "bg-[#fdeef6] text-[#db2777]",
};

/** Defined at module level — components created during render remount every time. */
function StarButton({ on, onClick, label: aria }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={aria}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition ${
        on ? "bg-[#fff7e0] text-[#f5b544]" : "text-[#d1d5db] hover:bg-[#f7f8fa] hover:text-[#9ca3af]"
      }`}
    >
      {on ? "★" : "☆"}
    </button>
  );
}

interface Props {
  savedItems: SavedItem[];
  plan: string;
  defaultAudience: string;
  defaultPlatform: string;
  initialTopic?: string;
  initialPlatform?: string;
}

export default function HooksStudio({
  savedItems,
  plan,
  defaultAudience,
  defaultPlatform,
  initialTopic = "",
  initialPlatform = "",
}: Props) {
  const [topic, setTopic] = useState(initialTopic.slice(0, TOPIC_LIMIT));
  const [platform, setPlatform] = useState(
    PLATFORMS.includes(initialPlatform)
      ? initialPlatform
      : PLATFORMS.includes(defaultPlatform)
        ? defaultPlatform
        : "TikTok"
  );
  const [audience, setAudience] = useState(defaultAudience);
  const [tone, setTone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);

  const [hooks, setHooks] = useState<Hook[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  /** Topic/platform/audience the current set was generated for. */
  const [generatedFor, setGeneratedFor] = useState({ topic: "", platform: "", audience: "" });
  const [styleFilter, setStyleFilter] = useState<string>("All");

  const [starredHooks, setStarredHooks] = useState<Set<number>>(new Set());
  const [starredTitles, setStarredTitles] = useState<Set<number>>(new Set());

  const [savedId, setSavedId] = useState<string | null>(null);
  /** Stars changed since the last save. */
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  /** Bumped after any generate attempt that touched the quota. */
  const [usageRefresh, setUsageRefresh] = useState(0);

  const hasResult = hooks.length > 0 && titles.length > 0;
  const starCount = starredHooks.size + starredTitles.size;

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
  }

  function toggleStar(kind: "hook" | "title", index: number) {
    const setter = kind === "hook" ? setStarredHooks : setStarredTitles;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    if (savedId) setDirty(true);
    setSavedMessage(null);
  }

  /** Starred items if any are starred, otherwise everything. */
  function exportText() {
    const hookIdx = starredHooks.size ? [...starredHooks].sort((a, b) => a - b) : hooks.map((_, i) => i);
    const titleIdx = starredTitles.size ? [...starredTitles].sort((a, b) => a - b) : titles.map((_, i) => i);
    return [
      generatedFor.topic,
      "",
      "HOOKS",
      ...hookIdx.map((i) => `- [${hooks[i].style}] ${hooks[i].text}`),
      "",
      "TITLES",
      ...titleIdx.map((i) => `- ${titles[i].text}`),
    ].join("\n");
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Please enter a video topic.");
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/hooks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, audience, tone }),
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

      setHooks(data.hooks);
      setTitles(data.titles);
      setGeneratedFor({ topic: topic.trim(), platform, audience });
      setStyleFilter("All");
      setStarredHooks(new Set());
      setStarredTitles(new Set());
      setSavedId(null);
      setDirty(false);
      setUsageRefresh((n) => n + 1);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!hasResult) return;
    setSaving(true);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/hooks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          savedId
            ? {
                id: savedId,
                starredHooks: [...starredHooks],
                starredTitles: [...starredTitles],
              }
            : {
                topic: generatedFor.topic,
                platform: generatedFor.platform,
                audience: generatedFor.audience,
                hooks,
                titles,
                starredHooks: [...starredHooks],
                starredTitles: [...starredTitles],
              }
        ),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.saved?.id) {
        setSavedMessage(data.error || "Failed to save. Please try again.");
        return;
      }

      setSavedMessage(savedId ? "Stars updated." : "Saved — it appears below after you refresh.");
      setSavedId(data.saved.id);
      setDirty(false);
    } catch {
      setSavedMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const visibleHooks = hooks
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => styleFilter === "All" || h.style === styleFilter);
  const styleOptions = ["All", ...HOOK_STYLES.filter((s) => hooks.some((h) => h.style === s))];

  /**
   * 16px on mobile is not a style choice. iOS Safari zooms the viewport when a
   * focused input or select is under 16px and never zooms back out.
   */
  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-[16px] outline-none transition focus:border-[#c9c6f6] sm:py-2.5 sm:text-sm";
  const label = "mb-1.5 block text-sm font-medium text-[#374151]";
  const smallBtn =
    "shrink-0 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#374151] transition hover:bg-[#f7f8fa] sm:py-1.5";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 sm:space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            HOOKS &amp; TITLES
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-[-0.5px] text-[#111827] sm:mt-4 sm:text-3xl md:text-4xl">
            Win the first{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              3 seconds
            </span>
            <span className="text-[#6d5cf5]">.</span>
          </h2>

          <p className="mt-2 text-[15px] text-[#6b7280] sm:text-base">
            10 opening hooks and 10 titles for any video — star the best, then take them into your script.
          </p>
        </div>

        <p className="block max-lg:hidden max-w-[220px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)]">
          The hook decides who stays.
        </p>
      </div>

      {plan !== "creator_pro" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#dfe3f5] bg-[#f4f6ff] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm leading-6 text-[#374151]">
            <span className="font-semibold text-[#111827]">Creator Pro</span> includes unlimited hook &amp;
            title sets.{" "}
            {plan === "free" ? "Free includes 3 to try." : "Creator includes 10 a month."}
          </p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="shrink-0 rounded-xl bg-[#0b1020] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#1b2338]"
          >
            {plan === "free" ? "See plans →" : "Go Creator Pro →"}
          </Link>
        </div>
      )}

      {/* input card */}
      <div className="rounded-2xl border border-[#ececf1] bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
          What&apos;s the video about?
        </h3>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <label htmlFor="topic" className={label}>Video topic</label>
            <textarea
              id="topic"
              rows={3}
              maxLength={TOPIC_LIMIT}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. I let AI plan my entire week — here's what it got wrong"
              className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-[#fafafc] px-3.5 py-3 text-[16px] leading-6 outline-none transition placeholder:text-[#9ca3af] focus:border-[#c9c6f6] focus:bg-white sm:py-2.5 sm:text-sm"
            />
            <div className="mt-1 flex items-start justify-between gap-3">
              <p className="text-xs text-[#6856fd]">
                {initialTopic && !hasResult && topic === initialTopic.slice(0, TOPIC_LIMIT)
                  ? "Filled in from your script."
                  : ""}
              </p>
              <p className="shrink-0 text-xs text-[#9ca3af]">
                {topic.length}/{TOPIC_LIMIT}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="platform" className={label}>Platform</label>
              <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className={field}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="audience" className={label}>Audience</label>
            <input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. college students"
              className={field}
            />
          </div>

          <div>
            <label htmlFor="tone" className={label}>
              Tone <span className="text-[#9ca3af]">(optional)</span>
            </label>
            <input
              id="tone"
              type="text"
              list="hook-tone-opts"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. energetic"
              className={field}
            />
            <datalist id="hook-tone-opts">
              {TONES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <div className="mt-5 border-t border-[#f1f2f6] pt-4">
          <UsageMeter feature="hooks" refreshKey={usageRefresh} />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="mt-4 w-full rounded-xl bg-[#0b1020] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:w-auto sm:py-3"
        >
          {loading ? "Writing hooks…" : hasResult ? "Generate a new set →" : "Generate hooks & titles →"}
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
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-[#ececf1] bg-[#fafafc]" />
          ))}
        </div>
      )}

      {!loading && hasResult && (
        <>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* ---------- hooks ---------- */}
            <div className="rounded-2xl border border-[#ececf1] bg-white">
              <div className="border-b border-[#ececf1] px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold tracking-tight text-[#111827]">
                    Hooks <span className="font-normal text-[#9ca3af]">· first 3 seconds</span>
                  </h3>
                  <span className="text-xs text-[#9ca3af]">{starredHooks.size} starred</span>
                </div>
                <div className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  {styleOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyleFilter(s)}
                      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        styleFilter === s ? "bg-[#0b1020] text-white" : "border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="divide-y divide-[#f1f2f6]">
                {visibleHooks.map(({ h, i }) => (
                  <li key={i} className="px-4 py-4 sm:px-5">
                    <div className="flex items-start gap-3">
                      <StarButton
                        on={starredHooks.has(i)}
                        onClick={() => toggleStar("hook", i)}
                        label={starredHooks.has(i) ? "Unstar hook" : "Star hook"}
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            STYLE_CHIP[h.style] ?? "bg-[#f4f5f8] text-[#6b7280]"
                          }`}
                        >
                          {h.style}
                        </span>
                        <p className="mt-2 break-words text-sm font-medium leading-6 text-[#111827]">{h.text}</p>
                        {h.delivery && (
                          <p className="mt-1 break-words text-xs leading-5 text-[#9ca3af]">{h.delivery}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => copy(`h-${i}`, h.text)} className={smallBtn}>
                            {copiedKey === `h-${i}` ? "Copied ✓" : "Copy"}
                          </button>
                          <Link
                            href={studioHref("/scripts", {
                              topic: generatedFor.topic,
                              platform: generatedFor.platform,
                              audience: generatedFor.audience,
                              hookStyle: h.style,
                            })}
                            className="px-1 py-2 text-xs font-medium text-[#6856fd] hover:underline sm:py-1.5"
                          >
                            Write the script with this style →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ---------- titles ---------- */}
            <div className="rounded-2xl border border-[#ececf1] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#ececf1] px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="text-base font-semibold tracking-tight text-[#111827]">Titles</h3>
                <span className="text-xs text-[#9ca3af]">{starredTitles.size} starred</span>
              </div>

              <ul className="divide-y divide-[#f1f2f6]">
                {titles.map((t, i) => {
                  const long = t.text.length > TITLE_LIMIT;
                  return (
                    <li key={i} className="px-4 py-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <StarButton
                          on={starredTitles.has(i)}
                          onClick={() => toggleStar("title", i)}
                          label={starredTitles.has(i) ? "Unstar title" : "Star title"}
                        />
                        <div className="min-w-0 flex-1">
                          {t.angle && (
                            <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[11px] font-medium text-[#2563eb]">
                              {t.angle}
                            </span>
                          )}
                          <p className="mt-2 break-words text-sm font-medium leading-6 text-[#111827]">{t.text}</p>
                          <p className={`mt-1 text-xs ${long ? "text-[#ea580c]" : "text-[#9ca3af]"}`}>
                            {t.text.length} characters{long ? " · may be truncated in search" : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => copy(`t-${i}`, t.text)} className={smallBtn}>
                              {copiedKey === `t-${i}` ? "Copied ✓" : "Copy"}
                            </button>
                            <Link
                              href={studioHref("/seo", {
                                topic: t.text.slice(0, 100),
                                platform: generatedFor.platform,
                              })}
                              className="px-1 py-2 text-xs font-medium text-[#6856fd] hover:underline sm:py-1.5"
                            >
                              Use this title in SEO →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* ---------- save / export ---------- */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#ececf1] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (Boolean(savedId) && !dirty)}
              className="rounded-xl bg-[#0b1020] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50 sm:py-2.5"
            >
              {saving ? "Saving…" : !savedId ? "Save set" : dirty ? "Update stars" : "Saved ✓"}
            </button>
            <button
              type="button"
              onClick={() => copy("export", exportText())}
              className="rounded-xl border border-[#e5e7eb] px-5 py-3 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa] sm:py-2.5"
            >
              {copiedKey === "export" ? "Copied ✓" : starCount ? `Copy ${starCount} starred` : "Copy all"}
            </button>
            <p className="text-sm text-[#6b7280]">
              {savedMessage ?? "Star your favourites — saved sets keep your stars."}
            </p>
          </div>

          <p className="text-xs leading-5 text-[#9ca3af]">
            Statistic hooks use placeholders like [X%] — replace them with a real, sourced number before you film.
          </p>
        </>
      )}

      {!loading && !hasResult && !error && !upgradeInfo && (
        <div className="rounded-2xl border border-dashed border-[#dfe1e8] bg-white/60 px-4 py-12 text-center sm:px-6 sm:py-16">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6faf7] text-[#0d9488]">
            <HookIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-[#374151]">No hooks yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
            Add your video topic above to get 10 hooks and 10 titles.
          </p>
        </div>
      )}

      <SavedList
        items={savedItems}
        title="Your saved hook sets"
        description="Every hook & title set you've saved, newest first."
        showOpenStudio={false}
        emptyTitle="You haven't saved any hook sets yet."
        emptyBody="Generate a set above, star your favourites and hit Save."
      />
    </div>
  );
}