import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getUser";
import { getUserPlan } from "@/lib/entitlements/checkAccess";
import SavedList, { type SavedItem } from "@/components/dashboard/saved-list";
import {
  LightbulbIcon,
  FileTextIcon,
  SearchIcon,
  PlayCircleIcon,
  CalendarIcon,
} from "@/components/marketing/landing-icons";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = {
  free: "Free plan",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

// "Get coaching" removed pre-launch — Creator Coach ran on Claude Sonnet and
// accounted for ~95% of projected API cost. Add it back here (with UserIcon
// re-imported and the grid returned to lg:grid-cols-6) when the Coach returns.
const quickActions = [
  { label: "Generate ideas", href: "/ideas", Icon: LightbulbIcon, tint: "bg-[#eef4ff] text-[#3b82f6]" },
  { label: "Write a script", href: "/scripts", Icon: FileTextIcon, tint: "bg-[#f3eeff] text-[#8b5cf6]" },
  { label: "Optimize SEO", href: "/seo", Icon: SearchIcon, tint: "bg-[#e9f9f0] text-[#10b981]" },
  { label: "Analyze a script", href: "/analyzer", Icon: PlayCircleIcon, tint: "bg-[#fdeef6] text-[#ec4899]" },
  { label: "Plan content", href: "/planner", Icon: CalendarIcon, tint: "bg-[#fff2e8] text-[#f97316]" },
];

/** Safely turns a Prisma Json column into a short human-readable string. */
function jsonPreview(value: unknown, max = 3): string {
  if (value == null) return "—";

  if (Array.isArray(value)) {
    const parts = value.slice(0, max).map((v) => {
      if (typeof v === "string") return v;
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        const first = o.title ?? o.text ?? o.hook ?? o.heading ?? o.label;
        if (typeof first === "string") return first;
      }
      return String(v);
    });
    const extra = value.length > max ? ` +${value.length - max} more` : "";
    return parts.join("\n") + extra;
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const first = o.title ?? o.text ?? o.summary;
    if (typeof first === "string") return first;
    return Object.keys(o).slice(0, max).join(", ");
  }

  return String(value);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const userId = user.id;

  const [
    profile,
    plan,
    ideaCount,
    scriptCount,
    analysisCount,
    planCount,
    seoCount,
    recentIdeas,
    recentScripts,
    recentSeo,
    recentPlans,
    recentAnalyses,
  ] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId } }),
    getUserPlan(userId),
    prisma.savedIdea.count({ where: { userId } }),
    prisma.savedScript.count({ where: { userId } }),
    prisma.videoAnalysis.count({ where: { userId } }),
    prisma.savedContentPlan.count({ where: { userId } }),
    prisma.savedSEO.count({ where: { userId } }),
    prisma.savedIdea.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.savedScript.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.savedSEO.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.savedContentPlan.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.videoAnalysis.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const stats = [
    { label: "Ideas", value: ideaCount, hint: "saved", href: "/ideas", Icon: LightbulbIcon, tint: "bg-[#eef4ff]", icon: "text-[#3b82f6]" },
    { label: "Scripts", value: scriptCount, hint: "saved", href: "/scripts", Icon: FileTextIcon, tint: "bg-[#f3eeff]", icon: "text-[#8b5cf6]" },
    { label: "Scripts analyzed", value: analysisCount, hint: "", href: "/analyzer", Icon: PlayCircleIcon, tint: "bg-[#e9f9f0]", icon: "text-[#10b981]" },
    { label: "Content plans", value: planCount, hint: "saved", href: "/planner", Icon: CalendarIcon, tint: "bg-[#fff2e8]", icon: "text-[#f97316]" },
  ];

  /* ---- Creator profile completion (real fields from the schema) ---- */
  const profileChecks: { label: string; done: boolean }[] = [
    { label: "Creator name", done: Boolean(profile?.creatorName) },
    { label: "Niche", done: Boolean(profile?.niche) },
    { label: "Target audience", done: Boolean(profile?.audience) },
    { label: "Primary platform", done: Boolean(profile?.primaryPlatform) },
    { label: "Goals", done: Boolean(profile?.goals) },
    { label: "Content pillars", done: (profile?.contentPillars?.length ?? 0) > 0 },
  ];
  const completed = profileChecks.filter((c) => c.done).length;
  const completion = Math.round((completed / profileChecks.length) * 100);

  /* ---- Recommended next step, derived from real state ---- */
  const nextStep = !profile
    ? {
        eyebrow: "Start here",
        title: "Set up your creator profile",
        body: "Your niche, audience and goals make every generation more relevant to you.",
        cta: "Set up profile",
        href: "/creator-profile",
      }
    : ideaCount === 0
    ? {
        eyebrow: "Recommended next step",
        title: "Generate your first ideas",
        body: "Turn your niche and audience into content ideas worth making.",
        cta: "Open Idea Studio",
        href: "/ideas",
      }
    : scriptCount === 0
    ? {
        eyebrow: "Recommended next step",
        title: "Turn your idea into a script",
        body: recentIdeas[0] ? `"${recentIdeas[0].title}"` : "Give one of your saved ideas a real structure.",
        cta: "Open Script Studio",
        href: "/scripts",
      }
    : seoCount === 0
    ? {
        eyebrow: "Recommended next step",
        title: "Make your upload discoverable",
        body: "Generate titles, descriptions, keywords and hashtags for your script.",
        cta: "Open SEO Studio",
        href: "/seo",
      }
    : analysisCount === 0
    ? {
        eyebrow: "Recommended next step",
        title: "Find what's holding your scripts back",
        body: "Run a script or transcript through the analyzer to see strengths and weaknesses.",
        cta: "Open Script Analyzer",
        href: "/analyzer",
      }
    : {
        eyebrow: "Keep the loop going",
        title: "Plan your next batch of content",
        body: "Use what you learned to schedule the next week or month.",
        cta: "Open Content Planner",
        href: "/planner",
      };

  /* ---- Saved work, merged and sorted newest-first ---- */
  const savedItems: SavedItem[] = [
    ...recentIdeas.map((i): SavedItem => ({
      id: i.id,
      kind: "idea",
      title: i.title,
      subtitle: i.niche,
      tags: [i.platform, i.audience].filter((v): v is string => Boolean(v)),
      createdAt: i.createdAt.toISOString(),
      href: "/ideas",
      preview: [
        { label: "Angle", value: i.angle },
        { label: "Why it works", value: i.reason },
      ],
    })),
    ...recentScripts.map((s): SavedItem => ({
      id: s.id,
      kind: "script",
      title: s.topic,
      subtitle: `${s.platform} · ${s.format}`,
      tags: [s.duration, s.tone].filter((v): v is string => Boolean(v)),
      createdAt: s.createdAt.toISOString(),
      href: "/scripts",
      preview: [
        { label: "Hooks", value: jsonPreview(s.hooks) },
        { label: "Script outline", value: jsonPreview(s.script, 4) },
        ...(s.platformNotes ? [{ label: "Platform notes", value: s.platformNotes }] : []),
      ],
    })),
    ...recentSeo.map((s): SavedItem => ({
      id: s.id,
      kind: "seo",
      title: s.topic,
      subtitle: s.platform,
      tags: s.searchIntent ? [s.searchIntent] : [],
      createdAt: s.createdAt.toISOString(),
      href: "/seo",
      preview: [
        { label: "Titles", value: jsonPreview(s.titles) },
        { label: "Description", value: s.description },
        { label: "Keywords", value: s.keywords.slice(0, 10).join(", ") || "—" },
        { label: "Hashtags", value: s.hashtags.slice(0, 10).join(" ") || "—" },
      ],
    })),
    ...recentPlans.map((p): SavedItem => ({
      id: p.id,
      kind: "plan",
      title: `${p.durationDays}-day plan · ${p.niche}`,
      subtitle: p.platform,
      tags: p.pillars.slice(0, 2),
      createdAt: p.createdAt.toISOString(),
      href: "/planner",
      preview: [
        ...(p.goals ? [{ label: "Goals", value: p.goals }] : []),
        { label: "Pillars", value: p.pillars.join(", ") || "—" },
        { label: "Schedule", value: jsonPreview(p.days, 4) },
      ],
    })),
    ...recentAnalyses.map((a): SavedItem => ({
      id: a.id,
      kind: "analysis",
      title: a.title || "Untitled analysis",
      subtitle: `Score ${a.overallScore}/100`,
      tags: [],
      createdAt: a.createdAt.toISOString(),
      href: "/analyzer",
      preview: [
        { label: "Strengths", value: jsonPreview(a.strengths) },
        { label: "Weaknesses", value: jsonPreview(a.weaknesses) },
        { label: "Recommendations", value: jsonPreview(a.recommendations) },
      ],
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 40);

  const displayName = profile?.creatorName || user.email?.split("@")[0] || "Creator";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------------- main column ---------------- */}
        <div className="space-y-6">
          {/* greeting */}
          <div>
            <p className="text-sm text-[#9ca3af]">{today}</p>
            <h2 className="mt-1 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
              {greeting()}, {displayName}.
            </h2>
            <p className="mt-2 text-[#6b7280]">What are you creating today?</p>
          </div>

          {/* stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={`group rounded-2xl ${s.tint} p-5 transition hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 ${s.icon}`}>
                    <s.Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[#9ca3af] transition group-hover:translate-x-0.5">→</span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[#111827]">{s.value}</p>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {s.label} <span className="text-[#9ca3af]">{s.hint}</span>
                </p>
              </Link>
            ))}
          </div>

          {/* recommended next step */}
          <div
            className="relative overflow-hidden rounded-2xl p-7 text-white"
            style={{
              backgroundImage:
                "linear-gradient(100deg,#0b1020 0%,#151a2e 55%,#3a2f7a 82%,#5b6fd6 100%)",
            }}
          >
            <p className="text-xs uppercase tracking-[1.5px] text-white/45">
              {nextStep.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">{nextStep.title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#c8ccdb]">{nextStep.body}</p>
            <Link
              href={nextStep.href}
              className="mt-5 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-white/90"
            >
              {nextStep.cta} →
            </Link>
          </div>

          {/* quick actions */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
                Quick actions
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group rounded-2xl border border-[#ececf1] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#d8d9e4]"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.tint}`}>
                    <a.Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium leading-5 text-[#111827]">
                    {a.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* saved work — the library at the bottom */}
          <SavedList
            items={savedItems}
            showFilters
            description="Everything you've saved across CraftX, newest first."
            emptyTitle="You haven't saved anything yet."
            emptyBody="Generate ideas, scripts, SEO, plans or analyses and hit save — they all collect here."
            emptyCta={{ label: "Generate your first idea", href: "/ideas" }}
          />
        </div>

        {/* ---------------- right rail ---------------- */}
        <aside className="space-y-6">
          {/* plan */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#6b7280]">Your plan</p>
              <span className="rounded-full bg-[#eef0fb] px-2.5 py-1 text-xs font-medium text-[#6856fd]">
                {PLAN_LABEL[plan] ?? "Free plan"}
              </span>
            </div>

            {plan === "free" ? (
              <>
                <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                  Upgrade for higher limits, priority processing and advanced
                  insights.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
                >
                  Upgrade now →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                  You have full access to your plan&apos;s tools and limits.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-4 inline-flex w-full justify-center rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
                >
                  Manage subscription
                </Link>
              </>
            )}
          </div>

          {/* profile completion */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#111827]">
                Complete your creator profile
              </p>
              <span className="text-sm font-semibold text-[#111827]">{completion}%</span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f2f6]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${completion}%`,
                  backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)",
                }}
              />
            </div>

            <ul className="mt-4 space-y-2.5">
              {profileChecks.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      c.done ? "bg-[#6856fd] text-white" : "border border-[#d8d9e4] text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={c.done ? "text-[#374151]" : "text-[#9ca3af]"}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/creator-profile"
              className="mt-5 inline-flex w-full justify-center rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
            >
              {completion === 100 ? "Edit profile" : "Continue setup"} →
            </Link>
          </div>

          {/* library summary */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-sm font-semibold text-[#111827]">Your library</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Saved ideas", value: ideaCount, dot: "bg-[#3b82f6]" },
                { label: "Saved scripts", value: scriptCount, dot: "bg-[#8b5cf6]" },
                { label: "Saved SEO sets", value: seoCount, dot: "bg-[#10b981]" },
                { label: "Content plans", value: planCount, dot: "bg-[#f97316]" },
                { label: "Script analyses", value: analysisCount, dot: "bg-[#ec4899]" },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-[#6b7280]">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="font-semibold text-[#111827]">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}