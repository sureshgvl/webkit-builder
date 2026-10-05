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

export function googleFontsHref(style: SiteStyle): string {
  const families = style.fonts.google.map((f) => `family=${f}`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
