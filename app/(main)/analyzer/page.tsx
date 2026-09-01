"use client";

import { useState } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";

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

export default function AnalyzerPage() {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleAnalyze() {
    setError("");
    setUpgradeInfo(null);
    setResult(null);
    setSaved(false);

    if (transcript.trim().length < 50) {
      setError("Please paste a transcript of at least 50 characters.");
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
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data.result);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/analyzer/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          transcript,
          ...result,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not save analysis.");
        return;
      }

      setSaved(true);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">Video Analyzer</h1>
      <p className="text-gray-500 mb-8">
        Paste a transcript to get structured feedback on hook, pacing, and structure.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Why your brain replays embarrassing memories"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Transcript</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Paste your video transcript here..."
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-black text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Video"}
        </button>
      </div>

      {upgradeInfo && (
        <div className="mb-8">
          <UpgradePrompt
            plan={upgradeInfo.plan}
            message={upgradeInfo.message}
            currentUsage={upgradeInfo.currentUsage}
            limit={upgradeInfo.limit}
          />
        </div>
      )}

      {result && (
        <div className="border rounded-xl p-6 space-y-6">
          <div>
            <span className="text-sm text-gray-500">Overall Score</span>
            <div className="text-4xl font-bold">{result.overallScore}/100</div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Strengths</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Weaknesses</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.weaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Suggested Rewrite (Hook)</h3>
            <p className="text-sm bg-gray-50 rounded-lg p-3">{result.suggestedRewrite}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Suggested Next Video</h3>
            <p className="text-sm bg-gray-50 rounded-lg p-3">{result.suggestedNextVideo}</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="bg-black text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {saved ? "Saved ✓" : saving ? "Saving..." : "Save Analysis"}
          </button>
        </div>
      )}
    </div>
  );
}