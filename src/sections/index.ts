import { about } from "./about";
import { contact } from "./contact";
import { cta } from "./cta";
import { enquiry } from "./enquiry";
import { fare } from "./fare";
import { faq } from "./faq";
import { features } from "./features";
import { fleet } from "./fleet";
import { footer } from "./footer";
import { gallery } from "./gallery";
import { hero } from "./hero";
import { navbar } from "./navbar";
import { packages } from "./packages";
import { routes } from "./routes";
import { stats } from "./stats";
import { testimonials } from "./testimonials";
import type { SectionDef } from "./types";

/** Content sections that can appear in a page's `order`. */
export const SECTIONS: Record<string, SectionDef> = Object.fromEntries(
  [hero, about, fare, routes, packages, fleet, features, stats, gallery, testimonials, faq, cta, enquiry, contact].map((s) => [s.type, s as SectionDef]),
);

/** Page frame, configured under `sections.navbar` / `sections.footer`. */
export const FRAME = { navbar: navbar as SectionDef, footer: footer as SectionDef };
