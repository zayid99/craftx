const stats = [
  {
    label: "Ideas generated",
    value: "0",
    description: "Start building your content pipeline",
  },
  {
    label: "Scripts created",
    value: "0",
    description: "Your generated scripts will appear here",
  },
  {
    label: "Videos analyzed",
    value: "0",
    description: "Analyze your content to find improvements",
  },
  {
    label: "Content planned",
    value: "0",
    description: "Your upcoming content will appear here",
  },
];

const tools = [
  {
    title: "Idea Studio",
    description: "Turn your niche and goals into stronger content ideas.",
    href: "/dashboard/ideas",
  },
  {
    title: "Script Studio",
    description: "Turn an idea into a structured script built for your platform.",
    href: "/dashboard/scripts",
  },
  {
    title: "SEO Studio",
    description: "Improve titles, descriptions, keywords, and content discoverability.",
    href: "/dashboard/seo",
  },
  {
    title: "Content Planner",
    description: "Organize your next week or month of content.",
    href: "/dashboard/planner",
  },
  {
    title: "Video Analyzer",
    description: "Find strengths, weaknesses, and opportunities in your content.",
    href: "/dashboard/analyzer",
  },
  {
    title: "Creator Coach",
    description: "Get personalized guidance across your creator workflow.",
    href: "/dashboard/coach",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section>
        <p className="mb-2 text-sm font-medium text-black/45">
          Welcome to CraftX
        </p>

        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Create better. Grow smarter.
        </h2>

        <p className="mt-3 max-w-2xl text-base leading-7 text-black/55">
          Your creator workspace for ideas, scripts, SEO, planning, analysis,
          and personalized strategy.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/10 bg-white p-5"
          >
            <p className="text-sm font-medium text-black/50">{stat.label}</p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>

            <p className="mt-2 text-sm leading-5 text-black/45">
              {stat.description}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-xl font-semibold tracking-tight">
            Your creator tools
          </h3>

          <p className="mt-1 text-sm text-black/50">
            Everything you need to move from idea to published content.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              className="group rounded-2xl border border-black/10 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-black/20 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold">{tool.title}</h4>

                  <p className="mt-2 text-sm leading-6 text-black/50">
                    {tool.description}
                  </p>
                </div>

                <span className="text-lg text-black/30 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center">
        <p className="text-sm font-medium text-black/40">
          Creator Profile
        </p>

        <h3 className="mt-2 text-xl font-semibold">
          Tell CraftX about your creator goals
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-black/50">
          Your profile will eventually power personalized ideas, scripts,
          content plans, analysis, and Creator Coach recommendations.
        </p>

        <button
          type="button"
          className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/85"
        >
          Set up Creator Profile
        </button>
      </section>
    </div>
  );
}