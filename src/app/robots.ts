import type { MetadataRoute } from "next";
import { loadSite } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = loadSite().config.siteUrl;
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: base ? new URL("/sitemap.xml", base).href : undefined,
  };
}
