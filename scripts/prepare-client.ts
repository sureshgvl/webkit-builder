// Runs before `dev` and `build`: validates the selected client's config
// and copies its images to public/client/ so they are served with the site.
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { CLIENTS_DIR, clientSlug, parseSite, readSiteJson, SiteConfigError } from "@/lib/site";

const slug = clientSlug();

try {
  const site = parseSite(slug, readSiteJson(slug));
  for (const w of site.warnings) console.warn(`⚠ ${w}`);

  const out = path.join(process.cwd(), "public", "client");
  rmSync(out, { recursive: true, force: true });
  const images = path.join(CLIENTS_DIR, slug, "images");
  if (existsSync(images)) cpSync(images, path.join(out, "images"), { recursive: true });

  console.log(`✔ Client "${slug}" (${site.preset.label}, ${site.style.label} style, ${site.langs.join(" + ")})`);
} catch (e) {
  if (e instanceof SiteConfigError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
