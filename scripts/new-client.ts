// Creates clients/<slug>/site.json from an industry preset.
// Usage: npm run new-client -- <slug> [--industry travel] [--style warm] [--langs mr,en]
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { LANGS } from "@/lib/i18n";
import { CLIENTS_DIR } from "@/lib/site";
import { PRESETS } from "@/presets";
import { STYLES } from "@/styles";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    industry: { type: "string", default: "travel" },
    style: { type: "string" },
    langs: { type: "string", default: "mr,en" },
  },
});

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

const slug = positionals[0];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  die("Give a slug in lowercase-with-dashes, e.g. npm run new-client -- patil-tours --industry travel");
}
const preset = PRESETS[values.industry] ?? die(`Unknown industry. Available: ${Object.keys(PRESETS).join(", ")}`);
const style = values.style ?? preset.defaultStyle;
if (!STYLES[style]) die(`Unknown style. Available: ${Object.keys(STYLES).join(", ")}`);
const langs = values.langs.split(",").map((l) => l.trim());
const bad = langs.filter((l) => !(LANGS as readonly string[]).includes(l));
if (bad.length) die(`Unknown language(s) ${bad.join(", ")}. Available: ${LANGS.join(", ")}`);

const dir = path.join(CLIENTS_DIR, slug);
if (existsSync(dir)) die(`clients/${slug} already exists.`);
mkdirSync(path.join(dir, "images"), { recursive: true });

const config = {
  industry: preset.id,
  style,
  languages: langs,
  siteUrl: `https://${slug}.vercel.app`,
  business: {
    name: { mr: "व्यवसायाचे नाव", en: "Business Name" },
    tagline: { mr: "एका ओळीत तुमच्याबद्दल", en: "One line about the business" },
    phone: "+91 90000 00000",
    address: { mr: "पत्ता", en: "Address" },
  },
  sections: {},
};

writeFileSync(path.join(dir, "site.json"), JSON.stringify(config, null, 2) + "\n");
console.log(`✔ Created clients/${slug}/site.json (${preset.label}, ${STYLES[style].label} style)

Next:
  1. Fill in business details in clients/${slug}/site.json
  2. Replace the sample ${preset.mustReplace.join(" and ")} with the client's real data
  3. Put photos in clients/${slug}/images/ and reference them as "images/photo.jpg"
  4. Preview: CLIENT=${slug} npm run dev`);
