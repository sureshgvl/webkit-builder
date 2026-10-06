// Test stand-ins for the backend tests (never used in production):
// - GoTrue (Supabase Auth): users admin@test.in and boss@other.in, password "pw-123456"
// - Cloudflare R2 (S3 API) at /s3/<bucket>/…, files served at /r2/<key>
// - PostgREST: the website's read query, run as the "anon" role on a real Postgres, so Row Level Security applies
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
// Connection comes from the usual PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE variables.
const PG = ["-tA", "-v", "ON_ERROR_STOP=1"];
const sql = (role, q) => execFileSync("psql", [...PG, "-c", `begin; set local role ${role}; ${q}; commit;`], { encoding: "utf8" }).split("\n").filter((l) => l && !/^(BEGIN|SET|COMMIT|INSERT.*)$/.test(l)).join("\n");
const lit = (v) => `$q$${String(v)}$q$`;
const files = new Map();
const log = [];
createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
  const url = new URL(req.url, "http://x");
  log.push(`${req.method} ${url.pathname}`);
  try {
    if (url.pathname.startsWith("/s3/")) { // PUT /s3/<bucket>/<key>
      if (req.method === "PUT") { files.set(url.pathname.split("/").slice(3).join("/"), { body, type: req.headers["content-type"] }); return res.writeHead(200, { ETag: '"x"' }).end(); }
    }
    if (url.pathname.startsWith("/r2/")) {
      const f = files.get(decodeURIComponent(url.pathname.slice(4)));
      return f ? res.writeHead(200, { "Content-Type": f.type }).end(f.body) : res.writeHead(404).end();
    }
    if (url.pathname.startsWith("/s3/") && req.method === "DELETE") { files.delete(url.pathname.split("/").slice(3).join("/")); return res.writeHead(204).end(); }
    if (url.pathname.startsWith("/s3/") && req.method === "GET" && url.searchParams.get("list-type") === "2") {
      const prefix = url.searchParams.get("prefix") || "";
      const items = [...files.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, f]) => `<Contents><Key>${k}</Key><Size>${f.body.length}</Size></Contents>`).join("");
      return res.writeHead(200, { "Content-Type": "application/xml" }).end(`<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>b</Name><Prefix>${prefix}</Prefix><KeyCount>${files.size}</KeyCount><IsTruncated>false</IsTruncated>${items}</ListBucketResult>`);
    }
    // ---- GoTrue look-alike: users admin@test.in / boss@other.in, password "pw-123456"
    if (url.pathname === "/auth/v1/token") {
      const b = JSON.parse(body || "{}");
      if (url.searchParams.get("grant_type") === "password") {
        if (b.password !== "pw-123456" || !["admin@test.in", "boss@other.in"].includes(b.email)) return res.writeHead(400, { "Content-Type": "application/json" }).end('{"error_description":"Invalid login credentials"}');
        return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ access_token: "at:" + b.email + ":" + Date.now(), refresh_token: "rt:" + b.email, expires_in: 3600, user: { email: b.email } }));
      }
      if (url.searchParams.get("grant_type") === "refresh_token" && /^rt:/.test(b.refresh_token || "")) {
        const email = b.refresh_token.slice(3);
        return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ access_token: "at:" + email + ":" + Date.now(), refresh_token: "rt:" + email, expires_in: 3600, user: { email } }));
      }
      return res.writeHead(400, { "Content-Type": "application/json" }).end('{"error_description":"bad grant"}');
    }
    if (url.pathname === "/auth/v1/user") {
      const t = (req.headers.authorization || "").replace(/^Bearer /, "");
      if (!/^at:[^:]+:\d+$/.test(t)) return res.writeHead(401, { "Content-Type": "application/json" }).end('{"msg":"invalid JWT"}');
      return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ email: t.split(":")[1] }));
    }
    // ---- website revalidate look-alike (when the real website isn't running)
    if (url.pathname === "/api/revalidate/") { log.push("revalidate " + body); return res.writeHead(200).end("{}"); }
    if (url.pathname === "/__log") return res.end(JSON.stringify({ log, files: [...files.keys()] }));
    const key = (req.headers.apikey || "").toString();
    const role = key === "service-key" ? "service_role" : key === "anon-key" ? "anon" : null;
    if (!role) return res.writeHead(401).end('{"message":"Invalid API key"}');
    const table = url.pathname.replace("/rest/v1/", "");
    const p = url.searchParams;
    let out;
    if (req.method === "GET" && table === "domains" && p.get("select") === "site:sites(slug,config,updated_at)") {
      out = sql(role, `select coalesce(json_agg(json_build_object('site', (select json_build_object('slug', s.slug, 'config', s.config, 'updated_at', s.updated_at) from public.sites s where s.id = d.site_id))), '[]') from public.domains d where d.domain = ${lit(p.get("domain").replace(/^eq\./, ""))}`);
    } else if (req.method === "GET" && table === "domains" && p.get("select") === "site_id") {
      out = sql(role, `select coalesce(json_agg(json_build_object('site_id', site_id)), '[]') from public.domains where domain = ${lit(p.get("domain").replace(/^eq\./, ""))}`);
    } else if (req.method === "GET" && table === "domains" && p.get("select") === "domain") {
      out = sql(role, `select coalesce(json_agg(json_build_object('domain', domain)), '[]') from public.domains where site_id = ${lit(p.get("site_id").replace(/^eq\./, ""))}::uuid and is_primary`);
    } else if (req.method === "POST" && table === "sites") {
      const r = JSON.parse(body);
      out = sql(role, `with up as (insert into public.sites (slug, config, status, published_at) values (${lit(r.slug)}, ${lit(JSON.stringify(r.config))}::jsonb, ${lit(r.status)}, ${r.published_at ? lit(r.published_at) + "::timestamptz" : "null"}) on conflict (slug) do update set config = excluded.config, status = excluded.status, published_at = coalesce(excluded.published_at, public.sites.published_at) returning id) select json_agg(json_build_object('id', id)) from up`);
    } else if (req.method === "POST" && table === "domains") {
      const r = JSON.parse(body);
      sql(role, `insert into public.domains (domain, site_id, kind, is_primary) values (${lit(r.domain)}, ${lit(r.site_id)}::uuid, ${lit(r.kind)}, ${r.is_primary})`);
      return res.writeHead(201).end();
    } else return res.writeHead(400).end(`{"message":"unsupported ${req.method} ${url.pathname}?${p}"}`);
    res.writeHead(200, { "Content-Type": "application/json" }).end(out || "[]");
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: String(e.stderr || e.message) }));
  }
}).listen(Number(process.env.FAKE_PORT || 3600), () => console.log("fake supabase + r2 on :3600"));
