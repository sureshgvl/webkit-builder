import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** A site as stored by the platform (same config shape as clients/<slug>/site.json). */
export type StoredSite = { slug: string; config: unknown; updatedAt: string };

/** Finds the site for a web address. */
export interface SiteSource {
  byHost(host: string): Promise<StoredSite | null>;
  /** Where this site's own images are served from. */
  assetBase(slug: string): string;
}

/** "WWW.Patil-Tours.in:443" → "patil-tours.in" */
export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
}

/** Cache tag for a host's site data; the revalidate endpoint clears it after a publish. */
export const hostTag = (host: string) => `site-host:${host}`;

/** How long a cached site may be served before it is checked again (seconds). Publishing clears it at once. */
export const SITE_REVALIDATE_SECONDS = 300;

/**
 * Supabase (PostgREST over HTTPS, public anon key). Row Level Security only returns published sites,
 * so a draft or suspended site is simply "not found" here.
 */
export class SupabaseSiteSource implements SiteSource {
  constructor(
    private url: string,
    private anonKey: string,
    private assetsBaseUrl: string,
  ) {}

  async byHost(host: string): Promise<StoredSite | null> {
    const q = new URLSearchParams({ select: "site:sites(slug,config,updated_at)", domain: `eq.${host}`, limit: "1" });
    const res = await fetch(`${this.url.replace(/\/$/, "")}/rest/v1/domains?${q}`, {
      headers: { apikey: this.anonKey, Authorization: `Bearer ${this.anonKey}`, Accept: "application/json" },
      next: { revalidate: SITE_REVALIDATE_SECONDS, tags: [hostTag(host)] },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const rows = (await res.json()) as { site: { slug: string; config: unknown; updated_at: string } | null }[];
    const site = rows[0]?.site;
    return site ? { slug: site.slug, config: site.config, updatedAt: site.updated_at } : null;
  }

  assetBase(slug: string) {
    return `${this.assetsBaseUrl.replace(/\/$/, "")}/sites/${slug}/`;
  }
}

/**
 * Local development and tests: "<slug>.localhost" shows clients/<slug>/site.json; images come from
 * /dev-assets/<slug>/. Never used when Supabase is configured.
 */
export class FileSiteSource implements SiteSource {
  constructor(private clientsDir = path.join(process.cwd(), "clients")) {}

  async byHost(host: string): Promise<StoredSite | null> {
    const slug = host.split(".")[0];
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
    const file = path.join(this.clientsDir, slug, "site.json");
    if (!existsSync(file)) return null;
    return { slug, config: JSON.parse(readFileSync(file, "utf8")), updatedAt: new Date(0).toISOString() };
  }

  assetBase(slug: string) {
    return `/dev-assets/${slug}/`;
  }
}

let source: SiteSource | undefined;

export function siteSource(env = process.env): SiteSource {
  if (source) return source;
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    if (!env.ASSETS_BASE_URL) throw new Error("ASSETS_BASE_URL (public R2 URL) is required with Supabase");
    source = new SupabaseSiteSource(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, env.ASSETS_BASE_URL);
  } else {
    source = new FileSiteSource();
  }
  return source;
}
