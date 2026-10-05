import { z } from "zod";
import { LANGS } from "./i18n";

/** "Same text everywhere" or `{ "mr": "...", "en": "..." }`. */
export const localized = z.union([
  z.string(),
  z.object({ mr: z.string().optional(), en: z.string().optional() }).strict(),
]);

/** Path inside clients/<slug>/ (e.g. "images/hero.jpg"), a site path ("/placeholders/x.svg") or a full URL. */
export const imageRef = z.string().min(1);

export const phone = z
  .string()
  .regex(/^\+?[\d\s-]{10,16}$/, "Use a phone number like +91 98765 43210");

/** Fields every section accepts on top of its own content. */
export const baseSection = z.object({
  /** Section type when the id is not a type name, e.g. id "offers" with type "packages". */
  type: z.string().optional(),
  layout: z.string().optional(),
  tone: z.enum(["default", "surface", "primary"]).optional(),
  /** Label in the navbar. Leave empty to keep the section out of the menu. */
  navLabel: localized.optional(),
});

export const businessSchema = z
  .object({
    name: localized,
    tagline: localized.optional(),
    phone,
    /** Defaults to `phone`. */
    whatsapp: phone.optional(),
    email: z.string().email().optional(),
    address: localized.optional(),
    /** What to search on Google Maps, e.g. "Sahyadri Holidays, FC Road, Pune". Defaults to the address. */
    mapQuery: z.string().optional(),
    hours: localized.optional(),
    logo: imageRef.optional(),
    socials: z
      .object({
        instagram: z.string().url().optional(),
        facebook: z.string().url().optional(),
        youtube: z.string().url().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const siteSchema = z
  .object({
    $schema: z.string().optional(),
    industry: z.string(),
    style: z.string(),
    /** First language is the default one, served at "/". */
    languages: z.array(z.enum(LANGS)).min(1),
    /** Final URL, e.g. "https://sahyadriholidays.in". Needed for sitemap and share previews. */
    siteUrl: z.string().url().optional(),
    /** Override style colours for the client's brand, e.g. { "primary": "#1D4ED8" }. */
    colors: z
      .object({
        primary: z.string(),
        primaryFg: z.string(),
        accent: z.string(),
        bg: z.string(),
        surface: z.string(),
        text: z.string(),
        muted: z.string(),
        border: z.string(),
      })
      .partial()
      .strict()
      .optional(),
    business: businessSchema,
    /** Section ids in page order. Defaults to the industry preset's order. */
    order: z.array(z.string()).optional(),
    /** Per-section overrides. Each key replaces the preset's value for that key. */
    sections: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
    seo: z
      .object({
        title: localized.optional(),
        description: localized.optional(),
        keywords: z.array(z.string()).optional(),
        /** Share preview image. Defaults to the hero image. */
        image: imageRef.optional(),
      })
      .strict()
      .optional(),
    analytics: z.object({ ga4: z.string().regex(/^G-[A-Z0-9]+$/).optional() }).strict().optional(),
  })
  .strict();

export type SiteConfig = z.infer<typeof siteSchema>;
export type Business = z.infer<typeof businessSchema>;
