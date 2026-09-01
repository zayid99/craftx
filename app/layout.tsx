import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}