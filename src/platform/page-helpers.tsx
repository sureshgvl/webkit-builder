import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { SitePage } from "@/lib/render";
import { jsonLd, siteMetadata } from "@/lib/seo";
import { loadHostSite } from "./load";
import { SiteHead, SiteUnavailable } from "./site-head";

export async function hostMetadata(host: string, lang?: string): Promise<Metadata> {
  const r = await loadHostSite(host);
  if (r.status !== "ok") return { title: "Site unavailable", robots: { index: false } };
  const l = pickLang(r.site.langs, r.site.defaultLang, lang);
  if (!l) return {};
  // Absolute URLs (share previews, canonical) use the address the visitor came in on.
  const base = r.site.config.siteUrl ?? `https://${r.host}`;
  return { ...siteMetadata({ ...r.site, config: { ...r.site.config, siteUrl: base } }, l) };
}

function pickLang(langs: Lang[], def: Lang, lang?: string): Lang | null {
  if (lang === undefined) return def;
  return langs.includes(lang as Lang) && lang !== def ? (lang as Lang) : null;
}

export async function HostPage({ host, lang }: { host: string; lang?: string }) {
  const r = await loadHostSite(host);
  if (r.status === "not-found") notFound();
  if (r.status === "invalid") {
    return <SiteUnavailable title="Website under maintenance" text="Please check again in a little while." />;
  }
  const l = pickLang(r.site.langs, r.site.defaultLang, lang);
  if (!l) notFound();
  const site = { ...r.site, config: { ...r.site.config, siteUrl: r.site.config.siteUrl ?? `https://${r.host}` } };
  return (
    <>
      <SiteHead site={site} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(site, l)) }} />
      <SitePage site={site} lang={l} />
    </>
  );
}
