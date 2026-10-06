import { FloatingActions } from "@/components/floating-actions";
import { ShowcasePanel, type ShowcaseData } from "@/components/showcase-panel";
import { FRAME, SECTIONS } from "@/sections";
import type { SectionCtx, SectionDef } from "@/sections/types";
import { STYLES, styleVars } from "@/styles";
import { translate, UI, type Lang } from "./i18n";
import type { ResolvedSection, ResolvedSite } from "./site";

export function digits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  // Indian 10-digit numbers get the +91 country code.
  return d.length === 10 ? `91${d}` : d;
}

/**
 * Resolve "images/x.jpg" (client folder), "/placeholders/x.svg" or a URL.
 * `base` is where the client's own files live: "/client/" for single-site builds, an R2 URL on the platform.
 */
export function imageUrl(ref: string | undefined, base = "/client/"): string | undefined {
  if (!ref) return undefined;
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("/")) return ref;
  return `${base.replace(/\/?$/, "/")}${ref.replace(/^\.?\//, "")}`;
}

export function langPath(site: ResolvedSite, lang: Lang): string {
  const base = site.pathBase ?? "";
  return lang === site.defaultLang ? `${base}/` : `${base}/${lang}/`;
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
    img: (ref) => imageUrl(ref, site.assetBase),
    waNumber,
    wa: (message) => `https://wa.me/${waNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
    tel: `tel:+${digits(b.phone)}`,
    langHref: (l) => langPath(site, l),
    nav,
  };
}

/**
 * Renders one section. In showcase mode every layout is rendered and only the active one is shown
 * (`[data-sc-variant]` rules in globals.css), so the panel can switch layouts instantly in a static site.
 */
function SectionBlock({
  def,
  section,
  ctx,
  showcase,
  frame = false,
}: {
  def: SectionDef;
  section: ResolvedSection;
  ctx: SectionCtx;
  showcase: boolean;
  frame?: boolean;
}) {
  if (!showcase) {
    const Layout = def.layouts[section.layout];
    return <Layout id={frame ? undefined : section.id} data={section.data} ctx={ctx} />;
  }
  return (
    <div id={frame ? undefined : section.id} data-sc-section={section.id} {...(frame ? { "data-sc-frame": "" } : {})}>
      {Object.entries(def.layouts).map(([name, Layout]) => (
        <div key={name} data-sc-variant={name} {...(name === section.layout ? { "data-active": "" } : {})}>
          <Layout data={section.data} ctx={ctx} />
        </div>
      ))}
    </div>
  );
}

function showcaseData(site: ResolvedSite, ctx: SectionCtx): ShowcaseData {
  const all = [site.navbar, ...site.sections, site.footer];
  return {
    lang: ctx.lang,
    style: site.config.style,
    primary: site.style.colors.primary,
    styles: Object.values(STYLES).map((base) => {
      // The site's own style keeps any brand colours from its config.
      const st = base.id === site.style.id ? site.style : base;
      return { id: st.id, label: st.label, vars: styleVars(st), swatch: [st.colors.primary, st.colors.accent, st.colors.surface] };
    }),
    sections: all.map((s) => ({
      id: s.id,
      type: s.type,
      layout: s.layout,
      layouts: Object.keys((s.id === "navbar" || s.id === "footer" ? FRAME[s.id] : SECTIONS[s.type]).layouts),
    })),
    looks: site.preset.looks.map((l) => ({
      id: l.id,
      name: translate(l.name, ctx.lang),
      style: l.style,
      layouts: l.layouts,
      swatch: [STYLES[l.style].colors.primary, STYLES[l.style].colors.accent, STYLES[l.style].colors.surface],
    })),
  };
}

export function SitePage({ site, lang }: { site: ResolvedSite; lang: Lang }) {
  const ctx = buildCtx(site, lang);
  const showcase = Boolean(site.config.showcase);
  return (
    <div lang={lang} className="pb-16 sm:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-bg focus:p-3">
        Skip to content
      </a>
      <SectionBlock def={FRAME.navbar} section={site.navbar} ctx={ctx} showcase={showcase} frame />
      <main id="main">
        {site.sections.map((s) => (
          <SectionBlock key={s.id} def={SECTIONS[s.type]} section={s} ctx={ctx} showcase={showcase} />
        ))}
      </main>
      <SectionBlock def={FRAME.footer} section={site.footer} ctx={ctx} showcase={showcase} frame />
      <FloatingActions ctx={ctx} />
      {showcase && <ShowcasePanel data={showcaseData(site, ctx)} />}
    </div>
  );
}
