import { jsonLd, siteMetadata } from "@/lib/seo";
import { SitePage } from "@/lib/render";
import { loadSite } from "@/lib/site";

export function generateMetadata() {
  const site = loadSite();
  return siteMetadata(site, site.defaultLang);
}

/** Default language, served at "/". */
export default function Home() {
  const site = loadSite();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(site, site.defaultLang)) }} />
      <SitePage site={site} lang={site.defaultLang} />
    </>
  );
}
