"use client";

import { useState } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";

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

export default function IdeaStudioPage() {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [count, setCount] = useState(5);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  async function handleGenerate() {
    if (!niche.trim()) {
      setError("Please enter a niche.");
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeInfo(null);

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
        } else {
          setError(data.error || "Something went wrong.");
        }
        setIdeas([]);
        return;
      }

      setIdeas(data.ideas);
    } catch {
      setError("Creova is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(idea: Idea) {
    const text = `${idea.title}\n\nAngle: ${idea.angle}\nWhy: ${idea.reason}`;
    navigator.clipboard.writeText(text);
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

      if (!res.ok) return;

      setSavedIndexes((prev) => new Set(prev).add(index));
    } catch {
      // silent fail is fine here; button just won't show "Saved"
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">Idea Studio</h1>
      <p className="text-gray-500 mb-6">
        Generate video ideas tailored to your niche and audience.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Niche *</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. personal finance, cooking, tech reviews"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Audience</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. young professionals"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. YouTube Shorts, TikTok"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Number of ideas
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-24 border rounded-md px-3 py-2"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Ideas"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 mb-6">
          {error}
        </div>
      )}

      {upgradeInfo && (
        <div className="mb-6">
          <UpgradePrompt
            plan={upgradeInfo.plan}
            message={upgradeInfo.message}
            currentUsage={upgradeInfo.currentUsage}
            limit={upgradeInfo.limit}
          />
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {!loading && ideas.length === 0 && !error && !upgradeInfo && (
        <div className="text-gray-400 text-center py-12 border border-dashed rounded-md">
          No ideas yet. Fill in a niche and generate your first batch.
        </div>
      )}

      <div className="space-y-4">
        {ideas.map((idea, i) => (
          <div key={i} className="border rounded-md p-4">
            <h3 className="font-semibold mb-1">{idea.title}</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Angle:</span> {idea.angle}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Why:</span> {idea.reason}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleCopy(idea)}
                className="text-sm text-blue-600 hover:underline"
              >
                Copy
              </button>
              <button
                onClick={() => handleSave(idea, i)}
                disabled={savedIndexes.has(i)}
                className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {savedIndexes.has(i) ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}