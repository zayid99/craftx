"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatorProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    creatorName: "",
    niche: "",
    audience: "",
    targetMarket: "",
    primaryPlatform: "",
    contentFormat: "",
    goals: "",
    experienceLevel: "",
    contentStyle: "",
  });

  // Load existing profile if one exists
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/creator-profile");
        const data = await res.json();
        if (data.profile) {
          setForm({
            creatorName: data.profile.creatorName || "",
            niche: data.profile.niche || "",
            audience: data.profile.audience || "",
            targetMarket: data.profile.targetMarket || "",
            primaryPlatform: data.profile.primaryPlatform || "",
            contentFormat: data.profile.contentFormat || "",
            goals: data.profile.goals || "",
            experienceLevel: data.profile.experienceLevel || "",
            contentStyle: data.profile.contentStyle || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.creatorName || !form.niche || !form.primaryPlatform) {
      setError("Creator name, niche, and primary platform are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/creator-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-1">Creator Profile</h1>
      <p className="text-gray-500 mb-6">
        Tell Creova about yourself so it can personalize your ideas, scripts, and strategy.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Creator name *</label>
          <input
            name="creatorName"
            value={form.creatorName}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Zayid"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Niche *</label>
          <input
            name="niche"
            value={form.niche}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Productivity, gaming, education"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Primary platform *</label>
          <input
            name="primaryPlatform"
            value={form.primaryPlatform}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. YouTube, TikTok, Instagram"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target audience</label>
          <input
            name="audience"
            value={form.audience}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Aspiring freelancers aged 18-30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target market</label>
          <input
            name="targetMarket"
            value={form.targetMarket}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Bangladesh, Global English-speaking"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content format</label>
          <input
            name="contentFormat"
            value={form.contentFormat}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Short-form, long-form, both"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Goals</label>
          <textarea
            name="goals"
            value={form.goals}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            rows={3}
            placeholder="What are you trying to achieve as a creator?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Experience level</label>
          <input
            name="experienceLevel"
            value={form.experienceLevel}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Beginner, intermediate, advanced"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preferred content style</label>
          <input
            name="contentStyle"
            value={form.contentStyle}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Educational, entertaining, storytelling"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}