"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";
import UsageMeter from "@/components/dashboard/usage-meter";
import { UserIcon, PlayCircleIcon, LightbulbIcon } from "@/components/marketing/landing-icons";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CoachContext {
  creatorName: string;
  niche: string;
  primaryPlatform: string;
  goals: string;
  hasProfile: boolean;
  counts: { ideas: number; scripts: number; seo: number; plans: number; analyses: number };
  latestAnalysis: {
    id: string;
    title: string;
    score: number;
    weaknesses: string[];
    recommendations: string[];
    createdAt: string;
  } | null;
  recentAnalyses: { id: string; title: string; score: number; createdAt: string }[];
}

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

const STARTERS = [
  "What should I post next?",
  "Review my recent scripts.",
  "How do I improve my hooks?",
  "What's holding my growth back?",
];

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface Props {
  initialMessages: ChatMessage[];
  context: CoachContext;
  plan: string;
}

export default function CreatorCoach({ initialMessages, context, plan }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [doneItems, setDoneItems] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  /** Bumped after any message attempt that touched the quota. */
  const [usageRefresh, setUsageRefresh] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError("");
    setUpgradeInfo(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
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
          setUsageRefresh((n) => n + 1);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setUsageRefresh((n) => n + 1);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const latest = context.latestAnalysis;
  const totalSaved =
    context.counts.ideas + context.counts.scripts + context.counts.seo + context.counts.plans;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
            CREATOR COACH
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
            Your growth,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#6856fd,#3d98fb)" }}
            >
              powered by AI.
            </span>
          </h2>
          <p className="mt-2 text-[#6b7280]">
            Personalized guidance based on your profile and the work you&apos;ve saved.
          </p>
        </div>

        <p className="hidden max-w-[220px] text-right text-[19px] leading-[26px] text-[#6b7280] font-[family-name:var(--font-caveat)] lg:block">
          Data + strategy = consistent growth.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============ chat ============ */}
        {/*
          self-start stops this card stretching to the height of the taller
          right rail; the fixed height keeps the composer on screen and lets
          the transcript scroll inside itself instead.
        */}
        <div className="flex h-[calc(100vh-300px)] max-h-[900px] min-h-[520px] flex-col self-start rounded-2xl border border-[#ececf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#ececf1] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef0fb] text-[#6856fd]">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Creator Coach</p>
                <p className="text-xs text-[#9ca3af]">
                  {context.hasProfile
                    ? `Knows your niche${context.niche ? ` (${context.niche})` : ""} and saved work`
                    : "Set up your profile for sharper answers"}
                </p>
              </div>
            </div>
            <span className="hidden rounded-full bg-[#f4f5f8] px-3 py-1.5 text-xs text-[#6b7280] sm:block">
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </span>
          </div>

          {/* transcript */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 && !loading && (
              <div className="py-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef0fb] text-[#6856fd]">
                  <UserIcon className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-[#374151]">
                  {context.creatorName ? `Hey ${context.creatorName},` : "Hey there,"} what are we working on?
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9ca3af]">
                  Ask about your strategy, your saved work, or what to make next.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs text-[#6b7280] transition hover:border-[#c9c6f6] hover:text-[#111827]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                    m.role === "user"
                      ? "bg-[#0b1020] text-white"
                      : "bg-[#fafafc] text-[#374151]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#fafafc] px-4 py-3.5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-[#c9c6f6]"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="mx-6 mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {error}
            </p>
          )}

          {upgradeInfo && (
            <div className="px-6 pb-3">
              <UpgradePrompt
                plan={upgradeInfo.plan}
                message={upgradeInfo.message}
                currentUsage={upgradeInfo.currentUsage}
                limit={upgradeInfo.limit}
              />
            </div>
          )}

          {/* composer */}
          <div className="border-t border-[#ececf1] p-4">
            {/* remaining quota */}
            <div className="mb-3 px-1">
              <UsageMeter feature="coach" refreshKey={usageRefresh} />
            </div>

            <div className="flex items-end gap-2 rounded-2xl border border-[#e5e7eb] bg-white p-2 focus-within:border-[#c9c6f6]">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach anything…"
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-[#9ca3af]"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338] disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p className="mt-2 px-1 text-xs text-[#9ca3af]">
              Enter to send · Shift + Enter for a new line
            </p>
          </div>
        </div>

        {/* ============ right rail ============ */}
        <aside className="space-y-6">
          {/* latest analysis score */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#111827]">Latest script score</p>
              <Link href="/analyzer" className="text-xs font-medium text-[#5b5bd6] hover:underline">
                Analyzer
              </Link>
            </div>

            {latest ? (
              <>
                <div className="mt-5 flex items-center gap-4">
                  <div
                    className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${scoreColor(latest.score)} ${latest.score * 3.6}deg, #f1f2f6 0deg)`,
                    }}
                  >
                    <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white">
                      <span className="text-2xl font-bold text-[#111827]">{latest.score}</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#111827]">{latest.title}</p>
                    <p className="mt-1 text-xs text-[#9ca3af]">{timeAgo(latest.createdAt)}</p>
                  </div>
                </div>

                {latest.weaknesses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => send(`My last script scored ${latest.score}/100. The weaknesses were: ${latest.weaknesses.join("; ")}. How do I fix these?`)}
                    className="mt-4 w-full rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
                  >
                    Ask the coach to fix these →
                  </button>
                )}
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-[#fafafc] px-4 py-6 text-center text-sm leading-6 text-[#9ca3af]">
                Analyze a script and its score will show here.
              </p>
            )}
          </div>

          {/* action plan from real recommendations */}
          {latest && latest.recommendations.length > 0 && (
            <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
              <p className="text-sm font-semibold text-[#111827]">Action plan</p>
              <p className="mt-1 text-xs text-[#9ca3af]">
                From your most recent analysis.
              </p>

              <ul className="mt-4 space-y-3">
                {latest.recommendations.map((r, i) => {
                  const done = doneItems.has(i);
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <button
                        type="button"
                        aria-label={done ? "Mark as not done" : "Mark as done"}
                        onClick={() =>
                          setDoneItems((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] transition ${
                          done ? "bg-[#6856fd] text-white" : "border border-[#d8d9e4] text-transparent hover:border-[#c9c6f6]"
                        }`}
                      >
                        ✓
                      </button>
                      <span
                        className={`text-xs leading-5 ${
                          done ? "text-[#9ca3af] line-through" : "text-[#374151]"
                        }`}
                      >
                        {r}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] text-[#9ca3af]">
                Ticks are for this session only.
              </p>
            </div>
          )}

          {/* what the coach can see */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-sm font-semibold text-[#111827]">What your coach knows</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ["Niche", context.niche],
                ["Primary platform", context.primaryPlatform],
                ["Goal", context.goals],
              ].map(([k, v]) => (
                <li key={k} className="flex items-start justify-between gap-3">
                  <span className="text-[#6b7280]">{k}</span>
                  <span className="max-w-[60%] text-right font-medium text-[#111827]">
                    {v ? v : <span className="text-[#d1d5db]">Not set</span>}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-[#f1f2f6] pt-2.5">
                <span className="text-[#6b7280]">Saved work</span>
                <span className="font-medium text-[#111827]">{totalSaved} items</span>
              </li>
            </ul>

            {!context.hasProfile && (
              <Link
                href="/creator-profile"
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#0b1020] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
              >
                Set up profile →
              </Link>
            )}
          </div>

          {/* recent analyses */}
          {context.recentAnalyses.length > 0 && (
            <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#111827]">Recent analyses</p>
                <Link href="/analyzer" className="text-xs font-medium text-[#5b5bd6] hover:underline">
                  View all
                </Link>
              </div>

              <ul className="mt-4 space-y-3">
                {context.recentAnalyses.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white"
                      style={{ background: scoreColor(a.score) }}
                    >
                      {a.score}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs leading-5 text-[#374151]">{a.title}</span>
                      <span className="block text-[11px] text-[#9ca3af]">{timeAgo(a.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* next steps */}
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5">
            <p className="text-sm font-semibold text-[#111827]">Jump into a studio</p>
            <div className="mt-4 space-y-2">
              <Link
                href="/ideas"
                className="flex items-center gap-2.5 rounded-xl border border-[#ececf1] px-4 py-2.5 text-sm text-[#374151] transition hover:bg-[#fafafc]"
              >
                <LightbulbIcon className="h-4 w-4 text-[#3b82f6]" />
                Generate ideas
              </Link>
              <Link
                href="/analyzer"
                className="flex items-center gap-2.5 rounded-xl border border-[#ececf1] px-4 py-2.5 text-sm text-[#374151] transition hover:bg-[#fafafc]"
              >
                <PlayCircleIcon className="h-4 w-4 text-[#ec4899]" />
                Analyze a script
              </Link>
            </div>
          </div>

          {plan === "free" && (
            <div
              className="rounded-2xl p-5 text-white"
              style={{ backgroundImage: "linear-gradient(140deg,#0b1020 0%,#151a2e 55%,#3a2f7a 100%)" }}
            >
              <p className="text-sm font-semibold">More coaching</p>
              <p className="mt-2 text-sm leading-6 text-[#c8ccdb]">
                Upgrade for more coach messages each month and priority processing.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-4 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-white/90"
              >
                Upgrade now →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}