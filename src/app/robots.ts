import { MetadataRoute } from "next";
import { getEnvVar } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/register", "/profile", "/lots/create"],
    },
    sitemap: `${getEnvVar("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")}/sitemap.xml`,
  };
}
