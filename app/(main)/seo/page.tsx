"use client";

import { useState } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";

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

export default function SEOStudioPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("YouTube Shorts");
  const [contentDescription, setContentDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<SEOResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setResult(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          contentDescription,
          targetAudience,
          tone,
        }),
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

      setResult(data);
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
          topic,
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

      setSavedMessage("SEO saved.");
    } catch {
      setSavedMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "1.5rem" }}>
        SEO Studio
      </h1>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="Topic (required)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="YouTube Shorts">YouTube Shorts</option>
          <option value="YouTube">YouTube (long-form)</option>
          <option value="TikTok">TikTok</option>
          <option value="Instagram Reels">Instagram Reels</option>
        </select>

        <input
          placeholder="Content description (optional)"
          value={contentDescription}
          onChange={(e) => setContentDescription(e.target.value)}
        />
        <input
          placeholder="Target audience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
        />
        <input
          placeholder="Tone (e.g. conversational, energetic)"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !topic || !platform}
        >
          {loading ? "Generating..." : "Generate SEO"}
        </button>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: "1rem" }}>{error}</div>
      )}

      {upgradeInfo && (
        <div style={{ marginBottom: "1.5rem" }}>
          <UpgradePrompt
            plan={upgradeInfo.plan}
            message={upgradeInfo.message}
            currentUsage={upgradeInfo.currentUsage}
            limit={upgradeInfo.limit}
          />
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <section>
            <h2 style={{ fontWeight: 600 }}>Title options</h2>
            {result.titles.map((t, i) => (
              <div key={i} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                <strong>{t.angle}:</strong> {t.text}
              </div>
            ))}
          </section>

          <section>
            <h2 style={{ fontWeight: 600 }}>Description</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{result.description}</p>
          </section>

          <section>
            <h2 style={{ fontWeight: 600 }}>Keywords</h2>
            <p>{result.keywords.join(", ")}</p>
          </section>

          <section>
            <h2 style={{ fontWeight: 600 }}>Hashtags</h2>
            <p>{result.hashtags.map((h) => `#${h}`).join(" ")}</p>
          </section>

          <section>
            <h2 style={{ fontWeight: 600 }}>Search intent</h2>
            <p>{result.searchIntent}</p>
          </section>

          {result.disclaimer && (
            <p style={{ fontSize: "0.85rem", color: "#888" }}>
              {result.disclaimer}
            </p>
          )}

          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save SEO"}
          </button>
          {savedMessage && <div>{savedMessage}</div>}
        </div>
      )}
    </div>
  );
}