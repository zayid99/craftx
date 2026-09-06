import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";

// Loaded once at the root so every page (landing + workspace) can use them.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });


export const metadata: Metadata = {
  title: "CraftX | Create Better. Grow Smarter. Scale Bigger.",
  description:
    "CraftX is an AI-powered creator platform for ideas, scripts, SEO, planning, analysis, and creator strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body className="font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  );
}
