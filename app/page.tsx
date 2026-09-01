const features = [
  {
    number: "01",
    title: "Idea Studio",
    description:
      "Turn your niche, audience, and goals into content ideas worth actually making.",
  },
  {
    number: "02",
    title: "Script Studio",
    description:
      "Build stronger hooks, scripts, structures, and CTAs without starting from a blank page.",
  },
  {
    number: "03",
    title: "SEO Studio",
    description:
      "Improve titles, descriptions, keywords, and content positioning for the platform you're targeting.",
  },
  {
    number: "04",
    title: "Video Analyzer",
    description:
      "Understand what works, what doesn't, and what you should improve in your next piece of content.",
  },
  {
    number: "05",
    title: "Content Planner",
    description:
      "Turn scattered ideas into a practical weekly or 30-day publishing plan.",
  },
  {
    number: "06",
    title: "Creator Coach",
    description:
      "Get personalized strategic guidance based on your creator profile and work inside Creova.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f5] text-[#111111]">
      {/* Navigation */}
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
            C
          </div>

          <span className="text-xl font-semibold tracking-tight">
            Creova
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm text-black/60 md:flex">
          <a href="#features" className="transition hover:text-black">
            Features
          </a>
          <a href="#vision" className="transition hover:text-black">
            Why Creova
          </a>
          <a href="#pricing" className="transition hover:text-black">
            Pricing
          </a>
        </div>

        <a
          href="#start"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
        >
          Get started
        </a>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex min-h-[680px] w-full max-w-7xl items-center px-6 py-20 lg:px-8">
        <div className="grid w-full gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/60 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-black" />
              The creator operating system
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-8xl">
              Create better.
              <br />
              Grow smarter.
              <br />
              Scale bigger.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-black/55 sm:text-xl">
              Creova brings your ideas, scripts, SEO, planning, analysis, and
              creator strategy into one intelligent workspace.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                id="start"
                href="#features"
                className="rounded-full bg-black px-7 py-3.5 text-center text-sm font-medium text-white transition hover:bg-black/80"
              >
                Start creating
              </a>

              <a
                href="#vision"
                className="rounded-full border border-black/10 bg-white px-7 py-3.5 text-center text-sm font-medium transition hover:border-black/20 hover:bg-black/[0.02]"
              >
                See how it works
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-black/45">
              <span>Ideas</span>
              <span>Scripts</span>
              <span>SEO</span>
              <span>Planning</span>
              <span>Analysis</span>
              <span>Strategy</span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-black/[0.025] blur-3xl" />

            <div className="relative rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
              <div className="rounded-[1.5rem] bg-[#f5f5f3] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-black/35">
                      Creator dashboard
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                      Good morning, Creator
                    </h2>
                  </div>

                  <div className="h-9 w-9 rounded-full bg-black" />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-black/40">Content ideas</p>
                    <p className="mt-2 text-2xl font-semibold">24</p>
                    <p className="mt-1 text-xs text-black/40">Ready to explore</p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-black/40">This week</p>
                    <p className="mt-2 text-2xl font-semibold">6</p>
                    <p className="mt-1 text-xs text-black/40">Content planned</p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-black p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/40">
                        Creator insight
                      </p>

                      <p className="mt-3 max-w-xs text-lg font-medium leading-7">
                        Your strongest opportunity is consistency around your
                        best-performing topics.
                      </p>
                    </div>

                    <span className="text-xs text-white/40">AI</span>
                  </div>

                  <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[76%] rounded-full bg-white" />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Next content</p>
                    <span className="text-xs text-black/35">View all</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#eeeeeb]" />
                      <div>
                        <p className="text-sm font-medium">
                          Why your brain remembers...
                        </p>
                        <p className="text-xs text-black/35">
                          Short-form • 35 sec
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#eeeeeb]" />
                      <div>
                        <p className="text-sm font-medium">
                          The psychology behind...
                        </p>
                        <p className="text-xs text-black/35">
                          Short-form • 42 sec
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section
        id="vision"
        className="border-y border-black/10 bg-white px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/35">
                One connected workspace
              </p>

              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
                Stop jumping between a dozen tools just to make one piece of
                content.
              </h2>
            </div>

            <p className="max-w-xl text-lg leading-8 text-black/50">
              Creova is designed around the creator, not around isolated AI
              features. Your profile, ideas, scripts, plans, analyses, and
              strategy become part of one connected system.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/35">
              Phase 1
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Everything you need to create with intention.
            </h2>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="bg-white p-8 transition hover:bg-[#fafaf8]"
              >
                <span className="text-xs font-medium tracking-widest text-black/30">
                  {feature.number}
                </span>

                <h3 className="mt-12 text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-black/50">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="pricing"
        className="px-6 pb-24 pt-8 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2.5rem] bg-black px-8 py-16 text-white sm:px-12 lg:px-16 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40">
                Built for creators
              </p>

              <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                Your content deserves a system, not another random AI tool.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/50">
                Creova starts with content creation and grows toward a complete
                creator operating system.
              </p>

              <a
                href="#start"
                className="mt-9 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Start with Creova
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-black/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Creova</span>
          <span>Create Better. Grow Smarter. Scale Bigger.</span>
        </div>
      </footer>
    </main>
  );
}