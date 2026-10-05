import { FloatingActions } from "@/components/floating-actions";
import { FRAME, SECTIONS } from "@/sections";
import type { SectionCtx } from "@/sections/types";
import { translate, UI, type Lang } from "./i18n";
import type { ResolvedSite } from "./site";

export function digits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  // Indian 10-digit numbers get the +91 country code.
  return d.length === 10 ? `91${d}` : d;
}

/** Resolve "images/x.jpg" (client folder), "/placeholders/x.svg" or a URL. */
export function imageUrl(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("/")) return ref;
  return `/client/${ref.replace(/^\.?\//, "")}`;
}

export function langPath(site: ResolvedSite, lang: Lang): string {
  return lang === site.defaultLang ? "/" : `/${lang}/`;
}

export function buildCtx(site: ResolvedSite, lang: Lang): SectionCtx {
  const t = (v: Parameters<typeof translate>[0]) => translate(v, lang);
  const b = site.config.business;
  const waNumber = digits(b.whatsapp ?? b.phone);
  const nav = site.sections
    .filter((s) => s.data.navLabel)
    .map((s) => ({ id: s.id, label: t(s.data.navLabel as Parameters<typeof translate>[0]) }));
  return {
    lang,
    langs: site.langs,
    ui: UI[lang],
    business: b,
    t,
    img: imageUrl,
    waNumber,
    wa: (message) => `https://wa.me/${waNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
    tel: `tel:+${digits(b.phone)}`,
    langHref: (l) => langPath(site, l),
    nav,
  };
}

export function SitePage({ site, lang }: { site: ResolvedSite; lang: Lang }) {
  const ctx = buildCtx(site, lang);
  const Navbar = FRAME.navbar.layouts[site.navbar.layout];
  const Footer = FRAME.footer.layouts[site.footer.layout];
  return (
    <div lang={lang} className="pb-16 sm:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-bg focus:p-3">
        Skip to content
      </a>
      <Navbar id="top" data={site.navbar.data} ctx={ctx} />
      <main id="main">
        {site.sections.map((s) => {
          const Layout = SECTIONS[s.type].layouts[s.layout];
          return <Layout key={s.id} id={s.id} data={s.data} ctx={ctx} />;
        })}
      </main>
      <Footer id="footer" data={site.footer.data} ctx={ctx} />
      <FloatingActions ctx={ctx} />
    </div>
  );
}
