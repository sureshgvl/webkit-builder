import type { ComponentType } from "react";
import type { z } from "zod";
import type { Lang, Localized, UiStrings } from "@/lib/i18n";
import type { Business } from "@/lib/schema";

export type NavLink = { id: string; label: string };

/** Everything a section needs besides its own data. */
export type SectionCtx = {
  lang: Lang;
  langs: Lang[];
  ui: UiStrings;
  business: Business;
  /** Localise a text value into the current language. */
  t: (value: Localized | undefined) => string;
  /** Resolve an image reference from the config into a URL. */
  img: (ref: string | undefined) => string | undefined;
  /** WhatsApp number, digits only with country code (e.g. "919876543210"). */
  waNumber: string;
  /** wa.me link with an optional pre-filled message. */
  wa: (message?: string) => string;
  /** tel: link. */
  tel: string;
  /** Page path for a language ("/" for the default one, "/en/" etc.). */
  langHref: (lang: Lang) => string;
  nav: NavLink[];
};

export type SectionProps<D> = { id: string; data: D; ctx: SectionCtx };

export type SectionDef<S extends z.ZodType = z.ZodType> = {
  type: string;
  schema: S;
  /** First layout is the default. */
  layouts: Record<string, ComponentType<SectionProps<z.infer<S>>>>;
};

export function defineSection<S extends z.ZodType>(def: SectionDef<S>): SectionDef<S> {
  return def;
}
