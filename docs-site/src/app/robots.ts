import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/docs", "/docs/"],
    },
    sitemap: "https://occasio-greetings.vercel.app/sitemap.xml",
  };
}
