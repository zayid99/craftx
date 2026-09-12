const BASE_URL = "https://craftxapp.com";

const faqs: [string, string][] = [
  [
    "What is CraftX?",
    "CraftX is a creator research and AI framework designed to help creators move from ideas to better content and sustainable growth.",
  ],
  [
    "Who is CraftX for?",
    "Creators who want a more structured way to research, create, optimize, analyze and grow.",
  ],
  [
    "Is there a free plan?",
    "Yes. The free plan includes all five tools with a one-time allocation of generations, so you can try the whole workflow before deciding to pay. It doesn't reset each month — paid plans do.",
  ],
  [
    "What's included in the Creator plan?",
    "Unlimited ideas, 50 scripts, 150 SEO sets, 30 content plans and 20 script analyses a month, plus priority processing.",
  ],
  [
    "What's included in Creator Pro?",
    "Unlimited ideas, scripts and analyses, plus 400 SEO sets and 100 content plans a month, advanced growth insights and premium support.",
  ],
  [
    "Do I need AI experience?",
    "No. The tools are designed to guide creators through the workflow step by step.",
  ],
  [
    "Can I cancel anytime?",
    "Yes. You can cancel at any time from Settings and keep access until the end of your current billing period.",
  ],
  [
    "What platforms does CraftX support?",
    "CraftX is designed around major creator platforms including YouTube, TikTok, Instagram, Facebook, X (Twitter), LinkedIn and Shorts.",
  ],
  [
    "Does CraftX create content for me?",
    "CraftX helps you research, structure, optimize, analyze and improve content — you stay in control of what gets published.",
  ],
  [
    "How does CraftX use my creator profile?",
    "Your profile provides context about your niche, platforms, audience, goals and experience so recommendations can be more relevant.",
  ],
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "CraftX",
      url: BASE_URL,
      email: "craftxofficialbd@gmail.com",
      description:
        "CraftX is an AI-powered creator workspace for researching ideas, building content, optimizing uploads, and understanding what drives growth.",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "CraftX",
      description:
        "The creator growth workspace — ideas, scripts, SEO, planning, and analysis in one place.",
      publisher: { "@id": `${BASE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/#software`,
      name: "CraftX",
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      description:
        "CraftX helps creators research ideas, build content, optimize every upload, and understand what actually drives growth — all in one workspace.",
      featureList: [
        "Idea Studio — turn a niche into content ideas",
        "Script Studio — generate hooks and full scripts",
        "SEO Studio — titles, descriptions, keywords and hashtags",
        "Script Analyzer — analyse scripts and get recommendations",
        "Content Planner — weekly and 30-day posting plans",
      ],
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description:
            "All five studios with a one-time allocation of generations.",
        },
        {
          "@type": "Offer",
          name: "Creator",
          price: "9.99",
          priceCurrency: "USD",
          description: "Monthly plan for creators who publish consistently.",
        },
        {
          "@type": "Offer",
          name: "Creator Pro",
          price: "19.99",
          priceCurrency: "USD",
          description: "Monthly plan for creators serious about growth.",
        },
      ],
      publisher: { "@id": `${BASE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/#faq`,
      mainEntity: faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}