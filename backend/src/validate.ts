import { LANGS } from "@/lib/i18n";
import { parseSite, SiteConfigError } from "@/lib/site";
import { PRESETS } from "@/presets";
import { FRAME, SECTIONS } from "@/sections";
import { STYLES } from "@/styles";
import { HttpError } from "./db";

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Same checks as every website build. Returns warnings (e.g. sample reviews still in place). */
export function validateConfig(slug: string, config: unknown): string[] {
  try {
    return parseSite(slug, config, `site "${slug}"`).warnings;
  } catch (e) {
    if (e instanceof SiteConfigError) throw new HttpError(422, e.message.trim());
    throw e;
  }
}

/** Everything the admin panel needs to build its forms. */
export function meta() {
  return {
    languages: LANGS,
    styles: Object.values(STYLES).map((s) => ({ id: s.id, label: s.label, description: s.description, colors: s.colors })),
    industries: Object.values(PRESETS).map((p) => ({
      id: p.id,
      label: p.label,
      defaultStyle: p.defaultStyle,
      order: p.order,
      mustReplace: p.mustReplace,
      looks: p.looks.map((l) => ({ id: l.id, name: l.name, style: l.style, layouts: l.layouts })),
      sections: Object.fromEntries(Object.entries(p.sections).map(([id, data]) => [id, data])),
    })),
    sectionTypes: Object.fromEntries(
      [...Object.values(SECTIONS), FRAME.navbar, FRAME.footer].map((d) => [d.type, { layouts: Object.keys(d.layouts) }]),
    ),
  };
}

export type NewSiteInput = {
  slug: string;
  industry: string;
  languages: string[];
  style?: string;
  look?: string;
  business: Record<string, unknown>;
  /** Optional "Copy setup" JSON from a showcase demo: { style, colors?, sections: { id: { layout } } }. */
  setup?: { style?: string; colors?: Record<string, string>; sections?: Record<string, { layout?: string }> };
};

/** A new draft: preset content + the client's business details + the chosen look. */
export function buildNewConfig(input: NewSiteInput): Record<string, unknown> {
  if (!SLUG.test(input.slug ?? "")) throw new HttpError(422, "Site name must be lowercase letters, numbers and dashes, e.g. patil-tours");
  const preset = PRESETS[input.industry];
  if (!preset) throw new HttpError(422, `Unknown industry "${input.industry}"`);
  const look = input.look ? preset.looks.find((l) => l.id === input.look) : undefined;
  if (input.look && !look) throw new HttpError(422, `Unknown look "${input.look}"`);

  const sections: Record<string, Record<string, unknown>> = {};
  for (const [id, layout] of Object.entries(look?.layouts ?? {})) sections[id] = { layout };
  for (const [id, s] of Object.entries(input.setup?.sections ?? {})) if (s?.layout) sections[id] = { ...sections[id], layout: s.layout };

  const config: Record<string, unknown> = {
    industry: preset.id,
    style: input.setup?.style ?? input.style ?? look?.style ?? preset.defaultStyle,
    languages: input.languages?.length ? input.languages : ["mr", "en"],
    ...(input.setup?.colors ? { colors: input.setup.colors } : {}),
    business: input.business,
    sections,
  };
  validateConfig(input.slug, config);
  return config;
}
