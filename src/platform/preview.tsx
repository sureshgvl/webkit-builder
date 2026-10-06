import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { SitePage } from "@/lib/render";
import { parseSite, SiteConfigError } from "@/lib/site";
import { SiteHead, SiteUnavailable } from "./site-head";

/**
 * Draft preview: the admin panel makes a signed, 1-hour link (/preview/<token>/); the website asks the backend
 * for that site's current config, published or not. Never cached, never indexed.
 */
async function loadPreview(token: string) {
  const backend = process.env.BACKEND_URL;
  if (!backend || !/^[a-z0-9-]+\.\d+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const res = await fetch(`${backend.replace(/\/$/, "")}/api/preview-config?token=${encodeURIComponent(token)}`, { cache: "no-store" });
  if (res.status === 403) return { expired: true as const };
  if (!res.ok) return null;
  return (await res.json()) as { slug: string; config: unknown; assetBase: string };
}

export const previewMetadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export async function PreviewPage({ token, lang }: { token: string; lang?: string }) {
  const data = await loadPreview(token);
  if (!data) notFound();
  if ("expired" in data) return <SiteUnavailable title="Preview link expired" text="Open a new preview from the admin panel." />;
  let site;
  try {
    const parsed = parseSite(data.slug, data.config, `site "${data.slug}"`, { assetBase: data.assetBase });
    // No analytics in previews, so the client's visitor numbers stay clean.
    site = { ...parsed, config: { ...parsed.config, analytics: undefined }, pathBase: `/preview/${token}` };
  } catch (e) {
    if (e instanceof SiteConfigError) return <SiteUnavailable title="This draft has errors" text={e.message} />;
    throw e;
  }
  const l = lang === undefined ? site.defaultLang : (lang as Lang);
  if (!site.langs.includes(l) || (lang !== undefined && l === site.defaultLang)) notFound();
  return (
    <>
      <SiteHead site={site} />
      <div style={{ position: "fixed", bottom: 12, left: 12, zIndex: 9999, background: "#111", color: "#fff", padding: "6px 12px", borderRadius: 999, fontSize: 13, opacity: 0.85 }}>
        Preview · not live
      </div>
      <SitePage site={site} lang={l} />
    </>
  );
}
