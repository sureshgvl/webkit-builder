"use client";

import { Check, Copy, Link2, Palette, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/i18n";

export type ShowcaseData = {
  lang: Lang;
  /** The site's configured style and primary colour (the "reset" state). */
  style: string;
  primary: string;
  styles: { id: string; label: string; vars: string; swatch: string[] }[];
  sections: { id: string; type: string; layout: string; layouts: string[] }[];
  looks: { id: string; name: string; style: string; layouts: Record<string, string>; swatch: string[] }[];
};

type State = { style: string; primary: string | null; layouts: Record<string, string> };

const T = {
  en: {
    open: "Customize",
    title: "Design this website",
    intro: "Try ready looks, colours and layouts. Everything changes live.",
    looks: "Ready looks",
    style: "Style",
    color: "Brand colour",
    resetColor: "Default colour",
    layouts: "Section layouts",
    share: "Share this design",
    copyLink: "Copy link",
    copyConfig: "Copy setup (site.json)",
    copied: "Copied",
    configHelp: "Paste into the client's site.json (merge with any existing section content).",
    resetAll: "Reset everything",
    close: "Close",
  },
  mr: {
    open: "डिझाइन बदला",
    title: "ही वेबसाइट डिझाइन करा",
    intro: "तयार डिझाइन, रंग आणि मांडणी बदलून पहा. सगळे लगेच बदलते.",
    looks: "तयार डिझाइन",
    style: "स्टाइल",
    color: "ब्रँड रंग",
    resetColor: "मूळ रंग",
    layouts: "विभागांची मांडणी",
    share: "हे डिझाइन शेअर करा",
    copyLink: "लिंक कॉपी करा",
    copyConfig: "सेटअप कॉपी करा (site.json)",
    copied: "कॉपी झाले",
    configHelp: "क्लायंटच्या site.json मध्ये पेस्ट करा (आधीच्या विभागांच्या मजकुरासोबत जोडा).",
    resetAll: "सगळे पूर्वीसारखे करा",
    close: "बंद करा",
  },
} satisfies Record<Lang, Record<string, string>>;

const SECTION_NAMES: Record<string, Record<Lang, string>> = {
  navbar: { en: "Menu bar", mr: "मेनू पट्टी" },
  hero: { en: "Top banner", mr: "मुख्य बॅनर" },
  about: { en: "About", mr: "आमच्याबद्दल" },
  packages: { en: "Packages", mr: "पॅकेज" },
  fleet: { en: "Vehicles", mr: "वाहने" },
  features: { en: "Why us", mr: "आम्हालाच का" },
  stats: { en: "Numbers", mr: "आकडे" },
  gallery: { en: "Gallery", mr: "गॅलरी" },
  testimonials: { en: "Reviews", mr: "अभिप्राय" },
  faq: { en: "FAQ", mr: "प्रश्न" },
  cta: { en: "Call to action", mr: "आवाहन" },
  enquiry: { en: "Enquiry form", mr: "चौकशी फॉर्म" },
  contact: { en: "Contact", mr: "संपर्क" },
  footer: { en: "Footer", mr: "तळटीप" },
};

const LAYOUT_NAMES: Record<string, Record<Lang, string>> = {
  simple: { en: "Simple", mr: "साधे" },
  centered: { en: "Centered", mr: "मध्यभागी" },
  image: { en: "Photo", mr: "फोटो" },
  split: { en: "Side by side", mr: "बाजूला-बाजूला" },
  cards: { en: "Cards", mr: "कार्ड" },
  list: { en: "List", mr: "यादी" },
  grid: { en: "Grid", mr: "ग्रिड" },
  masonry: { en: "Mosaic", mr: "मोझेक" },
  band: { en: "Band", mr: "पट्टी" },
  scroll: { en: "Swipe", mr: "स्वाइप" },
  accordion: { en: "Accordion", mr: "उघड-बंद" },
  "two-column": { en: "Two columns", mr: "दोन कॉलम" },
  card: { en: "Card", mr: "कार्ड" },
  strip: { en: "Strip", mr: "पट्टी" },
  map: { en: "With map", mr: "नकाशासह" },
  details: { en: "Details", mr: "फक्त माहिती" },
  columns: { en: "Columns", mr: "कॉलम" },
};

/** White or near-black text, whichever reads better on `hex`. */
function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.4 ? "#111111" : "#FFFFFF";
}

const HEX = /^#[0-9a-f]{6}$/i;

export function ShowcasePanel({ data }: { data: ShowcaseData }) {
  const t = T[data.lang];
  const defaults: State = useMemo(
    () => ({ style: data.style, primary: null, layouts: Object.fromEntries(data.sections.map((s) => [s.id, s.layout])) }),
    [data],
  );
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(defaults);
  const [copied, setCopied] = useState<"" | "link" | "config">("");

  // Read a shared design from the URL once, e.g. ?style=elegant&color=1d4ed8&hero=split
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const next: State = { ...defaults, layouts: { ...defaults.layouts } };
    const style = q.get("style");
    if (style && data.styles.some((s) => s.id === style)) next.style = style;
    const color = q.get("color");
    if (color && HEX.test(`#${color}`)) next.primary = `#${color}`;
    for (const s of data.sections) {
      const l = q.get(s.id);
      if (l && s.layouts.includes(l)) next.layouts[s.id] = l;
    }
    setState(next);
  }, [data, defaults]);

  // Apply state to the page and keep the URL shareable.
  useEffect(() => {
    const root = document.documentElement;
    const style = data.styles.find((s) => s.id === state.style);
    if (style) {
      for (const decl of style.vars.split(";")) {
        const i = decl.indexOf(":");
        root.style.setProperty(decl.slice(0, i), decl.slice(i + 1));
      }
    }
    if (state.primary) {
      root.style.setProperty("--c-primary", state.primary);
      root.style.setProperty("--c-primary-fg", textOn(state.primary));
    }

    for (const [id, layout] of Object.entries(state.layouts)) {
      document.querySelectorAll(`[data-sc-section="${id}"] > [data-sc-variant]`).forEach((el) => {
        el.toggleAttribute("data-active", el.getAttribute("data-sc-variant") === layout);
      });
    }

    const q = new URLSearchParams();
    if (state.style !== defaults.style) q.set("style", state.style);
    if (state.primary) q.set("color", state.primary.slice(1).toLowerCase());
    for (const [id, layout] of Object.entries(state.layouts)) {
      if (layout !== defaults.layouts[id]) q.set(id, layout);
    }
    const search = q.toString() ? `?${q}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${search}${window.location.hash}`);
    // Switching language keeps the design.
    document.querySelectorAll<HTMLAnchorElement>("a[data-lang-link]").forEach((a) => {
      a.search = search;
    });
  }, [state, data, defaults]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const applyLook = useCallback(
    (look: ShowcaseData["looks"][number]) =>
      setState((s) => ({ style: look.style, primary: null, layouts: { ...s.layouts, ...look.layouts } })),
    [],
  );

  const activeLook = data.looks.find(
    (l) => !state.primary && l.style === state.style && Object.entries(l.layouts).every(([id, v]) => state.layouts[id] === v),
  )?.id;

  const config = JSON.stringify(
    {
      style: state.style,
      ...(state.primary ? { colors: { primary: state.primary } } : {}),
      sections: Object.fromEntries(Object.entries(state.layouts).map(([id, layout]) => [id, { layout }])),
    },
    null,
    2,
  );

  async function copy(text: string, what: "link" | "config") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt(t.copyLink, text);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition ${
      active ? "border-[#111] bg-[#111] text-white" : "border-[#d4d4d8] bg-white text-[#27272a] hover:border-[#71717a]"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-3 text-sm font-semibold text-white shadow-lg sm:bottom-5 sm:left-5"
        aria-haspopup="dialog"
      >
        <Palette className="size-5" /> {t.open}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t.title}>
          <button type="button" aria-label={t.close} className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          {/* Fixed neutral colours so the panel stays readable whatever style is chosen. */}
          <div className="absolute inset-x-0 bottom-0 flex max-h-[78vh] flex-col rounded-t-2xl bg-white text-[#18181b] shadow-2xl sm:inset-y-0 sm:right-auto sm:left-0 sm:max-h-none sm:w-[380px] sm:rounded-none [font-family:system-ui,'Mukta',sans-serif]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e4e4e7] p-4">
              <div>
                <p className="text-lg font-bold">{t.title}</p>
                <p className="mt-0.5 text-sm text-[#52525b]">{t.intro}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-[#f4f4f5]"
                aria-label={t.close}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#52525b]">{t.looks}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {data.looks.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => applyLook(l)}
                      aria-pressed={activeLook === l.id}
                      className={`rounded-xl border p-2 text-left text-sm transition ${
                        activeLook === l.id ? "border-[#111] ring-2 ring-[#111]" : "border-[#e4e4e7] hover:border-[#71717a]"
                      }`}
                    >
                      <span className="mb-1.5 flex h-6 overflow-hidden rounded-md">
                        {l.swatch.map((c) => (
                          <span key={c} className="flex-1" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="font-medium">{l.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#52525b]">{t.style}</h3>
                <div className="flex flex-wrap gap-2">
                  {data.styles.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setState((st) => ({ ...st, style: s.id }))}
                      aria-pressed={state.style === s.id}
                      className={`inline-flex items-center gap-2 ${chip(state.style === s.id)}`}
                    >
                      <span className="size-3 rounded-full" style={{ background: s.swatch[0] }} />
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="color"
                      value={state.primary ?? data.styles.find((s) => s.id === state.style)?.swatch[0] ?? data.primary}
                      onChange={(e) => setState((st) => ({ ...st, primary: e.target.value }))}
                      className="size-9 cursor-pointer rounded-md border border-[#d4d4d8] bg-white p-0.5"
                    />
                    {t.color}
                  </label>
                  {state.primary && (
                    <button
                      type="button"
                      onClick={() => setState((st) => ({ ...st, primary: null }))}
                      className="text-sm text-[#52525b] underline"
                    >
                      {t.resetColor}
                    </button>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#52525b]">{t.layouts}</h3>
                <div className="space-y-3">
                  {data.sections
                    .filter((s) => s.layouts.length > 1)
                    .map((s) => (
                      <div key={s.id}>
                        <p className="mb-1 text-sm font-medium">{SECTION_NAMES[s.type]?.[data.lang] ?? s.id}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.layouts.map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => {
                                setState((st) => ({ ...st, layouts: { ...st.layouts, [s.id]: l } }));
                                if (s.id !== "navbar" && s.id !== "footer") {
                                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }}
                              aria-pressed={state.layouts[s.id] === l}
                              className={chip(state.layouts[s.id] === l)}
                            >
                              {LAYOUT_NAMES[l]?.[data.lang] ?? l}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#52525b]">{t.share}</h3>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copy(window.location.href, "link")} className={`inline-flex items-center gap-1.5 ${chip(false)}`}>
                    {copied === "link" ? <Check className="size-4" /> : <Link2 className="size-4" />}
                    {copied === "link" ? t.copied : t.copyLink}
                  </button>
                  <button type="button" onClick={() => copy(config, "config")} className={`inline-flex items-center gap-1.5 ${chip(false)}`}>
                    {copied === "config" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied === "config" ? t.copied : t.copyConfig}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#71717a]">{t.configHelp}</p>
              </section>
            </div>

            <div className="border-t border-[#e4e4e7] p-3">
              <button
                type="button"
                onClick={() => setState(defaults)}
                className="inline-flex items-center gap-1.5 text-sm text-[#52525b] hover:text-[#18181b]"
              >
                <RotateCcw className="size-4" /> {t.resetAll}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
