"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import { PlayCircleIcon } from "@/components/marketing/landing-icons";

type AnalysisResult = {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedRewrite: string;
  suggestedNextVideo: string;
};

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

type TabKey = "overview" | "strengths" | "improve" | "rewrite" | "next";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "strengths", label: "Strengths" },
  { key: "improve", label: "Areas to improve" },
  { key: "rewrite", label: "Suggested rewrite" },
  { key: "next", label: "Next video" },
];

/** ~150 spoken words per minute — same assumption used in Script Studio. */
const WORDS_PER_MINUTE = 150;

function scoreMeta(score: number) {
  if (score >= 80) return { label: "Strong", hex: "#10b981" };
  if (score >= 60) return { label: "Good", hex: "#3b82f6" };
  if (score >= 40) return { label: "Needs work", hex: "#f97316" };
  return { label: "Weak", hex: "#ef4444" };
}

interface Props {
  savedItems: SavedItem[];
  previousScores: { score: number; createdAt: string }[];
  plan: string;
}

export default function ScriptAnalyzer({ savedItems, previousScores, plan }: Props) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  /** Bumped after any analyze attempt that touched the quota. */
  const [usageRefresh, setUsageRefresh] = useState(0);

  /* ---- Transcript stats, computed locally ---- */
  const transcriptStats = useMemo(() => {
    const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const minutes = words / WORDS_PER_MINUTE;
    return {
      words,
      chars: transcript.length,
      runtime:
        words === 0
          ? "—"
          : minutes < 1
          ? `${Math.max(1, Math.round(minutes * 60))} sec`
          : `${minutes.toFixed(1)} min`,
    };
  }, [transcript]);

  const meta = result ? scoreMeta(result.overallScore) : null;

  const trend = useMemo(() => {
    if (previousScores.length < 2) return null;
    const first = previousScores[0].score;
    const last = previousScores[previousScores.length - 1].score;
    return { delta: last - first, count: previousScores.length };
  }, [previousScores]);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
  }

  async function handleAnalyze() {
    setError("");
    setUpgradeInfo(null);
    setResult(null);
    setSavedMessage(null);

    if (transcript.trim().length < 50) {
      setError("Please provide a transcript of at least 50 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyzer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, transcript }),
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

      setResult(data.result);
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
      const res = await fetch("/api/analyzer/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          transcript,
          overallScore: result.overallScore,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          recommendations: result.recommendations,
          suggestedRewrite: result.suggestedRewrite,
          suggestedNextVideo: result.suggestedNextVideo,
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
  const smallBtn =
    "shrink-0 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#374151] transition hover:bg-[#f7f8fa]";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            SCRIPT ANALYZER
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
            Understand what&apos;s{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              holding your script back.
            </span>
          </h2>

          <p className="mt-2 text-[#6b7280]">
            Get insights from your script or transcript to improve your content and grow your audience.
          </p>
        </div>

        <p className="hidden max-w-[210px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)] lg:block">
          Actionable insights for better content.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ============ main ============ */}
        <div className="space-y-4">
          {/* input card */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
                Paste your script or transcript
              </h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                Works with a written script or a transcript exported from your editor.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Title <span className="text-[#9ca3af]">(optional)</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why people stop watching after 3 seconds"
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="transcript" className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Script / transcript
                </label>
                <textarea
                  id="transcript"
                  rows={12}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste the full script or transcript here…"
                  className="w-full resize-y rounded-xl border border-[#e5e7eb] bg-[#fafafc] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#9ca3af] focus:border-[#c9c6f6] focus:bg-white"
                />
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#9ca3af]">
                  <span>{transcriptStats.words} words</span>
                  <span>{transcriptStats.chars} characters</span>
                  <span>~{transcriptStats.runtime} spoken</span>
                </div>
              </div>
            </div>

            {/* remaining quota */}
            <div className="mt-5 border-t border-[#f1f2f6] pt-4">
              <UsageMeter feature="analyzer" refreshKey={usageRefresh} />
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || transcript.trim().length < 50}
              className="mt-4 rounded-xl bg-[#0b1020] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Analyze script →"}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-[#ececf1] bg-[#fafafc]" />
              ))}
            </div>
          )}

          {/* results */}
          {!loading && result && (
            <div className="rounded-2xl border border-[#ececf1] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf1] px-5 py-4">
                <div className="flex flex-wrap gap-1">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                        tab === t.key ? "bg-[#eef0fb] text-[#5b5bd6]" : "text-[#6b7280] hover:text-[#111827]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={handleAnalyze} className={smallBtn}>
                  ↻ Reanalyze
                </button>
              </div>

              <div className="p-6">
                {title && (
                  <h3 className="mb-4 text-xl font-bold leading-8 tracking-tight text-[#111827]">
                    {title}
                  </h3>
                )}

                {tab === "overview" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-[#ececf1] p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#059669]">
                        Strengths
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-[#374151]">
                            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e9f9f0] text-[10px] text-[#059669]">
                              ✓
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[#ececf1] p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#ea580c]">
                        Areas to improve
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {result.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-[#374151]">
                            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#fff2e8] text-[10px] text-[#ea580c]">
                              !
                            </span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-[#fafafc] p-5 md:col-span-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                          Top recommendations
                        </p>
                        <button
                          type="button"
                          onClick={() => copy("recs", result.recommendations.join("\n"))}
                          className={smallBtn}
                        >
                          {copiedKey === "recs" ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                      <ol className="mt-3 space-y-2.5">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm leading-6 text-[#374151]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef0fb] text-[11px] font-semibold text-[#5b5bd6]">
                              {i + 1}
                            </span>
                            {r}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {tab === "strengths" && (
                  <ul className="space-y-3">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-[#ececf1] p-4 text-sm leading-6 text-[#374151]">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9f9f0] text-[11px] text-[#059669]">
                          ✓
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                {tab === "improve" && (
                  <ul className="space-y-3">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-[#ececf1] p-4 text-sm leading-6 text-[#374151]">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff2e8] text-[11px] text-[#ea580c]">
                          !
                        </span>
                        {w}
                      </li>
                    ))}
                  </ul>
                )}

                {tab === "rewrite" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#6b7280]">A stronger version of your opening.</p>
                      <button
                        type="button"
                        onClick={() => copy("rw", result.suggestedRewrite)}
                        className={smallBtn}
                      >
                        {copiedKey === "rw" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fafafc] p-5 text-sm leading-7 text-[#374151]">
                      {result.suggestedRewrite || "No rewrite was suggested for this transcript."}
                    </p>
                  </div>
                )}

                {tab === "next" && (
                  <div>
                    <p className="text-sm text-[#6b7280]">What to make next, based on this video.</p>
                    <p className="mt-4 rounded-xl bg-[#fafafc] p-5 text-sm leading-7 text-[#374151]">
                      {result.suggestedNextVideo || "No suggestion was returned."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/scripts"
                        className="rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
                      >
                        Write this script →
                      </Link>
                      <Link
                        href="/ideas"
                        className="rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
                      >
                        Explore more ideas
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#f1f2f6] pt-5">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save analysis"}
                  </button>
                  {savedMessage && <span className="text-sm text-[#6b7280]">{savedMessage}</span>}
                </div>
              </div>
            </div>
          )}

          {!loading && !result && !error && !upgradeInfo && (
            <div className="rounded-2xl border border-dashed border-[#dfe1e8] bg-white/60 px-6 py-16 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdeef6] text-[#ec4899]">
                <PlayCircleIcon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-[#374151]">No analysis yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
                Paste a script or transcript above to see what&apos;s working.
              </p>
            </div>
          )}
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-sm font-semibold text-[#111827]">Overall score</p>

            {result && meta ? (
              <>
                <div className="mt-5 flex flex-col items-center">
                  <div
                    className="flex h-[130px] w-[130px] items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${meta.hex} ${result.overallScore * 3.6}deg, #f1f2f6 0deg)`,
                    }}
                  >
                    <div className="flex h-[100px] w-[100px] flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-4xl font-bold text-[#111827]">
                        {result.overallScore}
                      </span>
                      <span className="text-[11px] text-[#9ca3af]">/100</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold" style={{ color: meta.hex }}>
                    {meta.label}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#f1f2f6] pt-4">
                  <div className="rounded-xl bg-[#e9f9f0] p-3 text-center">
                    <p className="text-lg font-bold text-[#111827]">{result.strengths.length}</p>
                    <p className="text-xs text-[#6b7280]">Strengths</p>
                  </div>
                  <div className="rounded-xl bg-[#fff2e8] p-3 text-center">
                    <p className="text-lg font-bold text-[#111827]">{result.weaknesses.length}</p>
                    <p className="text-xs text-[#6b7280]">To improve</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-[#fafafc] px-4 py-8 text-center text-sm leading-6 text-[#9ca3af]">
                Analyze a script to see its score.
              </p>
            )}
          </div>

          {/* transcript stats */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-sm font-semibold text-[#111827]">Script length</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-[#6b7280]">Words</span>
                <span className="font-semibold text-[#111827]">{transcriptStats.words}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[#6b7280]">Characters</span>
                <span className="font-semibold text-[#111827]">{transcriptStats.chars}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[#6b7280]">Est. spoken length</span>
                <span className="font-semibold text-[#111827]">{transcriptStats.runtime}</span>
              </li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-[#9ca3af]">
              Length assumes ~{WORDS_PER_MINUTE} spoken words per minute.
            </p>
          </div>

          {/* score history — real, from saved analyses */}
          {previousScores.length > 0 && (
            <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
              <p className="text-sm font-semibold text-[#111827]">Your score history</p>
              <p className="mt-1 text-xs text-[#9ca3af]">
                Last {previousScores.length} saved {previousScores.length === 1 ? "analysis" : "analyses"}.
              </p>

              <div className="mt-4 flex h-[70px] items-end gap-1.5">
                {previousScores.map((p, i) => (
                  <div
                    key={i}
                    title={`${p.score}/100`}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${Math.max(6, p.score)}%`,
                      background: scoreMeta(p.score).hex,
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>

              {trend && (
                <p className="mt-3 text-xs text-[#6b7280]">
                  {trend.delta === 0
                    ? "No change across saved analyses."
                    : `${trend.delta > 0 ? "Up" : "Down"} ${Math.abs(trend.delta)} points since your first saved analysis.`}
                </p>
              )}
            </div>
          )}

          {plan === "free" && (
            <div
              className="rounded-2xl p-5 text-white"
              style={{ backgroundImage: "linear-gradient(140deg,#0b1020 0%,#151a2e 55%,#3a2f7a 100%)" }}
            >
              <p className="text-sm font-semibold">Analyze more scripts</p>
              <p className="mt-2 text-sm leading-6 text-[#c8ccdb]">
                Upgrade for more analyses each month and priority processing.
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
        title="Your saved analyses"
        description="Every analysis you've saved, newest first."
        showOpenStudio={false}
        emptyTitle="You haven't saved any analyses yet."
        emptyBody="Analyze a script above and hit Save — it will collect here."
      />
    </div>
  );
}