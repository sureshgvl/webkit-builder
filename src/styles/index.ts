import { elegant } from "./elegant";
import { modern } from "./modern";
import type { SiteStyle, StyleColors } from "./types";
import { warm } from "./warm";

export type { SiteStyle, StyleColors };

export const STYLES: Record<string, SiteStyle> = { modern, warm, elegant };

/** CSS variables consumed by globals.css (`--color-primary` etc. in Tailwind). */
export function styleVars(style: SiteStyle): string {
  const c = style.colors;
  return [
    `--c-primary:${c.primary}`,
    `--c-primary-fg:${c.primaryFg}`,
    `--c-accent:${c.accent}`,
    `--c-bg:${c.bg}`,
    `--c-surface:${c.surface}`,
    `--c-text:${c.text}`,
    `--c-muted:${c.muted}`,
    `--c-border:${c.border}`,
    `--f-heading:${style.fonts.heading}`,
    `--f-body:${style.fonts.body}`,
    `--r-card:${style.radius}`,
    `--r-btn:${style.buttonRadius}`,
    `--section-py:${style.sectionPaddingY}`,
    `--heading-weight:${style.headingWeight}`,
  ].join(";");
}

/** One Google Fonts stylesheet for the given styles (duplicate families keep the version with most weights). */
export function googleFontsHref(...styles: SiteStyle[]): string {
  const byFamily = new Map<string, string>();
  for (const f of styles.flatMap((s) => s.fonts.google)) {
    const name = f.split(":")[0];
    if ((byFamily.get(name)?.length ?? 0) < f.length) byFamily.set(name, f);
  }
  const families = [...byFamily.values()].map((f) => `family=${f}`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
