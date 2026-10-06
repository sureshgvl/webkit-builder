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
  /** Where the client's own images live ("/client/" in single-site builds, R2 on the platform). */
  assetBase: string;
  /** Path prefix for language links (platform draft previews live under /preview/<token>). */
  pathBase?: string;
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

export function parseSite(
  slug: string,
  raw: unknown,
  file = `clients/${slug}/site.json`,
  options: { assetBase?: string } = {},
): ResolvedSite {
  const parsed = siteSchema.safeParse(raw);
  if (!parsed.success) fail(file, formatIssues(parsed.error.issues));
  const config = parsed.data;

  const preset = PRESETS[config.industry];
  if (!preset) fail(file, `Unknown industry "${config.industry}". Available: ${Object.keys(PRESETS).join(", ")}`);

  const baseStyle = STYLES[config.style];
  if (!baseStyle) fail(file, `Unknown style "${config.style}". Available: ${Object.keys(STYLES).join(", ")}`);
  const style: SiteStyle = { ...baseStyle, colors: { ...baseStyle.colors, ...config.colors } };

  for (const look of preset.looks) {
    if (!STYLES[look.style]) fail(file, `Preset "${preset.id}" look "${look.id}" uses unknown style "${look.style}".`);
    for (const [id, layout] of Object.entries(look.layouts)) {
      const type = (preset.sections[id]?.type as string | undefined) ?? id;
      const def = id === "navbar" || id === "footer" ? FRAME[id] : SECTIONS[type];
      if (!def?.layouts[layout]) {
        fail(file, `Preset "${preset.id}" look "${look.id}": section "${id}" has no layout "${layout}".`);
      }
    }
  }

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

  // The fare calculator uses the fleet's vehicles that have a rate; route prices use the cheapest one.
  const fleetSection = sections.find((x) => x.type === "fleet");
  const fareSection = sections.find((x) => x.type === "fare");
  const fleetRated = ((fleetSection?.data.items ?? []) as { name: unknown; rate?: number; seatsLabel?: string; seats?: unknown }[])
    .filter((v) => typeof v.rate === "number")
    .map((v) => ({ name: v.name, rate: v.rate!, ...(v.seats !== undefined ? { seats: v.seats } : {}) }));
  if (fareSection) {
    if (!fareSection.data.vehicles) fareSection.data.vehicles = fleetRated;
    if (!(fareSection.data.vehicles as unknown[]).length) {
      fail(file, `Section "${fareSection.id}" has no vehicles: add "rate" to the fleet section's vehicles, or list "vehicles" in the fare section.`);
    }
  }
  const routesSection = sections.find((x) => x.type === "routes");
  if (routesSection && !routesSection.data.pricing) {
    const vehicles = (fareSection?.data.vehicles as typeof fleetRated | undefined) ?? fleetRated;
    const wanted = (routesSection.data.vehicle as string | undefined)?.toLowerCase();
    const named = wanted
      ? vehicles.find((v) => JSON.stringify(v.name).toLowerCase().includes(wanted))
      : undefined;
    if (wanted && !named) fail(file, `Section "${routesSection.id}": no fleet vehicle matches "${routesSection.data.vehicle}".`);
    const cheapest = named ?? [...vehicles].sort((a, b) => a.rate - b.rate)[0];
    const f = fareSection?.data as { minKmPerDay?: number; driverAllowancePerDay?: number; gstPercent?: number; gstMode?: string } | undefined;
    if (cheapest) {
      routesSection.data.pricing = {
        minKmPerDay: f?.minKmPerDay ?? 300,
        driverAllowancePerDay: f?.driverAllowancePerDay ?? 300,
        gstPercent: f?.gstPercent ?? 5,
        gstMode: f?.gstMode ?? "add",
        rate: cheapest.rate,
        vehicleName: cheapest.name,
      };
    }
  }

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
    assetBase: options.assetBase ?? "/client/",
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
