"use client";

import { useState } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";

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

export default function ScriptStudioPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [format, setFormat] = useState("short-form");
  const [duration, setDuration] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [hookStyle, setHookStyle] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setResult(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          format,
          duration,
          tone,
          audience,
          hookStyle,
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
      const res = await fetch("/api/scripts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
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

      setSavedMessage("Script saved.");
    } catch {
      setSavedMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "1.5rem" }}>
        Script Studio
      </h1>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="Topic (required)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="TikTok">TikTok</option>
          <option value="YouTube Shorts">YouTube Shorts</option>
          <option value="Instagram Reels">Instagram Reels</option>
          <option value="YouTube">YouTube (long-form)</option>
        </select>

        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="short-form">Short-form</option>
          <option value="long-form">Long-form</option>
        </select>

        <input
          placeholder="Duration (e.g. 30-45 sec, 8-10 min)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <input
          placeholder="Tone (e.g. conversational, energetic)"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />
        <input
          placeholder="Target audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        />
        <input
          placeholder="Preferred hook style (e.g. curiosity, shock)"
          value={hookStyle}
          onChange={(e) => setHookStyle(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !topic || !platform || !format}
        >
          {loading ? "Generating..." : "Generate Script"}
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
            <h2 style={{ fontWeight: 600 }}>Hook options</h2>
            {result.hooks.map((h, i) => (
              <div key={i} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                <strong>{h.style}:</strong> {h.text}
              </div>
            ))}
          </section>

          <section>
            <h2 style={{ fontWeight: 600 }}>Script</h2>
            <p><strong>Intro:</strong> {result.script.intro}</p>
            <p style={{ whiteSpace: "pre-wrap" }}><strong>Body:</strong> {"\n"}{result.script.body}</p>
            <p><strong>CTA:</strong> {result.script.cta}</p>
          </section>

          <section>
            <h2 style={{ fontWeight: 600 }}>Alternate endings</h2>
            {result.altEndings.map((e, i) => (
              <div key={i} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                {e.text}
              </div>
            ))}
          </section>

          {result.platformNotes && (
            <section>
              <h2 style={{ fontWeight: 600 }}>Platform notes</h2>
              <p>{result.platformNotes}</p>
            </section>
          )}

          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Script"}
          </button>
          {savedMessage && <div>{savedMessage}</div>}
        </div>
      )}
    </div>
  );
}