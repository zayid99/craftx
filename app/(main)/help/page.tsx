import Link from "next/link";

const FAQS = [
  {
    q: "How do the five studios work together?",
    a: "Idea Studio finds topics, Script Studio structures one into a script, SEO Studio packages it for search, Content Planner schedules it, and Script Analyzer reviews what you wrote. Saved work from one studio can be imported into the next.",
  },
  {
    q: "Where does my saved work go?",
    a: "Everything you save appears at the bottom of the studio you saved it in, and all of it together on your Dashboard. You can view, copy or delete any saved item from either place.",
  },
  {
    q: "Why does CraftX ask for a creator profile?",
    a: "Your niche, audience, platform and goals pre-fill each studio and get passed to the AI, so generations start closer to the content you actually make. You can update it at any time.",
  },
  {
    q: "What happens when I hit my plan limit?",
    a: "The studio shows how much of your allowance you've used and offers an upgrade. On the free plan that allowance is a one-time amount to try the whole workflow; on paid plans it refreshes on the 1st of each month. Nothing you've already saved is affected either way.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes. Cancel from Settings at any time — you keep access until the end of your current billing period.",
  },
  {
    q: "Can I analyze a video from a YouTube link?",
    a: "Not currently. Script Analyzer works from a script or transcript you paste in. Most editing tools can export a transcript, and YouTube Studio can too for your own uploads.",
  },
];

const SUPPORT_EMAIL = "craftxofficialbd@gmail.com";

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6">
      <div>
        <span className="inline-flex rounded-full border border-[#dfe3f5] bg-[#f4f6ff] px-3.5 py-1.5 text-xs font-medium tracking-[1px] text-[#5b5bd6]">
          HELP &amp; SUPPORT
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-[-0.5px] text-[#111827] md:text-4xl">
          How can we help?
        </h2>
        <p className="mt-2 text-[#6b7280]">
          Answers to the questions we get most often.
        </p>
      </div>

      <div className="rounded-2xl border border-[#ececf1] bg-white">
        <div className="border-b border-[#ececf1] px-6 py-5">
          <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
            Frequently asked
          </h3>
        </div>

        <div className="divide-y divide-[#f1f2f6]">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-[#111827] [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="shrink-0 text-[#9ca3af] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-[#6b7280]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#ececf1] bg-white p-6">
          <p className="text-sm font-semibold text-[#111827]">Still stuck?</p>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">
            Email us and we&apos;ll get back to you. Include the studio you were
            using and what you expected to happen.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 inline-flex rounded-xl bg-[#0b1020] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b2338]"
          >
            Contact support →
          </a>
                    <p className="mt-3 text-xs leading-5 text-[#9ca3af]">
            Or email us directly at{" "}
            <span className="text-[#6b7280]">{SUPPORT_EMAIL}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#ececf1] bg-white p-6">
          <p className="text-sm font-semibold text-[#111827]">Billing questions</p>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">
            Change your plan, check your renewal date or cancel from Settings.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex rounded-xl border border-[#e5e7eb] px-5 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f7f8fa]"
          >
            Open settings →
          </Link>
        </div>
      </div>
    </div>
  );
}