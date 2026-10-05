// Validates every client config: npm run validate
import { readdirSync } from "node:fs";
import { CLIENTS_DIR, parseSite, readSiteJson, SiteConfigError } from "@/lib/site";

let failed = 0;
for (const slug of readdirSync(CLIENTS_DIR)) {
  try {
    const site = parseSite(slug, readSiteJson(slug));
    console.log(`✔ ${slug}`);
    for (const w of site.warnings) console.warn(`  ⚠ ${w}`);
  } catch (e) {
    if (!(e instanceof SiteConfigError)) throw e;
    failed++;
    console.error(e.message);
  }
}
process.exit(failed ? 1 : 0);
