import type { MetadataRoute } from "next";
import { langPath } from "@/lib/render";
import { loadSite } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = loadSite();
  const base = site.config.siteUrl;
  if (!base) return [];
  return site.langs.map((l) => ({
    url: new URL(langPath(site, l), base).href,
    changeFrequency: "monthly",
    priority: l === site.defaultLang ? 1 : 0.8,
  }));
}
