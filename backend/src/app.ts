import { createServer, type IncomingMessage, type RequestListener, type ServerResponse } from "node:http";
import { Auth } from "./auth";
import { Db, HttpError, type SiteRow, type SiteStatus } from "./db";
import { ImageStore } from "./storage";
import { buildNewConfig, meta, SLUG, validateConfig, type NewSiteInput } from "./validate";
import { VercelDomains } from "./vercel";
import { previewToken, readPreviewToken, refreshHosts } from "./website";

declare const __ADMIN_HTML__: string | undefined;

export type BackendEnv = {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ADMIN_EMAILS: string;
  R2_BUCKET?: string;
  R2_ENDPOINT?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  ASSETS_BASE_URL?: string;
  WEBSITE_URL?: string;
  REVALIDATE_SECRET?: string;
  PREVIEW_SECRET?: string;
  PLATFORM_DOMAIN?: string;
  VERCEL_TOKEN?: string;
  VERCEL_PROJECT_ID?: string;
  VERCEL_TEAM_ID?: string;
  ADMIN_ORIGIN?: string;
};

export function loadEnv(env = process.env): BackendEnv {
  const missing = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "ADMIN_EMAILS"].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  return env as unknown as BackendEnv;
}

const DOMAIN = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function createBackend(env: BackendEnv, adminHtml?: string) {
  const db = new Db(env.DATABASE_URL);
  const auth = new Auth(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, new Set(env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)));
  const images =
    env.R2_BUCKET && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.ASSETS_BASE_URL
      ? new ImageStore(
          env.R2_BUCKET,
          env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          env.R2_ACCESS_KEY_ID,
          env.R2_SECRET_ACCESS_KEY,
          `${env.ASSETS_BASE_URL.replace(/\/$/, "")}`,
        )
      : undefined;
  const vercel = env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID ? new VercelDomains(env.VERCEL_TOKEN, env.VERCEL_PROJECT_ID, env.VERCEL_TEAM_ID) : undefined;

  /** Live addresses of a site get refreshed after any change that visitors would see. */
  async function refresh(site: SiteRow) {
    const hosts = (await db.domains(site.id)).map((d) => d.domain);
    return refreshHosts(env.WEBSITE_URL, env.REVALIDATE_SECRET, hosts);
  }

  async function siteDetail(slug: string) {
    const site = await db.getSite(slug);
    const [domains, versions] = await Promise.all([db.domains(site.id), db.versions(site.id)]);
    let warnings: string[] = [];
    try {
      warnings = validateConfig(slug, site.config);
    } catch (e) {
      warnings = [`Saved config has errors: ${(e as Error).message}`];
    }
    return { site, domains, versions, warnings };
  }

  const handler: RequestListener = async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    // The admin page may be served from another origin (e.g. admin.<company domain>).
    if (env.ADMIN_ORIGIN) {
      res.setHeader("Access-Control-Allow-Origin", env.ADMIN_ORIGIN);
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Filename, X-Kind");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Vary", "Origin");
      if (req.method === "OPTIONS") return res.writeHead(204).end();
    }
    try {
      // ---------------------------------------------------------- public
      if (req.method === "GET" && path === "/health") {
        await db.pool.query("select 1");
        return json(res, 200, { ok: true, images: Boolean(images), vercel: Boolean(vercel), website: Boolean(env.WEBSITE_URL) });
      }
      if (req.method === "GET" && (path === "/" || path === "/admin")) {
        return res
          .writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self'; frame-ancestors 'none'",
            "X-Frame-Options": "DENY",
            "Cache-Control": "no-store",
          })
          .end(adminHtml ?? "Admin page not built");
      }
      if (req.method === "POST" && path === "/api/login") {
        const b = await readJson<{ email: string; password: string }>(req);
        return json(res, 200, await auth.login(b.email?.trim(), b.password));
      }
      if (req.method === "POST" && path === "/api/refresh") {
        return json(res, 200, await auth.refresh((await readJson<{ refresh_token: string }>(req)).refresh_token));
      }
      // Draft config for the website's preview page (signed, expiring token instead of a login).
      if (req.method === "GET" && path === "/api/preview-config") {
        if (!env.PREVIEW_SECRET) throw new HttpError(404, "Preview is not configured");
        const slug = readPreviewToken(env.PREVIEW_SECRET, url.searchParams.get("token") ?? "");
        if (!slug) throw new HttpError(403, "This preview link has expired");
        const site = await db.getSite(slug);
        return json(res, 200, { slug, config: site.config, assetBase: env.ASSETS_BASE_URL ? `${env.ASSETS_BASE_URL.replace(/\/$/, "")}/sites/${slug}/` : `/dev-assets/${slug}/` });
      }

      // ---------------------------------------------------------- admin (logged in)
      if (!path.startsWith("/api/")) throw new HttpError(404, "Not found");
      const admin = await auth.verify(req.headers.authorization);

      if (req.method === "GET" && path === "/api/me") return json(res, 200, { email: admin });
      if (req.method === "GET" && path === "/api/meta") return json(res, 200, { ...meta(), platformDomain: env.PLATFORM_DOMAIN ?? null });

      if (req.method === "GET" && path === "/api/sites") {
        const sites = await db.listSites();
        return json(
          res,
          200,
          sites.map((s) => ({
            slug: s.slug,
            status: s.status,
            plan: s.plan,
            industry: s.config.industry,
            name: (s.config.business as { name?: unknown } | undefined)?.name ?? s.slug,
            updated_at: s.updated_at,
            published_at: s.published_at,
            expires_at: s.expires_at,
            domains: s.domains,
          })),
        );
      }
      if (req.method === "POST" && path === "/api/sites") {
        const input = await readJson<NewSiteInput>(req);
        const config = buildNewConfig(input);
        const sub = env.PLATFORM_DOMAIN ? `${input.slug}.${env.PLATFORM_DOMAIN.toLowerCase()}` : undefined;
        await db.createSite(input.slug, config, admin, sub);
        return json(res, 201, await siteDetail(input.slug));
      }

      const m = /^\/api\/sites\/([a-z0-9-]+)(?:\/(.*))?$/.exec(path);
      if (!m || !SLUG.test(m[1])) throw new HttpError(404, "Not found");
      const [, slug, rest = ""] = m;

      if (req.method === "GET" && rest === "") return json(res, 200, await siteDetail(slug));

      if (req.method === "PUT" && rest === "config") {
        const b = await readJson<{ config: unknown; note?: string }>(req);
        const warnings = validateConfig(slug, b.config);
        const site = await db.saveConfig(slug, b.config, admin, b.note?.slice(0, 200));
        const refreshed = site.status === "published" ? await refresh(site) : false;
        return json(res, 200, { ...(await siteDetail(slug)), warnings, refreshed });
      }

      if (req.method === "POST" && rest === "status") {
        const { status } = await readJson<{ status: SiteStatus }>(req);
        if (!["draft", "published", "suspended"].includes(status)) throw new HttpError(422, "status must be draft, published or suspended");
        if (status === "published") validateConfig(slug, (await db.getSite(slug)).config);
        const site = await db.setStatus(slug, status);
        const refreshed = await refresh(site);
        return json(res, 200, { ...(await siteDetail(slug)), refreshed });
      }

      const ver = /^versions\/(\d+)$/.exec(rest);
      if (req.method === "GET" && ver) {
        const site = await db.getSite(slug);
        return json(res, 200, await db.version(site.id, Number(ver[1])));
      }
      if (req.method === "POST" && rest === "restore") {
        const { versionId } = await readJson<{ versionId: number }>(req);
        const site = await db.getSite(slug);
        const v = await db.version(site.id, Number(versionId));
        validateConfig(slug, v.config);
        const saved = await db.saveConfig(slug, v.config, admin, `restored version ${v.id}`);
        if (saved.status === "published") await refresh(saved);
        return json(res, 200, await siteDetail(slug));
      }

      if (req.method === "POST" && rest === "preview") {
        if (!env.PREVIEW_SECRET || !env.WEBSITE_URL) throw new HttpError(501, "Set PREVIEW_SECRET and WEBSITE_URL to enable previews");
        await db.getSite(slug);
        return json(res, 200, { url: `${env.WEBSITE_URL.replace(/\/$/, "")}/preview/${previewToken(env.PREVIEW_SECRET, slug)}/` });
      }

      // ---- domains
      if (req.method === "POST" && rest === "domains") {
        const b = await readJson<{ domain: string }>(req);
        const domain = String(b.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
        if (!DOMAIN.test(domain)) throw new HttpError(422, "Enter a domain like patiltours.in");
        const site = await db.getSite(slug);
        const kind = env.PLATFORM_DOMAIN && domain.endsWith(`.${env.PLATFORM_DOMAIN.toLowerCase()}`) ? "subdomain" : "custom";
        await db.addDomain(site.id, domain, kind);
        let vercelError: string | null = null;
        if (kind === "custom" && vercel) {
          vercelError = await vercel.add(domain);
          if (!vercelError) await vercel.add(`www.${domain}`); // www → same site
        }
        if (site.status === "published") await refresh(site);
        return json(res, 201, { ...(await siteDetail(slug)), vercelError, vercel: Boolean(vercel) });
      }
      const dm = /^domains\/([a-z0-9.-]+)(\/check)?$/.exec(rest);
      if (dm && req.method === "GET" && dm[2]) {
        if (!vercel) return json(res, 200, { configured: false, verified: false, instructions: [], error: "Vercel API not configured; add the domain in Vercel by hand" });
        const check = await vercel.check(dm[1]);
        if (check.configured && check.verified) await db.setDomainVerified(dm[1], true);
        return json(res, 200, check);
      }
      if (dm && req.method === "DELETE" && !dm[2]) {
        const site = await db.getSite(slug);
        const removed = await db.removeDomain(site.id, dm[1]);
        if (removed.kind === "custom" && vercel) {
          await vercel.remove(removed.domain);
          await vercel.remove(`www.${removed.domain}`);
        }
        await refreshHosts(env.WEBSITE_URL, env.REVALIDATE_SECRET, [removed.domain]);
        return json(res, 200, await siteDetail(slug));
      }

      // ---- images
      if (rest === "images" || rest.startsWith("images/")) {
        if (!images) throw new HttpError(501, "Image storage (R2) is not configured");
        if (req.method === "GET" && rest === "images") return json(res, 200, await images.list(slug));
        if (req.method === "POST" && rest === "images") {
          await db.getSite(slug);
          const name = decodeURIComponent(String(req.headers["x-filename"] ?? "photo"));
          const kind = req.headers["x-kind"] === "logo" ? "logo" : "photo";
          return json(res, 201, await images.upload(slug, name, await readBody(req, 11 * 1024 * 1024), kind));
        }
        if (req.method === "DELETE") {
          await images.remove(slug, decodeURIComponent(rest));
          return json(res, 200, { removed: rest });
        }
      }

      throw new HttpError(404, "Not found");
    } catch (e) {
      if (e instanceof HttpError) return json(res, e.status, { error: e.message });
      if (e instanceof SyntaxError) return json(res, 400, { error: "Invalid JSON" });
      console.error(e);
      return json(res, 500, { error: "Internal error" });
    }
  };

  return { handler, server: createServer(handler), db };
}

function readBody(req: IncomingMessage, limit = 2 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req
      .on("data", (c: Buffer) => {
        size += c.length;
        if (size > limit) {
          reject(new HttpError(413, "Request too large"));
          req.destroy();
        } else chunks.push(c);
      })
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  return JSON.parse((await readBody(req)).toString("utf8") || "{}") as T;
}

function json(res: ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return;
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(body));
}

export function bundledAdminHtml(): string | undefined {
  return typeof __ADMIN_HTML__ === "string" ? __ADMIN_HTML__ : undefined;
}
