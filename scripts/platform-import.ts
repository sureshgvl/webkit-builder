// Copies sites from clients/<slug>/ into the platform: photos → Cloudflare R2, settings → Supabase.
//
//   npx tsx scripts/platform-import.ts demo-cab demo-travel \
//     --status published --subdomain --domain demo-cab=cab.example.in [--dry-run]
//
// Env (never commit these): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   R2_ACCOUNT_ID (or R2_ENDPOINT), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
//   PLATFORM_DOMAIN (for --subdomain: <slug>.<PLATFORM_DOMAIN>),
//   WEBSITE_URL + REVALIDATE_SECRET (optional: refresh the live cache after import).
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS_DIR, parseSite, readSiteJson, SiteConfigError } from "@/lib/site";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };

const { positionals: slugs, values: opt } = parseArgs({
  allowPositionals: true,
  options: {
    status: { type: "string", default: "draft" },
    subdomain: { type: "boolean", default: false },
    domain: { type: "string", multiple: true, default: [] },
    "dry-run": { type: "boolean", default: false },
  },
});

const env = process.env;
const dry = opt["dry-run"];
function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
if (!slugs.length) die("Give at least one client slug, e.g. demo-cab");
if (!["draft", "published", "suspended"].includes(opt.status!)) die("--status must be draft, published or suspended");
const need = (k: string) => env[k] || (dry ? `<${k}>` : die(`Missing environment variable ${k}`));

const extraDomains = new Map<string, string[]>();
for (const d of opt.domain ?? []) {
  const [slug, host] = d.split("=");
  if (!slug || !host || !/^[a-z0-9.-]+$/.test(host.toLowerCase())) die(`--domain must look like slug=host, got "${d}"`);
  extraDomains.set(slug, [...(extraDomains.get(slug) ?? []), host.toLowerCase().replace(/^www\./, "")]);
}

// ---------------------------------------------------------------- Supabase (PostgREST, service key)

const supabaseUrl = String(need("SUPABASE_URL")).replace(/\/$/, "");
const serviceKey = String(need("SUPABASE_SERVICE_ROLE_KEY"));

async function rest<T>(method: string, pathAndQuery: string, body?: unknown, prefer?: string): Promise<T> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${pathAndQuery}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${pathAndQuery.split("?")[0]} → ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ---------------------------------------------------------------- R2 (S3 API)

const bucket = String(need("R2_BUCKET"));
const s3 = dry
  ? undefined
  : new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT ?? `https://${need("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: String(need("R2_ACCESS_KEY_ID")), secretAccessKey: String(need("R2_SECRET_ACCESS_KEY")) },
      forcePathStyle: true,
      // R2 compatibility: only send/validate checksums when the operation requires them.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

function listFiles(dir: string): string[] {
  try {
    return readdirSync(dir).flatMap((name) => {
      const p = path.join(dir, name);
      return statSync(p).isDirectory() ? listFiles(p) : [p];
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------- import

async function importSite(slug: string) {
  console.log(`\n▶ ${slug}`);
  const raw = readSiteJson(slug);
  parseSite(slug, raw); // same validation as every build; throws with a clear message

  // 1. Photos
  const clientDir = path.join(CLIENTS_DIR, slug);
  const files = listFiles(path.join(clientDir, "images")).filter((f) => TYPES[path.extname(f).toLowerCase()]);
  for (const file of files) {
    const key = `sites/${slug}/${path.relative(clientDir, file).split(path.sep).join("/")}`;
    if (!dry) {
      await s3!.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: readFileSync(file),
          ContentType: TYPES[path.extname(file).toLowerCase()],
          CacheControl: "public, max-age=86400",
        }),
      );
    }
  }
  console.log(`  ${dry ? "would upload" : "uploaded"} ${files.length} image(s) to r2://${bucket}/sites/${slug}/`);

  // 2. Site row (insert or update by slug)
  const row = { slug, config: raw, status: opt.status, ...(opt.status === "published" ? { published_at: new Date().toISOString() } : {}) };
  let siteId = "<site-id>";
  if (!dry) {
    const [saved] = await rest<{ id: string }[]>("POST", "sites?on_conflict=slug&select=id", row, "resolution=merge-duplicates,return=representation");
    siteId = saved.id;
  }
  console.log(`  ${dry ? "would save" : "saved"} site (${opt.status})${dry ? "" : ` id ${siteId}`}`);

  // 3. Web addresses
  const hosts = [
    ...(opt.subdomain ? [`${slug}.${String(need("PLATFORM_DOMAIN")).toLowerCase()}`] : []),
    ...(extraDomains.get(slug) ?? []),
  ];
  for (const host of hosts) {
    if (dry) {
      console.log(`  would add ${host}`);
      continue;
    }
    const existing = await rest<{ site_id: string }[]>("GET", `domains?domain=eq.${encodeURIComponent(host)}&select=site_id`);
    if (existing.length && existing[0].site_id !== siteId) die(`${host} already belongs to another site; not moved`);
    if (existing.length) {
      console.log(`  ${host} already linked`);
      continue;
    }
    const primary = await rest<unknown[]>("GET", `domains?site_id=eq.${siteId}&is_primary=is.true&select=domain`);
    await rest("POST", "domains", { domain: host, site_id: siteId, kind: opt.subdomain && host.endsWith(`.${env.PLATFORM_DOMAIN}`) ? "subdomain" : "custom", is_primary: primary.length === 0 }, "return=minimal");
    console.log(`  added ${host}${primary.length === 0 ? " (primary)" : ""}`);
  }

  // 4. Refresh the live cache for those addresses
  if (!dry && hosts.length && env.WEBSITE_URL && env.REVALIDATE_SECRET) {
    const res = await fetch(`${env.WEBSITE_URL.replace(/\/$/, "")}/api/revalidate/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.REVALIDATE_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ hosts }),
    });
    console.log(`  cache refresh: ${res.ok ? "done" : `failed (${res.status})`}`);
  }
}

async function main() {
  let failed = 0;
  for (const slug of slugs) {
    try {
      await importSite(slug);
    } catch (e) {
      failed++;
      console.error(e instanceof SiteConfigError ? e.message : `✖ ${slug}: ${(e as Error).message}`);
    }
  }
  console.log(failed ? `\n${failed} site(s) failed` : "\nDone");
  process.exit(failed ? 1 : 0);
}

void main();
