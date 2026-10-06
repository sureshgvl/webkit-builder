import { translate } from "@/lib/i18n";
import { imageUrl } from "@/lib/render";
import type { ResolvedSite } from "@/lib/site";
import { googleFontsHref, STYLES, styleVars } from "@/styles";

/**
 * Per-site <head> content for the platform (single-site builds put this in the root layout instead).
 * React hoists these tags into <head>.
 */
export function SiteHead({ site }: { site: ResolvedSite }) {
  const logo = imageUrl(site.config.business.logo, site.assetBase);
  const c = site.style.colors;
  const letter = translate(site.config.business.name, "en").trim().charAt(0).toUpperCase() || "•";
  const favicon =
    logo ??
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.primary}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="${c.primaryFg}">${letter}</text></svg>`,
    )}`;
  const fonts = site.config.showcase ? googleFontsHref(...Object.values(STYLES)) : googleFontsHref(site.style);
  const ga = site.config.analytics?.ga4;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={fonts} precedence="default" />
      <link rel="icon" href={favicon} />
      <meta name="theme-color" content={c.primary} />
      <style href={`site-vars-${site.slug}`} precedence="high">{`:root{${styleVars(site.style)}}`}</style>
      {ga && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`,
            }}
          />
        </>
      )}
    </>
  );
}

/** Shown when a web address has no published site, or its config is broken. */
export function SiteUnavailable({ title, text }: { title: string; text: string }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center", color: "#1f2937", background: "#f8fafc" }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{title}</h1>
        <p style={{ color: "#6b7280" }}>{text}</p>
      </div>
    </main>
  );
}
