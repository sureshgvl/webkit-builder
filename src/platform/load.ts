import { cache } from "react";
import { parseSite, SiteConfigError, type ResolvedSite } from "@/lib/site";
import { normalizeHost, siteSource } from "./source";

export type HostSite = { status: "ok"; site: ResolvedSite; host: string } | { status: "not-found" } | { status: "invalid"; message: string };

/**
 * The site for a web address, validated exactly like single-site builds. Cached per request (React cache)
 * and across requests by the data fetch (tags + revalidate).
 */
export const loadHostSite = cache(async (rawHost: string): Promise<HostSite> => {
  const host = normalizeHost(decodeURIComponent(rawHost));
  const src = siteSource();
  const stored = await src.byHost(host);
  if (!stored) return { status: "not-found" };
  try {
    const site = parseSite(stored.slug, stored.config, `site "${stored.slug}"`, { assetBase: src.assetBase(stored.slug) });
    return { status: "ok", site, host };
  } catch (e) {
    if (e instanceof SiteConfigError) {
      console.error(`Invalid config for ${host}:`, e.message);
      return { status: "invalid", message: e.message };
    }
    throw e;
  }
});
