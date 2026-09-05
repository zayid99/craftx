"use client";

import { useState } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import { LightbulbIcon } from "@/components/marketing/landing-icons";

interface Idea {
  title: string;
  angle: string;
  reason: string;
}

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

const EXAMPLE_PROMPTS = [
  "Why people procrastinate",
  "AI tools for content creators",
  "Healthy habits for busy people",
  "Make money online",
  "Study tips for students",
];

const PLATFORMS = ["YouTube", "YouTube Shorts", "TikTok", "Instagram", "LinkedIn"];

interface Props {
  savedItems: SavedItem[];
  defaultNiche: string;
  defaultAudience: string;
  defaultPlatform: string;
}

export default function IdeaStudio({
  savedItems,
  defaultNiche,
  defaultAudience,
  defaultPlatform,
}: Props) {
  const [niche, setNiche] = useState(defaultNiche);
  const [audience, setAudience] = useState(defaultAudience);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [count, setCount] = useState(5);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  /** Bumped after any generate attempt that touched the quota. */
  const [usageRefresh, setUsageRefresh] = useState(0);

  async function handleGenerate() {
    if (!niche.trim()) {
      setError("Please enter a niche or topic.");
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setSavedIndexes(new Set());

    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, audience, platform, count }),
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
          setError(data.error || "Something went wrong.");
        }
        setIdeas([]);
        return;
      }

      setIdeas(data.ideas);
      // Ideas are counted individually, so the drop matches the batch size.
      setUsageRefresh((n) => n + 1);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(idea: Idea, index: number) {
    const text = `${idea.title}\n\nAngle: ${idea.angle}\nWhy: ${idea.reason}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setError("Your browser blocked clipboard access.");
    }
  }

  async function handleSave(idea: Idea, index: number) {
    try {
      const res = await fetch("/api/ideas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          angle: idea.angle,
          reason: idea.reason,
          niche,
          audience,
          platform,
        }),
      });

      if (!res.ok) {
        setError("Could not save that idea. Please try again.");
        return;
      }

      setSavedIndexes((prev) => new Set(prev).add(index));
    } catch {
      setError("Could not save that idea. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6">
      {/* header */}
      <div>
        <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
          IDEA STUDIO
        </span>

        <h2 className="mt-4 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
          Find ideas that{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
          >
            grow
          </span>
          <span className="text-[#6d5cf5]">.</span>
        </h2>

        <p className="mt-2 text-[#6b7280]">
          Get fresh content ideas based on your niche, audience and platform.
        </p>
      </div>

      {/* input card */}
      <div className="rounded-2xl border border-[#ececf1] bg-white p-6">
        <label htmlFor="niche" className="block text-lg font-semibold tracking-tight text-[#111827]">
          What do you want to create content about?
        </label>

        <textarea
          id="niche"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Enter a topic, niche or keywords — e.g. personal finance for beginners, AI tools, home cooking"
          className="mt-4 w-full resize-none rounded-xl border border-[#e5e7eb] bg-[#fafafc] px-4 py-3 text-sm leading-6 text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#c9c6f6] focus:bg-white"
        />
        <p className="mt-1 text-right text-xs text-[#9ca3af]">{niche.length}/500</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="audience" className="mb-1.5 block text-sm font-medium text-[#374151]">
              Audience
            </label>
            <input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. beginners"
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]"
            />
          </div>

          <div>
            <label htmlFor="platform" className="mb-1.5 block text-sm font-medium text-[#374151]">
              Platform
            </label>
            <input
              id="platform"
              type="text"
              list="platform-options"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. YouTube"
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]"
            />
            <datalist id="platform-options">
              {PLATFORMS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="count" className="mb-1.5 block text-sm font-medium text-[#374151]">
              Number of ideas
            </label>
            <input
              id="count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate ideas →"}
            </button>
          </div>
        </div>

        {/* remaining quota — ideas are counted individually, not per generation */}
        <div className="mt-5 border-t border-[#f1f2f6] pt-4">
          <UsageMeter feature="ideas" refreshKey={usageRefresh} />
        </div>

        <div className="mt-5 border-t border-[#f1f2f6] pt-4">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
            Example prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setNiche(p)}
                className="rounded-full border border-[#e5e7eb] bg-white px-3.5 py-1.5 text-xs text-[#6b7280] transition hover:border-[#c9c6f6] hover:text-[#111827]"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
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

      {/* results */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-[#ececf1] bg-[#fafafc]" />
          ))}
        </div>
      )}

      {!loading && ideas.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
                Generated ideas
              </h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                Save the ones worth making — they appear below.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {ideas.map((idea, i) => {
              const isSaved = savedIndexes.has(i);

              return (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-[#ececf1] bg-white p-5 transition hover:border-[#d8d9e4]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-xs font-semibold text-[#3b82f6]">
                      {i + 1}
                    </span>
                    <h4 className="text-[15px] font-semibold leading-6 text-[#111827]">
                      {idea.title}
                    </h4>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                        Angle
                      </p>
                      <p className="mt-0.5 text-[#374151]">{idea.angle}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                        Why it works
                      </p>
                      <p className="mt-0.5 text-[#374151]">{idea.reason}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-[#f1f2f6] pt-4">
                    <button
                      type="button"
                      onClick={() => handleSave(idea, i)}
                      disabled={isSaved}
                      className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                        isSaved
                          ? "bg-[#e9f9f0] text-[#059669]"
                          : "bg-[#0b1020] text-white hover:bg-[#1b2338]"
                      }`}
                    >
                      {isSaved ? "Saved ✓" : "Save idea"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(idea, i)}
                      className="rounded-lg border border-[#e5e7eb] px-3.5 py-2 text-xs font-medium text-[#374151] transition hover:bg-[#f7f8fa]"
                    >
                      {copiedIndex === i ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {savedIndexes.size > 0 && (
            <p className="mt-4 text-sm text-[#6b7280]">
              Saved ideas appear in the list below after you refresh the page.
            </p>
          )}
        </div>
      )}

      {!loading && ideas.length === 0 && !error && !upgradeInfo && (
        <div className="rounded-2xl border border-dashed border-[#dfe1e8] bg-white/60 px-6 py-14 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4ff] text-[#3b82f6]">
            <LightbulbIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-[#374151]">No ideas generated yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
            Add a niche or topic above and generate your first batch.
          </p>
        </div>
      )}

      {/* saved ideas — bottom of the page */}
      <SavedList
        items={savedItems}
        title="Your saved ideas"
        description="Every idea you've saved, newest first."
        showOpenStudio={false}
        emptyTitle="You haven't saved any ideas yet."
        emptyBody="Generate a batch above and hit Save on the ones worth making."
      />
    </div>
  );
}