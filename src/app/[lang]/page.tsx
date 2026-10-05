import { notFound } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { jsonLd, siteMetadata } from "@/lib/seo";
import { SitePage } from "@/lib/render";
import { loadSite } from "@/lib/site";

type Props = { params: Promise<{ lang: string }> };

export const dynamicParams = false;

/** Every language except the default one gets its own path, e.g. "/en/". */
export function generateStaticParams() {
  const site = loadSite();
  const others = site.langs.filter((l) => l !== site.defaultLang);
  // Static export needs at least one path; a placeholder 404s when the site has a single language.
  return others.length ? others.map((lang) => ({ lang })) : [{ lang: "_" }];
}

function resolveLang(lang: string): Lang {
  const site = loadSite();
  const l = lang as Lang;
  if (!site.langs.includes(l) || l === site.defaultLang) notFound();
  return l;
}

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  return siteMetadata(loadSite(), resolveLang(lang));
}

export default async function LangHome({ params }: Props) {
  const lang = resolveLang((await params).lang);
  const site = loadSite();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(site, lang)) }} />
      <SitePage site={site} lang={lang} />
    </>
  );
}
