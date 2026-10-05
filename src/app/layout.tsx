import type { ReactNode } from "react";
import { translate } from "@/lib/i18n";
import { imageUrl } from "@/lib/render";
import { loadSite, type ResolvedSite } from "@/lib/site";
import { googleFontsHref, styleVars } from "@/styles";
import "./globals.css";

/** Client logo, or a generated letter icon in the brand colour. */
function faviconHref(site: ResolvedSite): string {
  const logo = imageUrl(site.config.business.logo);
  if (logo) return logo;
  const letter = translate(site.config.business.name, "en").trim().charAt(0).toUpperCase() || "•";
  const c = site.style.colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.primary}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="${c.primaryFg}">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const site = loadSite();
  const ga = site.config.analytics?.ga4;
  return (
    <html lang={site.defaultLang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={googleFontsHref(site.style)} />
        <link rel="icon" href={faviconHref(site)} />
        <meta name="theme-color" content={site.style.colors.primary} />
        <style>{`:root{${styleVars(site.style)}}`}</style>
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
      </head>
      <body>{children}</body>
    </html>
  );
}
