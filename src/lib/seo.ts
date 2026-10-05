import type { Metadata } from "next";
import { translate, type Lang } from "./i18n";
import { digits, imageUrl, langPath } from "./render";
import type { ResolvedSite } from "./site";

function heroImage(site: ResolvedSite): string | undefined {
  const hero = site.sections.find((s) => s.type === "hero");
  return imageUrl(site.config.seo?.image ?? (hero?.data.image as string | undefined));
}

export function siteMetadata(site: ResolvedSite, lang: Lang): Metadata {
  const { config } = site;
  const name = translate(config.business.name, lang);
  const tagline = translate(config.business.tagline, lang);
  const title = translate(config.seo?.title, lang) || (tagline ? `${name} – ${tagline}` : name);
  const description =
    translate(config.seo?.description, lang) ||
    translate(site.sections.find((s) => s.type === "hero")?.data.subtitle as never, lang);
  const base = config.siteUrl ? new URL(config.siteUrl) : undefined;

  return {
    metadataBase: base,
    title,
    description,
    keywords: config.seo?.keywords,
    alternates: base
      ? {
          canonical: langPath(site, lang),
          languages: Object.fromEntries(site.langs.map((l) => [l, langPath(site, l)])),
        }
      : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: name,
      locale: lang === "mr" ? "mr_IN" : "en_IN",
      // Share previews need an absolute URL, so they are only added once siteUrl is known.
      images: base && heroImage(site) ? [{ url: heroImage(site)! }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** schema.org data so Google shows phone, address and hours for the business. */
export function jsonLd(site: ResolvedSite, lang: Lang): Record<string, unknown> {
  const b = site.config.business;
  const s = b.socials ?? {};
  return {
    "@context": "https://schema.org",
    "@type": site.preset.schemaType,
    name: translate(b.name, lang),
    description: translate(b.tagline, lang) || undefined,
    telephone: `+${digits(b.phone)}`,
    email: b.email,
    address: b.address ? translate(b.address, lang) : undefined,
    url: site.config.siteUrl,
    image: site.config.siteUrl && heroImage(site) ? new URL(heroImage(site)!, site.config.siteUrl).href : undefined,
    sameAs: [s.instagram, s.facebook, s.youtube].filter(Boolean),
  };
}
