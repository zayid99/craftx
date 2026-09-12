import type { MetadataRoute } from "next";

const BASE_URL = "https://craftxapp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/creator-profile",
          "/ideas",
          "/scripts",
          "/seo",
          "/analyzer",
          "/planner",
          "/coach",
          "/help",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}