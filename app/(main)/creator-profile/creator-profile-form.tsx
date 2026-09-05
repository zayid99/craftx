"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  YoutubeIcon,
  TiktokIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
} from "@/components/marketing/landing-icons";

export interface ProfileValues {
  creatorName: string;
  niche: string;
  primaryPlatform: string;
  secondaryPlatforms: string[];
  contentFormat: string;
  audience: string;
  targetMarket: string;
  experienceLevel: string;
  goals: string;
  contentPillars: string[];
  contentStyle: string;
}

const PLATFORMS = [
  { value: "YouTube", Icon: YoutubeIcon },
  { value: "TikTok", Icon: TiktokIcon },
  { value: "Instagram", Icon: InstagramIcon },
  { value: "LinkedIn", Icon: LinkedinIcon },
  { value: "X (Twitter)", Icon: XIcon },
];

const NICHES = [
  "Education", "Technology", "Productivity", "Finance", "Fitness & Health",
  "Gaming", "Food & Cooking", "Travel", "Business", "Entertainment", "Lifestyle",
];

const FORMATS = [
  "Short-form videos", "Long-form videos", "Tutorials", "Vlogs",
  "Talking head", "Interviews", "Reviews", "Documentary style",
];

const AGE_RANGES = [
  "Under 18", "18 – 24 years old", "18 – 34 years old",
  "25 – 34 years old", "35 – 44 years old", "45+ years old", "Mixed ages",
];

const LOCATIONS = [
  "Worldwide", "North America", "Europe", "South Asia",
  "Southeast Asia", "Middle East", "Africa", "Latin America", "Oceania",
];

const EXPERIENCE = ["Just starting out", "Beginner", "Intermediate", "Advanced", "Professional"];

const PRIMARY_GOALS = [
  "Grow my audience", "Increase watch time", "Improve engagement",
  "Monetize my content", "Build a community", "Become a thought leader",
];

const STYLES = [
  "Conversational", "Educational", "Informative", "Energetic",
  "Storytelling", "Professional", "Humorous",
];

interface Section {
  key: string;
  label: string;
  fields: (keyof ProfileValues)[];
}

/** Only fields that exist in the schema — completeness is measured, not guessed. */
const SECTIONS: Section[] = [
  { key: "about", label: "About you", fields: ["creatorName", "niche", "primaryPlatform", "contentFormat"] },
  { key: "audience", label: "Your audience", fields: ["audience", "targetMarket", "experienceLevel"] },
  { key: "goals", label: "Your goals", fields: ["goals"] },
  { key: "pillars", label: "Content pillars", fields: ["contentPillars"] },
  { key: "voice", label: "Brand voice", fields: ["contentStyle"] },
];

function isFilled(v: ProfileValues, f: keyof ProfileValues) {
  const value = v[f];
  return Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());
}

interface Props {
  initial: ProfileValues;
  hasProfile: boolean;
}

export default function CreatorProfileForm({ initial, hasProfile }: Props) {
  const [values, setValues] = useState<ProfileValues>(initial);
  const [pillarDraft, setPillarDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setMessage(null);
  }

  const sectionScores = useMemo(
    () =>
      SECTIONS.map((s) => {
        const done = s.fields.filter((f) => isFilled(values, f)).length;
        return { ...s, pct: Math.round((done / s.fields.length) * 100) };
      }),
    [values]
  );

  const completeness = useMemo(() => {
    const all = SECTIONS.flatMap((s) => s.fields);
    const done = all.filter((f) => isFilled(values, f)).length;
    return Math.round((done / all.length) * 100);
  }, [values]);

  const ringColor = completeness >= 80 ? "#10b981" : completeness >= 50 ? "#3b82f6" : "#f97316";
  const ringLabel =
    completeness === 100 ? "Complete" : completeness >= 80 ? "Nearly there" : completeness >= 50 ? "Good start" : "Just started";

  function togglePlatform(platform: string) {
    if (!values.primaryPlatform) {
      set("primaryPlatform", platform);
      return;
    }
    if (values.primaryPlatform === platform) {
      // promote the first secondary platform, if any, so a primary always remains
      const [next, ...rest] = values.secondaryPlatforms;
      setValues((v) => ({ ...v, primaryPlatform: next ?? "", secondaryPlatforms: rest }));
      return;
    }
    if (values.secondaryPlatforms.includes(platform)) {
      set("secondaryPlatforms", values.secondaryPlatforms.filter((p) => p !== platform));
    } else {
      set("secondaryPlatforms", [...values.secondaryPlatforms, platform]);
    }
  }

  function addPillar() {
    const p = pillarDraft.trim();
    if (!p || values.contentPillars.includes(p)) {
      setPillarDraft("");
      return;
    }
    set("contentPillars", [...values.contentPillars, p]);
    setPillarDraft("");
  }

  async function handleSave() {
    setError(null);
    setMessage(null);

    if (!values.creatorName.trim() || !values.niche.trim() || !values.primaryPlatform) {
      setError("Creator name, niche and a primary platform are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/creator-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not save your profile. Please try again.");
        return;
      }

      setMessage("Profile saved.");
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#c9c6f6]";
  const label = "mb-1.5 block text-sm font-medium text-[#374151]";
  const hint = "mt-1.5 text-xs text-[#9ca3af]";
  const card = "rounded-2xl border border-[#ececf1] bg-white p-6";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            CREATOR PROFILE
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
            Tell us about your content.
          </h2>
          <p className="mt-2 text-[#6b7280]">
            Get better, personalized recommendations and results.
          </p>
        </div>

        <p className="hidden max-w-[240px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)] lg:block">
          Your profile helps CraftX understand your content, audience and goals.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ============ form ============ */}
        <div className="space-y-4">
          {/* About you */}
          <div className={card}>
            <h3 className="text-lg font-semibold tracking-tight text-[#111827]">About you</h3>
            <p className="mt-1 text-sm text-[#6b7280]">Basic information about you and your content.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="creatorName" className={label}>Creator name</label>
                <input
                  id="creatorName"
                  type="text"
                  value={values.creatorName}
                  onChange={(e) => set("creatorName", e.target.value)}
                  placeholder="How should we address you?"
                  className={field}
                />
                <p className={hint}>This is how we&apos;ll address you.</p>
              </div>

              <div>
                <label htmlFor="niche" className={label}>Your niche</label>
                <input
                  id="niche"
                  type="text"
                  list="niche-opts"
                  value={values.niche}
                  onChange={(e) => set("niche", e.target.value)}
                  placeholder="e.g. Education"
                  className={field}
                />
                <datalist id="niche-opts">
                  {NICHES.map((n) => <option key={n} value={n} />)}
                </datalist>
                <p className={hint}>What is your content mainly about?</p>
              </div>

              <div>
                <label htmlFor="contentFormat" className={label}>Content type</label>
                <input
                  id="contentFormat"
                  type="text"
                  list="format-opts"
                  value={values.contentFormat}
                  onChange={(e) => set("contentFormat", e.target.value)}
                  placeholder="e.g. Long-form videos"
                  className={field}
                />
                <datalist id="format-opts">
                  {FORMATS.map((f) => <option key={f} value={f} />)}
                </datalist>
                <p className={hint}>What type of content do you create most?</p>
              </div>
            </div>

            <div className="mt-5">
              <span className={label}>Platforms</span>
              <p className="mb-3 text-xs text-[#9ca3af]">
                Click one to make it your primary platform; click others to add them.
              </p>

              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((p) => {
                  const isPrimary = values.primaryPlatform === p.value;
                  const isSecondary = values.secondaryPlatforms.includes(p.value);

                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePlatform(p.value)}
                      className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                        isPrimary
                          ? "border-[#c9c6f6] bg-[#f4f6ff] text-[#111827]"
                          : isSecondary
                          ? "border-[#dfe3f5] bg-white text-[#111827]"
                          : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#c9c6f6]"
                      }`}
                    >
                      <p.Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1 text-left">{p.value}</span>
                      {isPrimary && (
                        <span className="rounded-full bg-[#6856fd] px-2 py-0.5 text-[10px] font-medium text-white">
                          Primary
                        </span>
                      )}
                      {isSecondary && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#dfe3f5] text-[10px] text-[#5b5bd6]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Your audience */}
          <div className={card}>
            <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Your audience</h3>
            <p className="mt-1 text-sm text-[#6b7280]">Help us understand who you create content for.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="audience" className={label}>Audience age range</label>
                <select
                  id="audience"
                  value={values.audience}
                  onChange={(e) => set("audience", e.target.value)}
                  className={field}
                >
                  <option value="">Select an age range</option>
                  {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <p className={hint}>The primary age range of your audience.</p>
              </div>

              <div>
                <label htmlFor="targetMarket" className={label}>Audience location</label>
                <select
                  id="targetMarket"
                  value={values.targetMarket}
                  onChange={(e) => set("targetMarket", e.target.value)}
                  className={field}
                >
                  <option value="">Select a location</option>
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <p className={hint}>Where is your audience mainly from?</p>
              </div>

              <div>
                <label htmlFor="experienceLevel" className={label}>Your experience</label>
                <select
                  id="experienceLevel"
                  value={values.experienceLevel}
                  onChange={(e) => set("experienceLevel", e.target.value)}
                  className={field}
                >
                  <option value="">Select your level</option>
                  {EXPERIENCE.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
                </select>
                <p className={hint}>How long have you been creating?</p>
              </div>
            </div>
          </div>

          {/* Your goals */}
          <div className={card}>
            <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Your goals</h3>
            <p className="mt-1 text-sm text-[#6b7280]">What do you want to achieve with your content?</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {PRIMARY_GOALS.map((g) => {
                const active = values.goals === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set("goals", active ? "" : g)}
                    className={`rounded-xl border px-4 py-2.5 text-sm transition ${
                      active
                        ? "border-transparent bg-[#0b1020] text-white"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#c9c6f6]"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label htmlFor="goalsCustom" className={label}>
                Or describe it in your own words
              </label>
              <input
                id="goalsCustom"
                type="text"
                value={values.goals}
                onChange={(e) => set("goals", e.target.value)}
                placeholder="e.g. reach 10k subscribers and land brand deals"
                className={field}
              />
            </div>
          </div>

          {/* Content pillars */}
          <div className={card}>
            <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Content pillars</h3>
            <p className="mt-1 text-sm text-[#6b7280]">
              The recurring themes your content keeps coming back to.
            </p>

            <div className="mt-5 flex gap-2">
              <input
                type="text"
                value={pillarDraft}
                onChange={(e) => setPillarDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPillar();
                  }
                }}
                placeholder="e.g. Productivity, AI tools, Deep work"
                className={field}
              />
              <button
                type="button"
                onClick={addPillar}
                className="shrink-0 rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
              >
                Add
              </button>
            </div>

            {values.contentPillars.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {values.contentPillars.map((p) => (
                  <span
                    key={p}
                    className="flex items-center gap-2 rounded-full bg-[#f4f6ff] px-3 py-1.5 text-sm text-[#5b5bd6]"
                  >
                    {p}
                    <button
                      type="button"
                      aria-label={`Remove ${p}`}
                      onClick={() => set("contentPillars", values.contentPillars.filter((x) => x !== p))}
                      className="text-[#9ca3af] transition hover:text-[#b91c1c]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Brand voice */}
          <div className={card}>
            <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
              Brand voice <span className="text-sm font-normal text-[#9ca3af]">(optional)</span>
            </h3>
            <p className="mt-1 text-sm text-[#6b7280]">Define the tone and style of your content.</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const active = values.contentStyle === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("contentStyle", active ? "" : s)}
                    className={`rounded-xl border px-4 py-2.5 text-sm transition ${
                      active
                        ? "border-transparent bg-[#0b1020] text-white"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#c9c6f6]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#0b1020] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-50"
            >
              {saving ? "Saving…" : hasProfile ? "Save changes" : "Create profile"}
            </button>
            {message && <span className="text-sm text-[#059669]">{message}</span>}
          </div>
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-6">
          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Profile completeness</p>

            <div className="mt-5 flex flex-col items-center">
              <div
                className="flex h-[120px] w-[120px] items-center justify-center rounded-full"
                style={{ background: `conic-gradient(${ringColor} ${completeness * 3.6}deg, #f1f2f6 0deg)` }}
              >
                <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-3xl font-bold text-[#111827]">{completeness}%</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold" style={{ color: ringColor }}>
                {ringLabel}
              </p>
            </div>

            <ul className="mt-5 space-y-3 border-t border-[#f1f2f6] pt-4">
              {sectionScores.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        s.pct === 100 ? "bg-[#10b981] text-white" : "border border-[#d8d9e4] text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={s.pct === 100 ? "text-[#374151]" : "text-[#9ca3af]"}>
                      {s.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[#9ca3af]">{s.pct}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Your content summary</p>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Niche", values.niche],
                ["Content type", values.contentFormat],
                ["Primary platform", values.primaryPlatform],
                ["Audience", [values.audience, values.targetMarket].filter(Boolean).join(" · ")],
                ["Experience", values.experienceLevel],
                ["Primary goal", values.goals],
                ["Tone", values.contentStyle],
              ].map(([k, v]) => (
                <li key={k as string} className="flex items-start justify-between gap-3">
                  <span className="text-[#6b7280]">{k}</span>
                  <span className="max-w-[60%] text-right font-medium text-[#111827]">
                    {v ? String(v) : <span className="text-[#d1d5db]">Not set</span>}
                  </span>
                </li>
              ))}
            </ul>

            {values.contentPillars.length > 0 && (
              <div className="mt-4 border-t border-[#f1f2f6] pt-4">
                <p className="text-xs text-[#6b7280]">Content pillars</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {values.contentPillars.map((p) => (
                    <span key={p} className="rounded-md bg-[#f4f5f8] px-2 py-1 text-xs text-[#374151]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={card}>
            <p className="text-sm font-semibold text-[#111827]">Put it to work</p>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              Your profile pre-fills every studio, so generations start closer to what you actually make.
            </p>
            <Link
              href="/ideas"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
            >
              Generate ideas →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}