import { readFileSync } from "node:fs";
import path from "node:path";
import { PRESETS, type Preset } from "@/presets";
import { FRAME, SECTIONS } from "@/sections";
import type { SectionDef } from "@/sections/types";
import { STYLES, type SiteStyle } from "@/styles";
import type { Lang } from "./i18n";
import { siteSchema, type SiteConfig } from "./schema";

export type ResolvedSection = { id: string; type: string; layout: string; data: Record<string, unknown> };

export type ResolvedSite = {
  slug: string;
  config: SiteConfig;
  preset: Preset;
  style: SiteStyle;
  langs: Lang[];
  defaultLang: Lang;
  navbar: ResolvedSection;
  footer: ResolvedSection;
  sections: ResolvedSection[];
  warnings: string[];
};

export class SiteConfigError extends Error {}

export const CLIENTS_DIR = path.join(process.cwd(), "clients");

export function clientSlug(): string {
  return process.env.CLIENT || "demo-travel";
}

function fail(file: string, message: string): never {
  throw new SiteConfigError(`\n✖ ${file}\n  ${message}\n`);
}

function formatIssues(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues.map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n  ");
}

function resolveSection(
  file: string,
  id: string,
  def: SectionDef | undefined,
  presetData: Record<string, unknown> | undefined,
  clientData: Record<string, unknown> | undefined,
): ResolvedSection {
  // Shallow merge: each key the client sets replaces the preset's value for that key,
  // and `null` removes it (e.g. "secondaryCta": null hides the preset's second button).
  const merged: Record<string, unknown> = { ...presetData, ...clientData };
  for (const [k, v] of Object.entries(merged)) if (v === null) delete merged[k];
  const type = (merged.type as string | undefined) ?? id;
  def ??= SECTIONS[type];
  if (!def) {
    fail(file, `Unknown section "${id}" (type "${type}"). Available: ${Object.keys(SECTIONS).join(", ")}`);
  }
  const parsed = def.schema.safeParse(merged);
  if (!parsed.success) {
    fail(file, `Section "${id}" is invalid:\n  ${formatIssues(parsed.error.issues)}`);
  }
  const layouts = Object.keys(def.layouts);
  const layout = (merged.layout as string | undefined) ?? layouts[0];
  if (!layouts.includes(layout)) {
    fail(file, `Section "${id}" has layout "${layout}". Available: ${layouts.join(", ")}`);
  }
  return { id, type, layout, data: parsed.data as Record<string, unknown> };
}

export function parseSite(slug: string, raw: unknown, file = `clients/${slug}/site.json`): ResolvedSite {
  const parsed = siteSchema.safeParse(raw);
  if (!parsed.success) fail(file, formatIssues(parsed.error.issues));
  const config = parsed.data;

  const preset = PRESETS[config.industry];
  if (!preset) fail(file, `Unknown industry "${config.industry}". Available: ${Object.keys(PRESETS).join(", ")}`);

  const baseStyle = STYLES[config.style];
  if (!baseStyle) fail(file, `Unknown style "${config.style}". Available: ${Object.keys(STYLES).join(", ")}`);
  const style: SiteStyle = { ...baseStyle, colors: { ...baseStyle.colors, ...config.colors } };

  const order = config.order ?? preset.order;
  const client = config.sections ?? {};
  const warnings: string[] = [];

  const known = new Set([...order, "navbar", "footer"]);
  for (const id of Object.keys(client)) {
    if (!known.has(id)) warnings.push(`sections.${id} is set but "${id}" is not in the page order, so it is not shown.`);
  }
  if (slug !== "demo-travel" && !slug.startsWith("demo-")) {
    for (const id of preset.mustReplace) {
      if (order.includes(id) && !client[id]?.items) {
        warnings.push(`"${id}" still shows the preset's sample content. Replace sections.${id}.items with the client's real data.`);
      }
    }
  }

  if (!config.siteUrl) {
    warnings.push(`"siteUrl" is not set, so the sitemap and WhatsApp/Facebook share previews are turned off.`);
  }

  const sections = order.map((id) => resolveSection(file, id, undefined, preset.sections[id], client[id]));

  // The enquiry form offers the package names from the packages section.
  const pkgs = sections.find((s) => s.type === "packages");
  const enquiry = sections.find((s) => s.type === "enquiry");
  if (pkgs && enquiry && !enquiry.data.packageNames) {
    enquiry.data.packageNames = (pkgs.data.items as { title: unknown }[]).map((i) => i.title);
  }

  return {
    slug,
    config,
    preset,
    style,
    langs: config.languages,
    defaultLang: config.languages[0],
    navbar: resolveSection(file, "navbar", FRAME.navbar, preset.sections.navbar, client.navbar),
    footer: resolveSection(file, "footer", FRAME.footer, preset.sections.footer, client.footer),
    sections,
    warnings,
  };
}

export function readSiteJson(slug: string): unknown {
  const file = path.join(CLIENTS_DIR, slug, "site.json");
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    fail(`clients/${slug}/site.json`, `File not found. Create it with: npm run new-client -- ${slug}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    fail(`clients/${slug}/site.json`, `Not valid JSON: ${(e as Error).message}`);
  }
}

let cached: ResolvedSite | undefined;

/** The site being built (selected with the CLIENT environment variable). */
export function loadSite(): ResolvedSite {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const slug = clientSlug();
  cached = parseSite(slug, readSiteJson(slug));
  return cached;
}
