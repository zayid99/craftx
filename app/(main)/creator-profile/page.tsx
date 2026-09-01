"use client";

import { useEffect, useState } from "react";

interface ProfileFormState {
  creatorName: string;
  niche: string;
  primaryPlatform: string;
  audience: string;
  targetMarket: string;
  secondaryPlatforms: string; // comma-separated in the UI, array in the API
  contentFormat: string;
  goals: string;
  experienceLevel: string;
  contentStyle: string;
  contentPillars: string; // comma-separated in the UI, array in the API
}

const EMPTY_FORM: ProfileFormState = {
  creatorName: "",
  niche: "",
  primaryPlatform: "",
  audience: "",
  targetMarket: "",
  secondaryPlatforms: "",
  contentFormat: "",
  goals: "",
  experienceLevel: "",
  contentStyle: "",
  contentPillars: "",
};

export default function CreatorProfilePage() {
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/creator-profile");
        const data = await res.json();

        if (res.ok && data.profile) {
          setForm({
            creatorName: data.profile.creatorName ?? "",
            niche: data.profile.niche ?? "",
            primaryPlatform: data.profile.primaryPlatform ?? "",
            audience: data.profile.audience ?? "",
            targetMarket: data.profile.targetMarket ?? "",
            secondaryPlatforms: (data.profile.secondaryPlatforms ?? []).join(", "),
            contentFormat: data.profile.contentFormat ?? "",
            goals: data.profile.goals ?? "",
            experienceLevel: data.profile.experienceLevel ?? "",
            contentStyle: data.profile.contentStyle ?? "",
            contentPillars: (data.profile.contentPillars ?? []).join(", "),
          });
        }
      } catch {
        // No existing profile yet — that's fine, form stays empty
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/creator-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: form.creatorName,
          niche: form.niche,
          primaryPlatform: form.primaryPlatform,
          audience: form.audience || null,
          targetMarket: form.targetMarket || null,
          secondaryPlatforms: form.secondaryPlatforms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          contentFormat: form.contentFormat || null,
          goals: form.goals || null,
          experienceLevel: form.experienceLevel || null,
          contentStyle: form.contentStyle || null,
          contentPillars: form.contentPillars
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not save profile.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-black/50">Loading profile...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Creator Profile</h1>
      <p className="text-black/50 mb-6">
        This context is used across CraftX to personalize your ideas, scripts, and recommendations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Creator name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.creatorName}
            onChange={(e) => updateField("creatorName", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Niche <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. cooking, tech reviews, personal finance"
            value={form.niche}
            onChange={(e) => updateField("niche", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Primary platform <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. YouTube, TikTok, Instagram"
            value={form.primaryPlatform}
            onChange={(e) => updateField("primaryPlatform", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target audience</label>
          <input
            type="text"
            value={form.audience}
            onChange={(e) => updateField("audience", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target market</label>
          <input
            type="text"
            placeholder="e.g. US, global, Bangladesh"
            value={form.targetMarket}
            onChange={(e) => updateField("targetMarket", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Secondary platforms (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. Instagram, X"
            value={form.secondaryPlatforms}
            onChange={(e) => updateField("secondaryPlatforms", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content format</label>
          <input
            type="text"
            placeholder="e.g. short-form, long-form, both"
            value={form.contentFormat}
            onChange={(e) => updateField("contentFormat", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Goals</label>
          <textarea
            rows={3}
            value={form.goals}
            onChange={(e) => updateField("goals", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Experience level</label>
          <input
            type="text"
            placeholder="e.g. beginner, intermediate, advanced"
            value={form.experienceLevel}
            onChange={(e) => updateField("experienceLevel", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content style</label>
          <input
            type="text"
            placeholder="e.g. educational, entertaining, storytelling"
            value={form.contentStyle}
            onChange={(e) => updateField("contentStyle", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Content pillars (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. recipes, kitchen tips, reviews"
            value={form.contentPillars}
            onChange={(e) => updateField("contentPillars", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">Profile saved successfully.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}