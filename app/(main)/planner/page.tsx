"use client";

import { useState } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";

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

export default function ContentPlannerPage() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("YouTube Shorts");
  const [goals, setGoals] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [autoFill, setAutoFill] = useState(true);
  const [postingFrequency, setPostingFrequency] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setUpgradeInfo(null);
    setResult(null);
    setSavedMessage(null);

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          platform,
          goals,
          durationDays,
          autoFill,
          postingFrequency,
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

  function updateDay(index: number, field: keyof PlanDay, value: string) {
    if (!result) return;
    const updatedDays = [...result.days];
    updatedDays[index] = { ...updatedDays[index], [field]: value };
    setResult({ ...result, days: updatedDays });
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

      setSavedMessage("Content plan saved.");
    } catch {
      setSavedMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "1.5rem" }}>
        Content Planner
      </h1>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="Niche (required)"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
        />

        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="YouTube Shorts">YouTube Shorts</option>
          <option value="YouTube">YouTube (long-form)</option>
          <option value="TikTok">TikTok</option>
          <option value="Instagram Reels">Instagram Reels</option>
        </select>

        <input
          placeholder="Goals (optional)"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
        />

        <select
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
        >
          <option value={7}>7-day plan</option>
          <option value={30}>30-day plan</option>
        </select>

        <input
          placeholder="Posting frequency (e.g. daily, 5x/week)"
          value={postingFrequency}
          onChange={(e) => setPostingFrequency(e.target.value)}
        />

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={autoFill}
            onChange={(e) => setAutoFill(e.target.checked)}
          />
          Let AI fill in topics and hooks for each day
        </label>

        <button onClick={handleGenerate} disabled={loading || !niche || !platform}>
          {loading ? "Generating..." : "Generate Plan"}
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
          {result.pillars.length > 0 && (
            <section>
              <h2 style={{ fontWeight: 600 }}>Content pillars</h2>
              <p>{result.pillars.join(", ")}</p>
            </section>
          )}

          <section>
            <h2 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
              {durationDays}-day calendar
            </h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {result.days.map((d, i) => (
                <div
                  key={d.day}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: "0.75rem",
                    display: "grid",
                    gap: "0.4rem",
                  }}
                >
                  <strong>Day {d.day}</strong>
                  <input
                    placeholder="Pillar"
                    value={d.pillar}
                    onChange={(e) => updateDay(i, "pillar", e.target.value)}
                  />
                  <input
                    placeholder="Topic"
                    value={d.topic}
                    onChange={(e) => updateDay(i, "topic", e.target.value)}
                  />
                  <input
                    placeholder="Format"
                    value={d.format}
                    onChange={(e) => updateDay(i, "format", e.target.value)}
                  />
                  <input
                    placeholder="Hook"
                    value={d.hook}
                    onChange={(e) => updateDay(i, "hook", e.target.value)}
                  />
                  <input
                    placeholder="Notes"
                    value={d.notes}
                    onChange={(e) => updateDay(i, "notes", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Plan"}
          </button>
          {savedMessage && <div>{savedMessage}</div>}
        </div>
      )}
    </div>
  );
}