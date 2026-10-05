import type { Localized } from "@/lib/i18n";

/** A ready-made combination of style + section layouts, offered in the showcase panel. */
export type Look = {
  id: string;
  name: Localized;
  style: string;
  /** Section id → layout. Sections left out keep the preset's layout. */
  layouts: Record<string, string>;
};

export type Preset = {
  id: string;
  label: string;
  /** Style used by `new-client` when none is given. */
  defaultStyle: string;
  /** schema.org type for search engines, e.g. "TravelAgency", "Dentist". */
  schemaType: string;
  /**
   * Sections whose sample content makes factual claims (reviews, numbers).
   * The build warns until the client config replaces them, so no live site shows made-up reviews.
   */
  mustReplace: string[];
  /** Section ids in page order. */
  order: string[];
  /** Ready-made looks for the showcase panel (first one should match the preset defaults). */
  looks: Look[];
  /** Default content per section id (plus "navbar" / "footer"). Client config overrides it key by key. */
  sections: Record<string, Record<string, unknown>>;
};
