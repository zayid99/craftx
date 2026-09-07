import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import PricingSection from "@/components/marketing/pricing-section";
import {
  LightbulbIcon,
  FileTextIcon,
  SearchIcon,
  ChartIcon,
  PlayCircleIcon,
  CalendarIcon,
  TrendingUpIcon,
  HomeIcon,
  FolderIcon,
  SettingsIcon,
  BellIcon,
  YoutubeIcon,
  TiktokIcon,
  InstagramIcon,
  FacebookIcon,
  XIcon,
  LinkedinIcon,
  ShortsIcon,
  ArrowsIcon,
  PlusIcon,
} from "@/components/marketing/landing-icons";

/* ---------------------------------------------------------------
   One shared container width (1280px) across every section, so no
   section reads as narrow content stranded in white space.

   MOBILE NOTE: every size in this file is written mobile-first.
   A bare value (text-[40px]) is the PHONE size; the sm:/lg: prefix
   restores the desktop size. If you add a new fixed size here and
   don't give it a phone value, it will render at desktop scale on a
   390px screen — which is what made this page ~19 screens tall.
   --------------------------------------------------------------- */
const shell = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-10";

const platforms = [
  { name: "YouTube", Icon: YoutubeIcon },
  { name: "TikTok", Icon: TiktokIcon },
  { name: "Instagram", Icon: InstagramIcon },
  { name: "Facebook", Icon: FacebookIcon },
  { name: "X (Twitter)", Icon: XIcon },
  { name: "LinkedIn", Icon: LinkedinIcon },
  { name: "Shorts", Icon: ShortsIcon },
  { name: "More", Icon: ArrowsIcon },
];

// Replaces the four blank pastel circles, which said nothing.
//
// One label at every size. This used to carry a second `short` field rendered
// through a paired <span className="sm:hidden"> / <span className="hidden
// sm:inline"> — Brave's Shields hid both spans, so the labels vanished
// entirely. Never use two elements to render one piece of text: anything that
// hides an element for its own reasons takes the whole thing with it.
const heroStats = [
  { value: "5", label: "tools in one workspace" },
  { value: "7", label: "platforms supported" },
  { value: "$0", label: "to start, no card needed" },
];

// Figma node 5:120 — each chip carries its own left indent.
// The indent is applied as a CSS variable so it can be switched off
// below sm:, where a staggered stack just reads as misalignment.
const painPoints = [
  { text: "What should I make next?", indent: 0 },
  { text: "How do I write a good script?", indent: 14 },
  { text: "Is my title good enough?", indent: 4 },
  { text: "Will people actually watch this?", indent: 40 },
  { text: "How can I grow faster?", indent: 11 },
];

// Anchors the left side of the fragmented section, which was mostly air.
const scatteredTools = [
  "Notes app full of half-ideas",
  "A spreadsheet you stopped updating",
  "Three different AI chats",
  "Analytics you only read afterwards",
];

const workflow = [
  { Icon: LightbulbIcon, title: "Research", body: "Discover opportunities and understand your audience." },
  { Icon: FileTextIcon, title: "Create", body: "Turn ideas into structured scripts and content." },
  { Icon: ChartIcon, title: "Optimize", body: "Improve titles, descriptions, keywords and packaging." },
  { Icon: PlayCircleIcon, title: "Analyze", body: "Understand what worked and what didn't." },
  { Icon: TrendingUpIcon, title: "Grow", body: "Use what you learned to make the next piece better." },
];

// Three across instead of six, so each card has room for real content.
// The grey skeleton bars are gone — they were filler.
//
// Creator Coach removed pre-launch: it ran on Claude Sonnet and accounted
// for ~95% of projected API cost. Re-add the card here when revenue supports
// turning the route back on.
const tools = [
  {
    Icon: LightbulbIcon,
    title: "Idea Studio",
    description: "Stop wondering what to create next.",
    href: "/ideas",
    accent: false,
    tint: "bg-[#eef4ff] text-[#3b82f6]",
    points: [
      "Ideas shaped by your niche and audience",
      "An angle and a reason it works for each",
      "Save the ones worth making",
    ],
  },
  {
    Icon: FileTextIcon,
    title: "Script Studio",
    description: "Go from idea to structure in minutes.",
    href: "/scripts",
    accent: false,
    tint: "bg-[#f3eeff] text-[#8b5cf6]",
    points: [
      "Several hook options to choose from",
      "Intro, body and call to action",
      "Alternate endings to test",
    ],
  },
  {
    Icon: SearchIcon,
    title: "SEO Studio",
    description: "Make every upload easier to discover.",
    href: "/seo",
    accent: false,
    tint: "bg-[#e9f9f0] text-[#10b981]",
    points: [
      "Titles, description, keywords, hashtags",
      "Packaging tuned per platform",
      "A checklist that scores your set",
    ],
  },
  {
    Icon: PlayCircleIcon,
    title: "Script Analyzer",
    description: "Understand what's holding you back.",
    href: "/analyzer",
    accent: true,
    tint: "bg-white/15 text-white",
    points: [
      "An overall score out of 100",
      "Strengths and weak points, named",
      "A stronger rewrite of your opening",
    ],
  },
  {
    Icon: CalendarIcon,
    title: "Content Planner",
    description: "Stop creating randomly.",
    href: "/planner",
    accent: false,
    tint: "bg-[#fff2e8] text-[#f97316]",
    points: [
      "7, 14 or 30 days at a time",
      "Balanced across your content pillars",
      "Every day editable before you save",
    ],
  },
];

/* ---------------------------------------------------------------
   FRONTIER MODELS

   `status` is the honesty switch. Only models actually wired up in
   lib/ai/ should be "live" — everything else stays "soon" until its
   provider is enabled. Flip the flag when you add the provider, not
   before: a paid plan that advertises access it doesn't have yet is
   a refund request waiting to happen.

   Claude dropped to "soon" when Creator Coach was disabled — it was
   the only route calling Anthropic. Flip it back to "live" when the
   Coach returns.

   `solo` is the rough cost of that model's own consumer plan, used
   for the comparison below. Check these before you ship — provider
   pricing moves, and a wrong number here is a wrong number in public.
   --------------------------------------------------------------- */
const models: {
  name: string;
  provider: string;
  strength: string;
  status: "live" | "soon";
  solo: number;
  logo: string;
}[] = [
  { name: "DeepSeek V4 Flash", provider: "DeepSeek", strength: "Fast drafting across every studio", status: "live", solo: 20, logo: "deepseek.png" },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", strength: "Nuanced coaching and long-form reasoning", status: "soon", solo: 20, logo: "anthropic.png" },
  { name: "Claude Fable 5", provider: "Anthropic", strength: "Deepest reasoning for hard creative problems", status: "soon", solo: 20, logo: "anthropic.png" },
  { name: "GPT-5.6 Sol", provider: "OpenAI", strength: "Broad general knowledge and structure", status: "soon", solo: 20, logo: "openai.png" },
  { name: "Gemini 3.8 Flash", provider: "Google", strength: "High-volume generation at speed", status: "soon", solo: 20, logo: "google.png" },
  { name: "Kimi K3", provider: "Moonshot AI", strength: "Long context for full transcripts", status: "soon", solo: 20, logo: "moonshot.png" },
  { name: "Grok 4.6", provider: "xAI", strength: "Current events and trend awareness", status: "soon", solo: 20, logo: "xai.png" },
  { name: "Qwen 3 Max", provider: "Alibaba", strength: "Strong multilingual output", status: "soon", solo: 20, logo: "" },
];

/** The four claims that sit under the logo grid. */
const modelBenefits = [
  { Icon: ChartIcon, title: "8+ premium models", body: "All in one place" },
  { Icon: TrendingUpIcon, title: "One bill, not eight", body: "Compared to paying separately" },
  { Icon: FileTextIcon, title: "Right model per job", body: "Chosen for you, automatically" },
  { Icon: CalendarIcon, title: "No hidden fees", body: "One price, cancel anytime" },
];

const soloTotal = models.reduce((sum, m) => sum + m.solo, 0);
const liveCount = models.filter((m) => m.status === "live").length;

const sidebarNav = [
  { Icon: HomeIcon, label: "Home", active: true },
  { Icon: LightbulbIcon, label: "Idea Studio" },
  { Icon: FileTextIcon, label: "Script Studio" },
  { Icon: SearchIcon, label: "SEO Studio" },
  { Icon: PlayCircleIcon, label: "Script Analyzer" },
  { Icon: CalendarIcon, label: "Content Planner" },
];

const statChips = [
  { label: "Ideas", value: "24", delta: "+12%", Icon: LightbulbIcon, tint: "bg-[#eef4ff] text-[#3b82f6]" },
  { label: "Scripts", value: "8", delta: "+3%", Icon: FileTextIcon, tint: "bg-[#f3eeff] text-[#8b5cf6]" },
  { label: "Videos", value: "12", delta: "+25%", Icon: PlayCircleIcon, tint: "bg-[#e9f9f0] text-[#10b981]" },
  { label: "Plan", value: "3", delta: "+10%", Icon: CalendarIcon, tint: "bg-[#fff2e8] text-[#f97316]" },
];

/* ---------------------------------------------------------------
   PLAN COMPARISON

   These numbers mirror lib/entitlements/limits.ts exactly. If a limit
   changes there, change it here too — a pricing page that promises
   more than the entitlement system allows becomes a support ticket.

   The Free column is a ONE-TIME allocation counted over all time, while
   Creator and Creator Pro refresh on the 1st. Don't label this group
   "Monthly usage" again without changing checkAccess to match.
   --------------------------------------------------------------- */
const comparisonGroups: {
  group: string;
  rows: { label: string; free: string; creator: string; pro: string }[];
}[] = [
  {
    group: "Usage limits",
    rows: [
      { label: "Content ideas", free: "10", creator: "Unlimited", pro: "Unlimited" },
      { label: "Scripts", free: "5", creator: "50", pro: "Unlimited" },
      { label: "SEO sets", free: "15", creator: "150", pro: "400" },
      { label: "Content plans", free: "5", creator: "30", pro: "100" },
      { label: "Script analyses", free: "3", creator: "20", pro: "Unlimited" },
    ],
  },
  {
    group: "Tools",
    rows: [
      { label: "Idea Studio", free: "yes", creator: "yes", pro: "yes" },
      { label: "Script Studio", free: "yes", creator: "yes", pro: "yes" },
      { label: "SEO Studio", free: "yes", creator: "yes", pro: "yes" },
      { label: "Script Analyzer", free: "yes", creator: "yes", pro: "yes" },
      { label: "Content Planner", free: "yes", creator: "yes", pro: "yes" },
    ],
  },
  {
    group: "Everything else",
    rows: [
      { label: "Creator profile context", free: "yes", creator: "yes", pro: "yes" },
      { label: "Save, copy and export your work", free: "yes", creator: "yes", pro: "yes" },
      { label: "Priority processing", free: "no", creator: "yes", pro: "yes" },
      { label: "Advanced growth insights", free: "no", creator: "no", pro: "yes" },
      { label: "Early access to new features", free: "no", creator: "no", pro: "yes" },
      { label: "Support", free: "Community", creator: "Standard", pro: "Premium" },
    ],
  },
];

function Cell({ value }: { value: string }) {
  if (value === "yes") {
    return (
      <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#e9f9f0] text-[12px] text-[#059669]">
        ✓
      </span>
    );
  }
  if (value === "no") {
    return <span className="text-[16px] text-[#d1d5db]">—</span>;
  }
  return <span className="text-[15px] text-[#111827]">{value}</span>;
}

/* ---------------------------------------------------------------
   ART ASSETS

   Both flags stay false until the files actually exist in /public.
   Flip them and the art appears; leave them and the page renders
   exactly as it does now, with no broken-image icons in between.

   DECOR_ART   -> /public/decor/*.png   (512x512, transparent)
   MODEL_LOGOS -> /public/models/*.png  (128x128, transparent)
   --------------------------------------------------------------- */
const DECOR_ART = false;
const MODEL_LOGOS = true;

/** A cut-out 3D element floated in the page margin. */
function DecorArt({
  src,
  size,
  className,
  opacity = 0.9,
}: {
  src: string;
  size: number;
  className: string;
  opacity?: number;
}) {
  if (!DECOR_ART) return null;

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ width: size, opacity }}
    >
      <Image
        src={`/decor/${src}`}
        alt=""
        width={512}
        height={512}
        className="h-auto w-full"
      />
    </span>
  );
}

/* ---------------------------------------------------------------
   BACKGROUND DECOR

   Drawn, not imported — no image requests, no layout shift. All three
   are aria-hidden and pointer-events-none, and the gutter pieces only
   appear at 2xl (1536px+) where there is actually margin to fill. On
   anything narrower they disappear rather than crowd the content.
   --------------------------------------------------------------- */
function Orb({ className, color }: { className: string; color: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
    />
  );
}

function DotField({
  id,
  className,
  color = "#c7ccdf",
}: {
  id: string;
  className: string;
  color?: string;
}) {
  return (
    <span aria-hidden className={`pointer-events-none absolute ${className}`}>
      <svg width="100%" height="100%">
        <defs>
          <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="1.6" fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </span>
  );
}

/** A fragment of the product UI, floated in the margin. */
function FloatCard({
  Icon,
  label,
  value,
  tint,
  className,
}: {
  Icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  value: string;
  tint: string;
  className: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute w-[140px] rounded-[13px] border border-[#e9ebf3] bg-white/80 p-[13px] shadow-[0_8px_24px_rgba(17,19,24,0.06)] backdrop-blur-[2px] ${className}`}
    >
      <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-[8px] ${tint}`}>
        <Icon className="h-[14px] w-[14px]" />
      </span>
      <span className="mt-[9px] block text-[15px] font-semibold text-[#111827]">{value}</span>
      <span className="mt-[1px] block text-[11px] text-[#9ca3af]">{label}</span>
    </span>
  );
}

/** Stacked bars, like an audio waveform — reads as video without a photo. */
function Waveform({ className }: { className: string }) {
  const bars = [14, 26, 40, 22, 52, 34, 18, 44, 28, 12];
  return (
    <span aria-hidden className={`pointer-events-none absolute flex items-end gap-[5px] ${className}`}>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[5px] rounded-full"
          style={{
            height: `${h}px`,
            backgroundImage: "linear-gradient(180deg,#6856fd,#3d98fb)",
            opacity: 0.22,
          }}
        />
      ))}
    </span>
  );
}

// Figma node 5:457 — two columns, five rows, read left-to-right per row.
const faqRows: [string, string][] = [
  ["What is CRAFTX?", "What's included in the Creator plan?"],
  ["Who is CRAFTX for?", "What's included in Creator Pro?"],
  ["Do I need AI experience?", "Can I cancel anytime?"],
  ["What platforms does CRAFTX support?", "Does CRAFTX create content for me?"],
  ["Is there a free plan?", "How does CRAFTX use my creator profile?"],
];

const faqAnswers: Record<string, string> = {
  "What is CRAFTX?":
    "CRAFTX is a creator research and AI framework designed to help creators move from ideas to better content and sustainable growth.",
  "What's included in the Creator plan?":
    "Unlimited ideas, 50 scripts, 150 SEO sets, 30 content plans and 20 script analyses a month, plus priority processing.",
  "Who is CRAFTX for?":
    "Creators who want a more structured way to research, create, optimize, analyze and grow.",
  "What's included in Creator Pro?":
    "Unlimited ideas, scripts and analyses, plus 400 SEO sets and 100 content plans a month, advanced growth insights and premium support.",
  "Do I need AI experience?":
    "No. The tools are designed to guide creators through the workflow step by step.",
  "Can I cancel anytime?":
    "Yes. You can cancel at any time from Settings and keep access until the end of your current billing period.",
  "What platforms does CRAFTX support?":
    "CRAFTX is designed around major creator platforms including YouTube, TikTok, Instagram, Facebook, X (Twitter), LinkedIn and Shorts.",
  "Does CRAFTX create content for me?":
    "CRAFTX helps you research, structure, optimize, analyze and improve content — you stay in control of what gets published.",
  "Is there a free plan?":
    "Yes. The free plan includes all five tools with a one-time allocation of generations, so you can try the whole workflow before deciding to pay. It doesn't reset each month — paid plans do.",
  "How does CRAFTX use my creator profile?":
    "Your profile provides context about your niche, platforms, audience, goals and experience so recommendations can be more relevant.",
};

const footerColumns = [
  { title: "Product", links: [
    { label: "Features", href: "#tools" },
    { label: "Pricing", href: "#pricing" },
    { label: "How it works", href: "#workflow" },
    { label: "FAQ", href: "#faq" },
  ]},
  { title: "Legal", links: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refunds" },
  ]},
  { title: "Company", links: [
    { label: "Contact", href: "mailto:craftxofficialbd@gmail.com" },
    { label: "Log in", href: "/login" },
    { label: "Get started", href: "/signup" },
  ]},
];

const socials = [
  { name: "YouTube", Icon: YoutubeIcon, href: "https://youtube.com" },
  { name: "TikTok", Icon: TiktokIcon, href: "https://tiktok.com" },
  { name: "Instagram", Icon: InstagramIcon, href: "https://instagram.com" },
  { name: "X", Icon: XIcon, href: "https://x.com" },
  { name: "LinkedIn", Icon: LinkedinIcon, href: "https://linkedin.com" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#111827] antialiased">
      {/* ============ NAV ============ */}
      <header className="relative z-20">
        <nav className={`${shell} flex items-center justify-between py-[10px] sm:py-[12px]`}>
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/brand/craftx-logo.png"
              alt="CRAFTX"
              width={1780}
              height={356}
              priority
              className="h-[30px] w-auto sm:h-[46px] lg:h-[54px]"
            />
          </Link>

          <div className="hidden items-center gap-[40px] text-[17px] text-[#374151] md:flex">
            <a href="#tools" className="transition hover:text-[#111827]">Product</a>
            <a href="#workflow" className="transition hover:text-[#111827]">How it works</a>
            <a href="#pricing" className="transition hover:text-[#111827]">Pricing</a>
            <a href="#faq" className="transition hover:text-[#111827]">FAQ</a>
          </div>

          <div className="flex items-center gap-[10px] sm:gap-[16px]">
            <Link
              href="/login"
              className="hidden rounded-full border border-[#e5e7eb] bg-white px-[27px] py-[13px] text-[16px] text-[#111827] transition hover:border-[#c9c6f6] sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-full bg-[#0b1020] px-[14px] py-[10px] text-[13px] text-white transition hover:bg-[#1b2338] sm:px-[23px] sm:py-[13px] sm:text-[16px]"
            >
              Get started free →
            </Link>
          </div>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(120deg,#ffffff 0%,#f8f9fd 55%,#eef1fc 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[10%] top-[6%] h-[520px] w-[520px] rounded-full opacity-60 blur-[120px]"
          style={{ background: "radial-gradient(circle,#c9d8ff 0%,transparent 70%)" }}
        />

        {/* left gutter */}
        <DotField id="dots-hero" className="left-[14px] top-[120px] hidden h-[210px] w-[130px] opacity-50 2xl:block" />
        <Orb className="-left-[80px] top-[46%] h-[300px] w-[300px] opacity-70 blur-[90px]" color="#d9d3ff" />
        <FloatCard
          Icon={LightbulbIcon}
          value="24 ideas"
          label="ready to script"
          tint="bg-[#eef4ff] text-[#3b82f6]"
          className="bottom-[130px] left-[18px] hidden -rotate-[4deg] 2xl:block"
        />

        {/* right gutter */}
        <Waveform className="bottom-[90px] right-[26px] hidden 2xl:flex" />

        {/* cut-out art — appears once /public/decor is populated */}
        <DecorArt src="lightbulb.png" size={120} className="bottom-[250px] left-[22px] hidden -rotate-[6deg] 2xl:block" />
        <DecorArt src="plant.png" size={110} className="bottom-[40px] left-[26px] hidden 2xl:block" opacity={0.8} />
        <DecorArt src="play-button.png" size={96} className="right-[30px] top-[110px] hidden 2xl:block" />
        <DecorArt src="target.png" size={104} className="bottom-[190px] right-[22px] hidden 2xl:block" />
        <DecorArt src="sparkle.png" size={40} className="left-[150px] top-[80px] hidden 2xl:block" opacity={0.7} />

        <div
          className={`${shell} relative grid grid-cols-1 items-center gap-[36px] pb-[44px] pt-[24px] sm:gap-[60px] sm:pb-[64px] sm:pt-[34px] lg:grid-cols-[minmax(0,470px)_minmax(0,1fr)]`}
        >
          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-[9px] rounded-full border border-[#e3e5ef] bg-white/70 px-[14px] py-[6px] sm:gap-[11px] sm:px-[18px] sm:py-[7px]">
              <span className="h-[7px] w-[7px] rounded-[3px] bg-[#7c5cff]" />
              <span className="whitespace-nowrap text-[11px] tracking-[1px] text-[#6b7280] sm:text-[13.5px] sm:tracking-[1.21px]">
                THE CREATOR GROWTH WORKSPACE
              </span>
            </div>

            <h1 className="mt-[20px] text-[41px] font-extrabold leading-[46px] tracking-[-1.1px] text-[#111827] sm:mt-[28px] sm:text-[56px] sm:leading-[63px] sm:tracking-[-1.4px] lg:text-[68px] lg:leading-[77px] lg:tracking-[-1.71px]">
              Turn ideas
              <br />
              into{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#6856fd 0%,#3d98fb 100%)" }}
              >
                growth
              </span>
              <span className="text-[#6d5cf5]">.</span>
            </h1>

            <p className="mt-[14px] max-w-[459px] text-[16px] leading-[26px] text-[#4b5563] sm:mt-[18px] sm:text-[19px] sm:leading-[31px]">
              CRAFTX helps creators research ideas, build content, optimize every
              upload, and understand what actually drives growth — all in one
              workspace.
            </p>

            <div className="mt-[24px] flex flex-col items-stretch gap-[12px] sm:mt-[30px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-[18px]">
              <Link
                href="/signup"
                className="rounded-full bg-[#0b1020] px-[29px] py-[16px] text-center text-[16px] text-white transition hover:bg-[#1b2338] sm:py-[18px] sm:text-[17px]"
              >
                Start creating free →
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center justify-center gap-[9px] rounded-full border border-[#e5e7eb] bg-white px-[27px] py-[15px] text-[16px] text-[#111827] transition hover:border-[#c9c6f6] sm:py-[16px] sm:text-[17px]"
              >
                <span className="text-[12px]">▶</span> See how it works
              </a>
            </div>

            {/* Real numbers where four blank avatar circles used to sit.
                Three across on the phone — stacked, they cost a whole screen. */}
            <div className="mt-[26px] grid grid-cols-3 gap-x-[12px] border-t border-[#e2e5f0] pt-[20px] sm:mt-[34px] sm:flex sm:flex-wrap sm:gap-x-[40px] sm:gap-y-[18px] sm:pt-[24px]">
              {heroStats.map((s) => (
                <div key={s.label}>
                  <p className="text-[22px] font-bold leading-[28px] text-[#111827] sm:text-[26px] sm:leading-[32px]">
                    {s.value}
                  </p>
                  <p className="mt-[2px] text-[12px] leading-[16px] text-[#6b7280] sm:max-w-[150px] sm:text-[14px] sm:leading-[20px]">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — dashboard preview */}
          <div className="relative">
            <span className="mb-[14px] hidden pr-[20px] text-right text-[22px] leading-[29px] text-[#374151] font-[family-name:var(--font-caveat)] lg:block">
              Your complete
              <br />
              creator workspace
            </span>

            <div className="rounded-[20px] bg-[#0f1218] p-[7px] shadow-[0_40px_90px_rgba(17,19,24,0.22)] sm:p-[10px] lg:w-[calc(100%+90px)]">
              {/* window top bar */}
              <div className="flex items-center gap-[9px] px-[6px] py-[8px] sm:gap-[12px] sm:px-[10px] sm:py-[9px]">
                <span className="flex shrink-0 items-center gap-[6px] text-[12px] font-bold uppercase tracking-tight text-white sm:text-[13px]">
                  <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none">
                    <path d="M15 4 6 12l9 8" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 4 11 12l9 8" stroke="#4cc9f0" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  CRAFTX
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-[8px] rounded-[8px] bg-white/[0.06] px-[10px] py-[7px] text-[11px] text-white/35 sm:px-[12px] sm:text-[12px]">
                  <SearchIcon className="h-[13px] w-[13px] shrink-0" />
                  <span className="truncate">Search anything...</span>
                </span>
                <BellIcon className="h-[16px] w-[16px] shrink-0 text-white/40" />
                <span
                  className="h-[24px] w-[24px] shrink-0 rounded-full"
                  style={{ background: "linear-gradient(135deg,#6856fd,#3d98fb)" }}
                />
              </div>

              <div className="flex overflow-hidden rounded-[14px]">
                {/* app sidebar */}
                <div className="hidden w-[150px] shrink-0 flex-col justify-between bg-[#161a21] p-[10px] sm:flex">
                  <div className="space-y-[2px]">
                    {sidebarNav.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-[8px] rounded-[7px] px-[9px] py-[7px] text-[11px] ${
                          item.active ? "bg-white/10 text-white" : "text-white/40"
                        }`}
                      >
                        <item.Icon className="h-[13px] w-[13px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-[2px] border-t border-white/[0.06] pt-[8px]">
                    {[
                      { Icon: FolderIcon, label: "Projects" },
                      { Icon: SettingsIcon, label: "Settings" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-[8px] rounded-[7px] px-[9px] py-[7px] text-[11px] text-white/40"
                      >
                        <item.Icon className="h-[13px] w-[13px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* app content */}
                <div className="min-w-0 flex-1 bg-white p-[13px] sm:p-[18px]">
                  <h2 className="text-[15px] font-semibold text-[#111827] sm:text-[17px]">
                    Good morning, Creator 👋
                  </h2>
                  <p className="mt-[3px] text-[11px] text-[#9ca3af] sm:text-[11.5px]">
                    Here&apos;s your content overview for today.
                  </p>

                  {/* Four across on a 390px screen forced the whole mock wider
                      than the viewport — the fourth chip and the badges below
                      were being sliced by the right edge. */}
                  <div className="mt-[13px] grid grid-cols-2 gap-[8px] sm:mt-[16px] sm:grid-cols-4 sm:gap-[9px]">
                    {statChips.map((s) => (
                      <div key={s.label} className={`rounded-[11px] p-[10px] sm:p-[11px] ${s.tint}`}>
                        <s.Icon className="h-[15px] w-[15px]" />
                        <p className="mt-[6px] text-[16px] font-semibold text-[#111827] sm:mt-[7px] sm:text-[17px]">
                          {s.value}
                        </p>
                        <div className="mt-[1px] flex items-center justify-between gap-[4px]">
                          <span className="truncate text-[10.5px] text-[#6b7280]">{s.label}</span>
                          <span className="shrink-0 text-[10px] font-medium text-[#10b981]">{s.delta}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-[10px] rounded-[13px] border border-[#eceef2] bg-white p-[12px] sm:p-[14px]">
                    <p className="text-[11px] font-medium text-[#111827]">Recommended next step</p>
                    <div className="mt-[7px] flex items-end justify-between gap-[10px] sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#6b7280]">Turn your idea into a script</p>
                        <p className="mt-[3px] text-[10.5px] text-[#9ca3af]">
                          &quot;Why people stop watching after 3 seconds&quot;
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#0b1020] px-[11px] py-[6px] text-[10.5px] font-medium text-white sm:px-[13px]">
                        Continue →
                      </span>
                    </div>
                  </div>

                  <div className="mt-[10px] rounded-[13px] bg-[#f6f7fa] p-[12px] sm:p-[14px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-medium text-[#374151]">Recent projects</p>
                      <span className="shrink-0 text-[10.5px] text-[#9ca3af]">View all</span>
                    </div>
                    <div className="mt-[10px] space-y-[8px]">
                      {[
                        { t: "The truth about sleep and productivity", m: "Script · 2 hours ago", s: "In progress", c: "bg-[#e9f9f0] text-[#10b981]" },
                        { t: "How to stay consistent as a creator", m: "Idea · 5 hours ago", s: "Idea", c: "bg-[#eef4ff] text-[#3b82f6]" },
                      ].map((p) => (
                        <div key={p.t} className="flex items-center justify-between gap-[8px] sm:gap-3">
                          <div className="flex min-w-0 items-center gap-[9px]">
                            <span className="h-[26px] w-[26px] shrink-0 rounded-[7px] bg-[#e6e8ef]" />
                            <div className="min-w-0">
                              <p className="truncate text-[11.5px] text-[#374151]">{p.t}</p>
                              <p className="text-[10px] text-[#9ca3af]">{p.m}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-[9px] py-[3px] text-[10px] ${p.c}`}>
                            {p.s}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FRONTIER MODELS ============ */}
      {/* Sits directly under the hero: the first thing a visitor reads after
          the headline is why this costs less than the tools they already pay
          for. Light panel so brand logos read at full colour. */}
      <section className="relative overflow-hidden bg-white pb-[44px] pt-[40px] sm:pb-[64px] sm:pt-[56px]">
        <Orb className="-left-[70px] top-[80px] h-[280px] w-[280px] opacity-60 blur-[90px]" color="#dbe4ff" />
        <Orb className="-right-[70px] bottom-[60px] h-[280px] w-[280px] opacity-60 blur-[90px]" color="#e5dcff" />
        <DecorArt src="sparkle.png" size={54} className="left-[40px] top-[70px] hidden 2xl:block" opacity={0.7} />
        <DecorArt src="chat-bubbles.png" size={92} className="bottom-[80px] right-[34px] hidden 2xl:block" opacity={0.75} />

        <div className={`${shell} relative`}>
          <div className="text-center">
            <span className="inline-flex items-center gap-[8px] rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[13px] py-[6px] text-[11px] tracking-[1px] text-[#5b5bd6] sm:gap-[9px] sm:px-[16px] sm:py-[7px] sm:text-[12.5px] sm:tracking-[1.2px]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#6856fd]" />
              PREMIUM AI MODELS. ONE PRICE.
            </span>

            <h2 className="mx-auto mt-[16px] max-w-[820px] text-[27px] font-bold leading-[35px] tracking-[-0.5px] text-[#111827] sm:mt-[20px] sm:text-[36px] sm:leading-[46px] sm:tracking-[-0.72px] lg:text-[40px] lg:leading-[52px]">
              The world&apos;s best AI models, from{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
              >
                $9.99
              </span>
              <span className="text-[#6b7280]">/month</span>
            </h2>

            <p className="mx-auto mt-[12px] max-w-[620px] text-[15px] leading-[24px] text-[#6b7280] sm:mt-[14px] sm:text-[16.5px] sm:leading-[27px]">
              Each studio runs the model best suited to the job. You never pick one,
              manage an API key, or pay a provider directly.
            </p>
          </div>

          {/* --- the models ---
              Two across on the phone with the logo stacked above the name.
              Eight full-width rows was a screen and a half on its own. */}
          <div className="mt-[26px] rounded-[22px] border border-[#e9ebf3] bg-[#fbfbfe] p-[12px] sm:mt-[38px] sm:p-[22px]">
            <div className="grid grid-cols-2 gap-[10px] sm:gap-[14px] lg:grid-cols-4">
              {models.map((m) => (
                <div
                  key={m.name}
                  className="flex flex-col items-start gap-[8px] rounded-[15px] border border-[#eceef4] bg-white p-[12px] sm:flex-row sm:items-center sm:gap-[14px] sm:p-[16px]"
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f4f5f9] sm:h-[44px] sm:w-[44px] sm:rounded-[12px]">
                    {MODEL_LOGOS && m.logo ? (
                      <Image
                        src={`/models/${m.logo}`}
                        alt={m.provider}
                        width={128}
                        height={128}
                        className="h-[20px] w-[20px] object-contain sm:h-[26px] sm:w-[26px]"
                      />
                    ) : (
                      <span className="text-[12px] font-semibold text-[#4b5563] sm:text-[13px]">
                        {m.provider.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-[6px] sm:items-center sm:gap-[8px]">
                      <span className="text-[13px] font-medium leading-[18px] text-[#111827] sm:truncate sm:text-[15px] sm:leading-normal">
                        {m.name}
                      </span>
                      <span className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#10b981] sm:mt-0" title="Available" />
                    </span>
                    <span className="mt-[2px] block truncate text-[11.5px] text-[#9ca3af] sm:text-[12.5px]">
                      {m.provider}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* --- why it matters --- */}
          <div className="mt-[24px] grid grid-cols-1 gap-[16px] sm:mt-[26px] sm:grid-cols-2 sm:gap-[18px] lg:grid-cols-4">
            {modelBenefits.map((b) => (
              <div key={b.title} className="flex items-start gap-[13px]">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[#f3eeff] text-[#6856fd] sm:h-[38px] sm:w-[38px]">
                  <b.Icon className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]" />
                </span>
                <span>
                  <span className="block text-[14.5px] font-medium text-[#111827]">{b.title}</span>
                  <span className="mt-[2px] block text-[13px] leading-[19px] text-[#9ca3af]">
                    {b.body}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* --- the cost argument --- */}
          <div className="mt-[30px] grid grid-cols-1 gap-[12px] sm:mt-[38px] sm:gap-[16px] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
            <div className="rounded-[18px] border border-[#e9ebf3] bg-[#fafbfd] px-[20px] py-[20px] sm:px-[26px] sm:py-[24px]">
              <p className="text-[13.5px] text-[#9ca3af]">Subscribing to each one yourself</p>
              <p className="mt-[8px] text-[30px] font-bold leading-[36px] text-[#9ca3af] sm:text-[34px] sm:leading-[40px]">
                ≈${soloTotal}
                <span className="ml-[4px] text-[15px] font-normal">/month</span>
              </p>
              <p className="mt-[8px] text-[13.5px] leading-[20px] text-[#b0b5c4]">
                {models.length} separate plans, {models.length} logins, and none of them
                know your niche or your saved work.
              </p>
            </div>

            {/* Points down while the cards are stacked, right once they sit side by side. */}
            <div className="flex justify-center py-[2px] lg:px-[10px] lg:py-[4px]">
              <span className="inline-block rotate-90 text-[20px] text-[#c3c7d0] lg:rotate-0">→</span>
            </div>

            <div
              className="rounded-[18px] px-[20px] py-[20px] sm:px-[26px] sm:py-[24px]"
              style={{ backgroundImage: "linear-gradient(135deg,#6856fd,#3d98fb)" }}
            >
              <p className="text-[13.5px] text-white/80">Inside CRAFTX Creator</p>
              <p className="mt-[8px] text-[30px] font-bold leading-[36px] text-white sm:text-[34px] sm:leading-[40px]">
                $9.99
                <span className="ml-[4px] text-[15px] font-normal text-white/80">/month</span>
              </p>
              <p className="mt-[8px] text-[13.5px] leading-[20px] text-white/85">
                One plan, five studios, and every generation shaped by your creator
                profile.
              </p>
            </div>
          </div>

          <div className="mt-[22px] flex flex-col items-stretch gap-[16px] sm:mt-[24px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-[18px]">
            <p className="max-w-[560px] text-[13px] leading-[20px] text-[#9ca3af]">
              {liveCount} model{liveCount === 1 ? "" : "s"} power{liveCount === 1 ? "s" : ""}{" "}
              CRAFTX today. The rest are rolling out to paid plans as each provider is
              enabled — your plan price doesn&apos;t change when they land.
            </p>

            <Link
              href="/signup"
              className="rounded-full bg-[#0b1020] px-[26px] py-[14px] text-center text-[15px] text-white transition hover:bg-[#1b2338] sm:text-[16px]"
            >
              Start creating free →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ PLATFORMS ============ */}
      {/* Was near-invisible grey text with icons at 40% opacity. Now legible
          bordered chips that fill the row instead of floating in it. */}
      <section className="border-y border-[#e9ebf1] bg-[#f4f5f8] py-[30px] sm:py-[38px]">
        <div className={shell}>
          <p className="text-center text-[15px] text-[#4b5563] sm:text-[17px]">
            Create better content for every platform
          </p>

          <div className="mt-[20px] grid grid-cols-2 gap-[10px] sm:mt-[26px] sm:grid-cols-4 sm:gap-[12px] lg:grid-cols-8">
            {platforms.map((p) => (
              <span
                key={p.name}
                className="flex items-center justify-center gap-[8px] rounded-[12px] border border-[#e4e6ee] bg-white px-[10px] py-[12px] text-[14px] text-[#374151] sm:gap-[9px] sm:px-[12px] sm:py-[14px] sm:text-[15px]"
              >
                <p.Icon className="h-[18px] w-[18px] shrink-0 text-[#6b7280] sm:h-[19px] sm:w-[19px]" />
                <span className="truncate">{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FRAGMENTED ============ */}
      {/* The chips used to sit alone in a wide empty field. A "how it works
          today" card now gives the left column real weight. */}
      <section
        className="relative overflow-hidden py-[48px] sm:py-[72px]"
        style={{
          backgroundImage: "linear-gradient(120deg,#f6f7fa 0%,#f3f5fb 60%,#e9edfa 100%)",
        }}
      >
        <Orb className="-left-[90px] top-[100px] h-[320px] w-[320px] opacity-70 blur-[90px]" color="#dcd6ff" />
        <Orb className="-right-[90px] bottom-[80px] h-[320px] w-[320px] opacity-70 blur-[90px]" color="#cfe1ff" />
        <DotField id="dots-frag" className="bottom-[70px] left-[16px] hidden h-[180px] w-[120px] opacity-50 2xl:block" />
        <FloatCard
          Icon={ChartIcon}
          value="+312%"
          label="watch time"
          tint="bg-[#e9f9f0] text-[#10b981]"
          className="right-[18px] top-[120px] hidden rotate-[5deg] 2xl:block"
        />
        <DecorArt src="robot.png" size={130} className="left-[18px] top-[110px] hidden 2xl:block" />
        <DecorArt src="target.png" size={92} className="bottom-[110px] right-[34px] hidden 2xl:block" opacity={0.8} />

        <div className={`${shell} relative grid grid-cols-1 gap-[34px] sm:gap-[48px] lg:grid-cols-2 lg:items-start`}>
          <div>
            <h2 className="text-[30px] font-extrabold leading-[37px] tracking-[-0.6px] text-[#111827] sm:text-[43px] sm:leading-[52px] sm:tracking-[-0.86px]">
              Creating shouldn&apos;t
              <br />
              feel fragmented.
            </h2>
            <p className="mt-[16px] max-w-[460px] text-[15.5px] leading-[26px] text-[#4b5563] sm:mt-[22px] sm:text-[17px] sm:leading-[29px]">
              Great content doesn&apos;t usually fail because creators can&apos;t
              make it. It fails because they&apos;re creating without a clear
              direction.
            </p>

            <div className="mt-[24px] max-w-[460px] rounded-[18px] border border-[#e4e7f1] bg-white p-[20px] sm:mt-[32px] sm:p-[26px]">
              <p className="text-[12.5px] tracking-[1.1px] text-[#9ca3af]">HOW IT WORKS TODAY</p>
              <ul className="mt-[14px] space-y-[12px] sm:mt-[16px] sm:space-y-[13px]">
                {scatteredTools.map((t) => (
                  <li key={t} className="flex items-center gap-[12px] text-[14.5px] text-[#6b7280] sm:text-[15.5px]">
                    <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#d6d9e3]" />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-[20px] flex items-center gap-[13px] border-t border-[#eceef4] pt-[18px] sm:mt-[22px] sm:gap-[14px] sm:pt-[20px]">
                <span
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] text-white"
                  style={{ backgroundImage: "linear-gradient(135deg,#6856fd,#3d98fb)" }}
                >
                  <TrendingUpIcon className="h-[19px] w-[19px]" />
                </span>
                <p className="text-[14.5px] leading-[21px] text-[#111827] sm:text-[15.5px] sm:leading-[22px]">
                  With CRAFTX, all of it lives in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-[40px] lg:pt-[10px]">
            <span className="mb-[14px] block text-left text-[20px] leading-[26px] text-[#374151] font-[family-name:var(--font-caveat)] sm:mb-[18px] sm:text-right sm:text-[22px] sm:leading-[29px]">
              One workspace.
              <br />
              All the answers.
            </span>

            <div className="flex flex-col items-start gap-[11px] sm:gap-[14px]">
              {painPoints.map((p) => (
                <span
                  key={p.text}
                  style={{ "--chip-indent": `${p.indent}px` } as React.CSSProperties}
                  className="ml-0 rounded-full border border-[#ececf3] bg-white px-[18px] py-[10px] text-[14.5px] text-[#374151] shadow-[0_2px_3px_rgba(0,0,0,0.03)] sm:ml-[var(--chip-indent)] sm:px-[23px] sm:py-[11px] sm:text-[16px]"
                >
                  {p.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ WORKFLOW ============ */}
      {/* Five steps on a tinted panel with a connector line behind the icons,
          so the row reads as one sequence rather than five items adrift.
          Two across on the phone — five stacked was ~2.5 screens. */}
      <section id="workflow" className="relative overflow-hidden bg-white py-[48px] sm:py-[72px]">
        <DotField id="dots-flow-l" className="left-[16px] top-[150px] hidden h-[230px] w-[130px] opacity-45 2xl:block" />
        <DotField id="dots-flow-r" className="bottom-[110px] right-[16px] hidden h-[230px] w-[130px] opacity-45 2xl:block" />
        <Orb className="-right-[60px] top-[60px] h-[260px] w-[260px] opacity-60 blur-[90px]" color="#e3ecff" />
        <DecorArt src="rocket.png" size={132} className="left-[16px] top-[80px] hidden -rotate-[8deg] 2xl:block" />
        <DecorArt src="bar-chart.png" size={124} className="bottom-[80px] right-[18px] hidden 2xl:block" />

        <div className={`${shell} relative`}>
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[14px] py-[6px] text-[11px] tracking-[1.1px] text-[#5b5bd6] sm:px-[16px] sm:py-[7px] sm:text-[12.6px] sm:tracking-[1.26px]">
              THE CRAFTX WORKFLOW
            </span>
            <h2 className="mt-[14px] text-[28px] font-bold tracking-[-0.56px] text-[#111827] sm:mt-[18px] sm:text-[38px] sm:tracking-[-0.76px]">
              From idea to growth.
            </h2>
            <p className="mt-[10px] text-[14.5px] text-[#6b7280] sm:text-[15px]">
              A simple, powerful workflow to help you create content that gets results.
            </p>
          </div>

          <div className="relative mt-[30px] rounded-[22px] border border-[#eceef4] bg-[#fafbfd] px-[14px] py-[28px] sm:mt-[44px] sm:px-[24px] sm:py-[42px]">
            <div
              aria-hidden
              className="absolute left-[12%] right-[12%] top-[77px] hidden h-px bg-[#e2e5ee] lg:block"
            />

            <div className="relative grid grid-cols-2 gap-y-[26px] sm:grid-cols-3 sm:gap-y-[34px] lg:grid-cols-5 lg:gap-x-[8px]">
              {workflow.map((w, i) => (
                <div key={w.title} className="flex flex-col items-center px-[6px] text-center sm:px-[10px]">
                  <span className="relative flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[#e6e9f2] bg-white text-[#4b5563] shadow-[0_2px_6px_rgba(17,19,24,0.04)] sm:h-[70px] sm:w-[70px]">
                    <w.Icon className="h-[24px] w-[24px] sm:h-[30px] sm:w-[30px]" />
                    <span className="absolute -right-[2px] -top-[2px] flex h-[21px] w-[21px] items-center justify-center rounded-full bg-[#0b1020] text-[11px] font-semibold text-white sm:h-[24px] sm:w-[24px] sm:text-[12px]">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-[12px] text-[17px] text-[#111827] sm:mt-[16px] sm:text-[19px]">{w.title}</h3>
                  <p className="mt-[5px] max-w-[210px] text-[13px] leading-[19px] text-[#6b7280] sm:mt-[6px] sm:text-[14px] sm:leading-[22px]">
                    {w.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TOOLS ============ */}
      <section id="tools" className="relative overflow-hidden bg-white pb-[48px] sm:pb-[72px]">
        <Orb className="-left-[80px] top-[120px] h-[300px] w-[300px] opacity-60 blur-[95px]" color="#e7dfff" />
        <Orb className="-right-[80px] bottom-[140px] h-[300px] w-[300px] opacity-60 blur-[95px]" color="#dbeaff" />
        <FloatCard
          Icon={PlayCircleIcon}
          value="Score 92"
          label="latest analysis"
          tint="bg-[#fdeef6] text-[#ec4899]"
          className="left-[18px] top-[240px] hidden -rotate-[5deg] 2xl:block"
        />
        <FloatCard
          Icon={CalendarIcon}
          value="30 days"
          label="planned ahead"
          tint="bg-[#fff2e8] text-[#f97316]"
          className="bottom-[180px] right-[18px] hidden rotate-[4deg] 2xl:block"
        />
        <DecorArt src="clapboard.png" size={118} className="bottom-[70px] left-[20px] hidden -rotate-[6deg] 2xl:block" />
        <DecorArt src="phone-chart.png" size={112} className="right-[24px] top-[120px] hidden 2xl:block" />

        <div className={`${shell} relative`}>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[14px] py-[6px] text-[11px] tracking-[1.1px] text-[#5b5bd6] sm:px-[16px] sm:text-[12px] sm:tracking-[1.26px]">
            POWERFUL TOOLS
          </span>

          {/* This row was `flex-wrap` with a `min-w-0 flex-1` heading beside a
              `shrink-0` button. flex-1 + min-w-0 lets the text column collapse
              instead of wrapping, so on a phone the copy was squeezed into a
              3-word-wide ribbon with the button pinned to its right. Stack it. */}
          <div className="mt-[18px] flex flex-col items-start gap-[20px] sm:mt-[22px] lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-[24px]">
            <div className="w-full min-w-0 lg:flex-1">
              <h2 className="text-[27px] font-bold leading-[35px] tracking-[-0.54px] text-[#111827] sm:text-[35px] sm:leading-[44px] sm:tracking-[-0.7px]">
                Everything your content needs. One workspace.
              </h2>
              <p className="mt-[10px] max-w-[560px] text-[15px] leading-[24px] text-[#6b7280]">
                Five tools that share one context — your niche, your audience and the
                work you&apos;ve already saved.
              </p>
            </div>
            <Link
              href="/signup"
              className="w-full shrink-0 rounded-full bg-[#0b1020] px-[25px] py-[15px] text-center text-[16px] text-white transition hover:bg-[#1b2338] sm:w-auto sm:py-[16px] sm:text-[17px] lg:mb-[6px]"
            >
              Try them free →
            </Link>
          </div>

          <div className="mt-[28px] grid grid-cols-1 gap-[16px] sm:mt-[40px] sm:grid-cols-2 sm:gap-[20px] lg:grid-cols-3">
            {tools.map((tool) => (
              <div
                key={tool.title}
                className={`flex flex-col rounded-[18px] border p-[20px] sm:p-[26px] ${
                  tool.accent ? "border-transparent text-white" : "border-[#ececf1] bg-[#fafafc]"
                }`}
                style={
                  tool.accent
                    ? { backgroundImage: "linear-gradient(140deg,#0b1020 0%,#241f5c 55%,#4a3a86 100%)" }
                    : undefined
                }
              >
                <span className={`flex h-[42px] w-[42px] items-center justify-center rounded-[13px] sm:h-[46px] sm:w-[46px] ${tool.tint}`}>
                  <tool.Icon className="h-[22px] w-[22px] sm:h-[24px] sm:w-[24px]" />
                </span>

                <h3 className={`mt-[16px] text-[18px] sm:mt-[20px] sm:text-[19px] ${tool.accent ? "text-white" : "text-[#111827]"}`}>
                  {tool.title}
                </h3>
                <p
                  className={`mt-[6px] text-[14.5px] leading-[22px] ${
                    tool.accent ? "text-[#c8ccdb]" : "text-[#6b7280]"
                  }`}
                >
                  {tool.description}
                </p>

                <ul
                  className={`mt-[16px] flex-1 space-y-[10px] border-t pt-[16px] sm:mt-[18px] sm:space-y-[11px] sm:pt-[18px] ${
                    tool.accent ? "border-white/15" : "border-[#e9eaf0]"
                  }`}
                >
                  {tool.points.map((p) => (
                    <li
                      key={p}
                      className={`flex items-start gap-[10px] text-[14px] leading-[21px] ${
                        tool.accent ? "text-[#d8dbe8]" : "text-[#4b5563]"
                      }`}
                    >
                      <span
                        className={`mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full ${
                          tool.accent ? "bg-[#8fa6ff]" : "bg-[#c9c6f6]"
                        }`}
                      />
                      {p}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tool.href}
                  className={`mt-[18px] rounded-[12px] py-[12px] text-center text-[14.5px] transition sm:mt-[22px] ${
                    tool.accent
                      ? "bg-white text-[#111827] hover:bg-white/90"
                      : "border border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#f5f6f9]"
                  }`}
                >
                  Open {tool.title} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AI PANEL ============ */}
      <section className="bg-white pb-[48px] sm:pb-[72px]">
        <div className={shell}>
          <div
            className="relative flex flex-col gap-[28px] overflow-hidden rounded-[22px] p-[24px] sm:gap-[36px] sm:p-[47px] lg:flex-row lg:items-center"
            style={{
              backgroundImage:
                "linear-gradient(105deg,#0b1020 0%,#12172b 55%,#3a2f7a 78%,#8ec8f0 100%)",
            }}
          >
            <DotField
              id="dots-aipanel"
              color="#ffffff"
              className="left-[24px] top-[20px] h-[140px] w-[200px] opacity-[0.07]"
            />

            <div className="relative flex-1">
              <h2 className="text-[27px] font-semibold leading-[35px] tracking-[-0.54px] text-white sm:text-[36px] sm:leading-[45px] sm:tracking-[-0.72px]">
                AI that understands
                <br />
                your content.
              </h2>
              <p className="mt-[16px] max-w-[430px] text-[15px] leading-[25px] text-[#c8ccdb] sm:mt-[22px] sm:text-[16px] sm:leading-[28px]">
                Tell CRAFTX what you create, who you&apos;re trying to reach and
                where you want to go. Every recommendation becomes more relevant
                to you.
              </p>
              <Link
                href="/creator-profile"
                className="mt-[20px] inline-flex w-full justify-center rounded-full bg-white px-[25px] py-[14px] text-center text-[15px] text-[#111827] transition hover:bg-white/90 sm:mt-[26px] sm:w-auto sm:text-[16px]"
              >
                Set up your creator profile →
              </Link>
            </div>

            <div className="relative shrink-0 lg:w-[420px]">
              <span className="mb-[12px] hidden text-right text-[21px] leading-[27px] text-white/75 font-[family-name:var(--font-caveat)] lg:block">
                Personalised.
                <br />
                Built for you.
              </span>

              <div className="rounded-[16px] bg-white p-[18px] sm:p-[22px]">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-[#6b7280]">Your Creator Profile</p>
                  <span className="rounded-[6px] bg-[#eef4ff] px-[10px] py-[3px] text-[11px] text-[#3b82f6]">
                    Edit
                  </span>
                </div>

                <div className="mt-[16px] grid grid-cols-2 gap-x-[14px] gap-y-[14px] sm:mt-[18px] sm:gap-x-[18px] sm:gap-y-[16px]">
                  {[
                    ["Niche", "Technology"],
                    ["Platforms", "YouTube, TikTok"],
                    ["Audience", "18–34, Beginners"],
                    ["Goals", "Monetization, How-to"],
                    ["Content Type", "Educational, How-to"],
                    ["Experience", "Intermediate"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[11.5px] text-[#9ca3af]">{k}</p>
                      <p className="mt-[3px] text-[13px] text-[#111827]">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <PricingSection />

      {/* ============ PLAN COMPARISON ============ */}
      {/* The cards say "limited" and "more" — this says how many. */}
      <section className="relative overflow-hidden bg-white pb-[48px] sm:pb-[72px]">
        <Orb className="-right-[70px] top-[80px] h-[280px] w-[280px] opacity-55 blur-[90px]" color="#e2dcff" />
        <DotField id="dots-compare" className="left-[16px] top-[200px] hidden h-[200px] w-[120px] opacity-45 2xl:block" />
        <DecorArt src="pie-chart.png" size={126} className="bottom-[120px] left-[14px] hidden 2xl:block" />
        <DecorArt src="cube.png" size={86} className="right-[26px] top-[220px] hidden 2xl:block" opacity={0.85} />

        <div className={`${shell} relative`}>
          <div className="max-w-[640px]">
            <h2 className="text-[26px] font-bold leading-[34px] tracking-[-0.52px] text-[#111827] sm:text-[32px] sm:leading-[42px] sm:tracking-[-0.64px]">
              What you get on each plan.
            </h2>
            <p className="mt-[10px] text-[15px] leading-[25px] text-[#6b7280]">
              Every tool is on every plan, including the free one. What changes is how
              much you can generate. Free gives you a one-time allocation to try the
              whole workflow; paid plans refresh on the 1st of each month.
            </p>
          </div>

          {/* The table is 720px wide and always was. It scrolls — but with no
              cue it just looked like the right-hand columns had been chopped
              off, which reads as a bug rather than an affordance. */}
          <p className="mt-[24px] flex items-center gap-[8px] text-[13px] text-[#9ca3af] lg:hidden">
            Swipe the table sideways to compare plans
            <span aria-hidden>→</span>
          </p>

          <div className="mt-[12px] overflow-x-auto rounded-[18px] border border-[#e9ebf1] sm:mt-[16px] lg:mt-[32px]">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-[#fafbfd]">
                  <th className="w-[38%] px-[24px] py-[20px] text-[15px] font-semibold text-[#111827]">
                    Plan
                  </th>
                  <th className="px-[20px] py-[20px] text-center">
                    <span className="block text-[16px] font-semibold text-[#111827]">Free</span>
                    <span className="mt-[2px] block text-[13px] font-normal text-[#9ca3af]">$0</span>
                    <span className="mt-[1px] block text-[11.5px] font-normal text-[#b0b5c4]">
                      one-time
                    </span>
                  </th>
                  <th className="border-x border-[#e9ebf1] bg-white px-[20px] py-[20px] text-center">
                    <span className="block text-[16px] font-semibold text-[#5b5bd6]">Creator</span>
                    <span className="mt-[2px] block text-[13px] font-normal text-[#9ca3af]">$9.99/mo</span>
                  </th>
                  <th className="px-[20px] py-[20px] text-center">
                    <span className="block text-[16px] font-semibold text-[#111827]">Creator Pro</span>
                    <span className="mt-[2px] block text-[13px] font-normal text-[#9ca3af]">$19.99/mo</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {comparisonGroups.map((g) => (
                  <Fragment key={g.group}>
                    <tr>
                      <td
                        colSpan={4}
                        className="border-t border-[#e9ebf1] bg-[#f7f8fb] px-[24px] py-[11px] text-[12.5px] tracking-[1.1px] text-[#6b7280]"
                      >
                        {g.group}
                      </td>
                    </tr>

                    {g.rows.map((row) => (
                      <tr key={g.group + row.label} className="border-t border-[#f0f1f6]">
                        <td className="px-[24px] py-[15px] text-[15px] text-[#374151]">{row.label}</td>
                        <td className="px-[20px] py-[15px] text-center">
                          <Cell value={row.free} />
                        </td>
                        <td className="border-x border-[#e9ebf1] bg-[#fbfbfe] px-[20px] py-[15px] text-center">
                          <Cell value={row.creator} />
                        </td>
                        <td className="px-[20px] py-[15px] text-center">
                          <Cell value={row.pro} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}

                <tr className="border-t border-[#e9ebf1] bg-[#fafbfd]">
                  <td className="px-[24px] py-[22px]" />
                  <td className="px-[20px] py-[22px] text-center">
                    <Link
                      href="/signup"
                      className="inline-flex whitespace-nowrap rounded-full border border-[#e5e7eb] bg-white px-[22px] py-[11px] text-[14.5px] text-[#111827] transition hover:bg-[#f5f6f9]"
                    >
                      Get started free
                    </Link>
                  </td>
                  <td className="border-x border-[#e9ebf1] bg-white px-[20px] py-[22px] text-center">
                    <Link
                      href="/signup"
                      className="inline-flex whitespace-nowrap rounded-full bg-[#0b1020] px-[22px] py-[11px] text-[14.5px] text-white transition hover:bg-[#1b2338]"
                    >
                      Start creating →
                    </Link>
                  </td>
                  <td className="px-[20px] py-[22px] text-center">
                    <Link
                      href="/signup"
                      className="inline-flex whitespace-nowrap rounded-full border border-[#e5e7eb] bg-white px-[22px] py-[11px] text-[14.5px] text-[#111827] transition hover:bg-[#f5f6f9]"
                    >
                      Go Pro →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-[14px] text-[13px] text-[#9ca3af] sm:text-[13.5px]">
            Ideas are counted individually — asking for 5 ideas uses 5 of your total.
          </p>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="relative overflow-hidden bg-white pb-[48px] sm:pb-[72px]">
        <Orb className="-left-[70px] top-[60px] h-[270px] w-[270px] opacity-55 blur-[90px]" color="#dceaff" />
        <Waveform className="bottom-[120px] right-[26px] hidden 2xl:flex" />
        <DecorArt src="books.png" size={112} className="bottom-[90px] left-[20px] hidden 2xl:block" opacity={0.9} />

        <div className={`${shell} relative`}>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-[14px] py-[6px] text-[11px] tracking-[1.1px] text-[#5b5bd6] sm:px-[16px] sm:text-[12px] sm:tracking-[1.26px]">
            FAQ
          </span>

          <div className="mt-[18px] sm:mt-[22px]">
            <h2 className="text-[28px] font-bold tracking-[-0.56px] text-[#111827] sm:text-[38px] sm:tracking-[-0.76px]">
              Got questions?
            </h2>
            <p className="mt-[10px] text-[14.5px] text-[#6b7280] sm:text-[15px]">Here are some quick answers.</p>
          </div>

          <div className="mt-[24px] grid grid-cols-1 gap-x-[56px] sm:mt-[30px] sm:grid-cols-2">
            {faqRows.flatMap(([a, b]) =>
              [a, b].map((q) => (
                <details key={q} className="group border-b border-[#eceef2] py-[14px] sm:py-[16px]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-[16px] text-[15px] text-[#374151] [&::-webkit-details-marker]:hidden sm:text-[16px]">
                    {q}
                    <PlusIcon className="h-[18px] w-[18px] shrink-0 text-[#9ca3af] transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="mt-[10px] pr-[10px] text-[14px] leading-[23px] text-[#6b7280] sm:pr-[34px] sm:text-[14.5px] sm:leading-[24px]">
                    {faqAnswers[q]}
                  </p>
                </details>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-white pb-[48px] sm:pb-[72px]">
        <div className={shell}>
          <div
            className="relative flex flex-col items-stretch justify-between gap-[26px] overflow-hidden rounded-[22px] p-[24px] sm:flex-row sm:items-center sm:gap-[32px] sm:p-[47px]"
            style={{
              backgroundImage:
                "linear-gradient(100deg,#0b1020 0%,#151a2e 50%,#4a3a86 76%,#9ad0f0 100%)",
            }}
          >
            <DotField
              id="dots-cta"
              color="#ffffff"
              className="left-[24px] top-[20px] h-[130px] w-[190px] opacity-[0.08]"
            />
            <DecorArt src="megaphone.png" size={124} className="-bottom-[18px] right-[300px] hidden xl:block" opacity={0.9} />

            <div className="relative">
              <h2 className="text-[25px] font-bold leading-[33px] tracking-[-0.5px] sm:text-[31px] sm:leading-[40px] sm:tracking-[-0.61px]">
                <span className="text-[#8fa6ff]">Your next great piece of content</span>
                <br />
                <span className="text-white">starts with an idea.</span>
              </h2>
              <p className="mt-[12px] text-[15px] leading-[24px] text-[#c8ccdb] sm:mt-[14px] sm:text-[16px]">
                CRAFTX helps you turn that idea into something worth publishing.
              </p>
            </div>

            <div className="relative flex w-full shrink-0 flex-col items-center gap-[11px] sm:w-auto sm:gap-[13px]">
              <Link
                href="/signup"
                className="w-full rounded-full bg-white px-[29px] py-[15px] text-center text-[16px] text-[#111827] transition hover:bg-white/90 sm:w-auto sm:py-[16px] sm:text-[17px]"
              >
                Start creating free →
              </Link>
              <span className="text-[13px] text-[#c8ccdb] sm:text-[13.5px]">No credit card required.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      {/* Extra bottom padding on mobile so the sticky bar below never covers
          the copyright line. */}
      <footer className="border-t border-[#eceef2] bg-white pb-[96px] pt-[40px] sm:pt-[52px] md:pb-[40px]">
        <div className={shell}>
          <div className="grid grid-cols-2 gap-[28px] sm:gap-[40px] lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
            <div className="col-span-2 lg:col-span-1">
              <Image
                src="/brand/craftx-logo.png"
                alt="CRAFTX"
                width={1780}
                height={356}
                className="h-[28px] w-auto sm:h-[30px]"
              />
              <p className="mt-[14px] max-w-[300px] text-[13.5px] text-[#6b7280] sm:mt-[16px] sm:text-[14px]">
                Creator Research &amp; AI Framework for Growth
              </p>
              <div className="mt-[18px] flex items-center gap-[16px] sm:mt-[22px]">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    aria-label={s.name}
                    className="text-[#9ca3af] transition hover:text-[#111827]"
                  >
                    <s.Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            </div>

            {footerColumns.map((col) => (
              <div key={col.title}>
                <p className="text-[15px] font-semibold text-[#111827] sm:text-[16px]">{col.title}</p>
                <ul className="mt-[12px] space-y-[10px] sm:mt-[16px] sm:space-y-[12px]">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-[14px] text-[#6b7280] transition hover:text-[#111827] sm:text-[15px]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-[36px] flex flex-col gap-[8px] border-t border-[#eceef2] pt-[20px] text-[13px] text-[#9ca3af] sm:mt-[52px] sm:gap-[10px] sm:pt-[22px] sm:text-[14px] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 CRAFTX. All rights reserved.</span>
            <span>Create smarter. Grow further.</span>
          </div>
        </div>
      </footer>

      {/* ============ STICKY MOBILE CTA ============ */}
      {/* On a page this long the primary button appears near the top and then
          disappears for thousands of pixels. This keeps it in thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e9ebf1] bg-white/95 px-5 py-[12px] backdrop-blur-[6px] md:hidden">
        <Link
          href="/signup"
          className="flex w-full items-center justify-center rounded-full bg-[#0b1020] px-[24px] py-[14px] text-[16px] text-white transition hover:bg-[#1b2338]"
        >
          Start creating free →
        </Link>
      </div>
    </main>
  );
}