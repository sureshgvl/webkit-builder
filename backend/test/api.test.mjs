// API test for the backend. Needs: the backend on :4000, backend/test/fakes.mjs on :3600 and the platform website on
// :3000 (see .github/workflows/ci.yml for the exact environment).
import { createRequire } from "node:module"; const sharp = createRequire(import.meta.url)("sharp");
import { request } from "node:http";
const B = "http://127.0.0.1:4000";
/** GET a page from the platform website as if visiting <host>. */
const site = (host, path = "/") => new Promise((resolve, reject) => {
  request({ host: "127.0.0.1", port: 3000, path, headers: { host } }, (res) => {
    let body = ""; res.on("data", (c) => (body += c)); res.on("end", () => resolve({ status: res.statusCode, body }));
  }).on("error", reject).end();
});
let ok = 0, bad = 0;
const t = (name, cond, extra = "") => { if (cond) ok++; else { bad++; console.log("✖", name, extra); } };
async function call(method, path, body, token, headers = {}) {
  const res = await fetch(B + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !(body instanceof Buffer) ? { "Content-Type": "application/json" } : {}), ...headers }, body: body instanceof Buffer ? body : body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null) };
}
// auth
t("wrong password", (await call("POST", "/api/login", { email: "admin@test.in", password: "x" })).status === 401);
t("not admin", (await call("POST", "/api/login", { email: "boss@other.in", password: "pw-123456" })).status === 403);
const login = await call("POST", "/api/login", { email: "admin@test.in", password: "pw-123456" });
t("login", login.status === 200 && login.body.access_token, JSON.stringify(login));
const T = login.body.access_token;
t("no token", (await call("GET", "/api/sites")).status === 401);
t("bad token", (await call("GET", "/api/sites", null, "garbage")).status === 401);
const r = await call("POST", "/api/refresh", { refresh_token: login.body.refresh_token });
t("refresh", r.status === 200 && r.body.email === "admin@test.in");
t("me", (await call("GET", "/api/me", null, T)).body.email === "admin@test.in");
const meta = (await call("GET", "/api/meta", null, T)).body;
t("meta", meta.industries.length && meta.styles.length && meta.platformDomain === "localhost");
const travel = meta.industries.find((i) => i.id === "travel");
// create
const business = { name: { mr: "टेस्ट टूर्स", en: "Test Tours" }, phone: "+91 90000 00001" };
t("bad slug", (await call("POST", "/api/sites", { slug: "Bad Slug", industry: "travel", languages: ["mr", "en"], business }, T)).status === 422);
t("bad industry", (await call("POST", "/api/sites", { slug: "x-1", industry: "nope", languages: ["mr"], business }, T)).status === 422);
t("bad business", (await call("POST", "/api/sites", { slug: "x-2", industry: "travel", languages: ["mr"], business: { name: "X", phone: "12" } }, T)).status === 422);
const c = await call("POST", "/api/sites", { slug: "test-tours", industry: "travel", look: travel.looks[1].id, languages: ["mr", "en"], business }, T);
t("create", c.status === 201 && c.body.domains[0]?.domain === "test-tours.localhost" && c.body.site.status === "draft", JSON.stringify(c.body).slice(0, 300));
t("create version labelled", c.body.versions[0]?.note === "created" && c.body.versions[0]?.created_by === "admin@test.in");
t("duplicate", (await call("POST", "/api/sites", { slug: "test-tours", industry: "travel", languages: ["mr"], business }, T)).status === 409);
await call("POST", "/api/sites", { slug: "other-site", industry: "travel", languages: ["en"], business: { name: "Other", phone: "+91 90000 00002" } }, T);
const list = (await call("GET", "/api/sites", null, T)).body;
t("list", list.length === 2 && list.some((s) => s.slug === "test-tours" && s.name.en === "Test Tours"));
t("unknown site 404", (await call("GET", "/api/sites/nope", null, T)).status === 404);
// edit
const cfg = c.body.site.config;
t("invalid config 422", (await call("PUT", "/api/sites/test-tours/config", { config: { ...cfg, style: "nope" } }, T)).status === 422);
const saved = await call("PUT", "/api/sites/test-tours/config", { config: { ...cfg, business: { ...cfg.business, tagline: { mr: "पुणे", en: "Pune taxi" } } }, note: "tagline" }, T);
t("save", saved.status === 200 && saved.body.site.config.business.tagline.en === "Pune taxi" && saved.body.versions[0].note === "tagline" && saved.body.refreshed === false);
// images
const png = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#3366cc" } }).png().toBuffer();
const up = await call("POST", "/api/sites/test-tours/images", png, T, { "X-Filename": encodeURIComponent("My Innova Photo.PNG"), "Content-Type": "image/png" });
t("upload", up.status === 201 && up.body.ref === "images/my-innova-photo.webp", JSON.stringify(up));
const img = await fetch(up.body.url.split("?")[0]); const meta2 = await sharp(Buffer.from(await img.arrayBuffer())).metadata();
t("resized webp", meta2.format === "webp" && meta2.width === 1600, JSON.stringify(meta2.width));
const logo = await call("POST", "/api/sites/test-tours/images", png, T, { "X-Filename": "l.png", "X-Kind": "logo" });
t("logo", logo.body.ref === "images/logo.webp");
t("not an image", (await call("POST", "/api/sites/test-tours/images", Buffer.from("hello"), T, { "X-Filename": "a.png" })).status === 415);
t("list images", (await call("GET", "/api/sites/test-tours/images", null, T)).body.length === 2);
t("delete traversal", (await call("DELETE", "/api/sites/test-tours/images/..%2F..%2Fother-site%2Fx", null, T)).status !== 200);
t("delete image", (await call("DELETE", "/api/sites/test-tours/images/logo.webp", null, T)).status === 200);
t("list after delete", (await call("GET", "/api/sites/test-tours/images", null, T)).body.length === 1);
// preview
const pv = await call("POST", "/api/sites/test-tours/preview", null, T);
t("preview url", pv.status === 200 && pv.body.url.startsWith("http://127.0.0.1:3000/preview/test-tours."), JSON.stringify(pv));
const page = await (await fetch(pv.body.url)).text();
t("preview renders draft", page.includes("Test Tours") || page.includes("टेस्ट टूर्स"));
t("preview noindex", /noindex/.test(page));
t("preview lang links keep token", page.includes(`${new URL(pv.body.url).pathname}en/`));
const en = await fetch(pv.body.url + "en/"); const enHtml = await en.text(); t("preview en", en.status === 200 && enHtml.includes("Test Tours") && !enHtml.includes("टेस्ट टूर्स"));
const forged = pv.body.url.replace(/\.[A-Za-z0-9_-]+\/$/, ".AAAA/");
t("forged preview", !(await (await fetch(forged)).text()).includes("Test Tours"));
t("preview-config forged 403", (await call("GET", "/api/preview-config?token=test-tours.9999999999.AAAA")).status === 403);
t("draft not live", (await fetch("http://127.0.0.1:3000/", { headers: { host: "test-tours.localhost" } })).status === 404);
// publish
const pub = await call("POST", "/api/sites/test-tours/status", { status: "published" }, T);
t("publish", pub.status === 200 && pub.body.site.status === "published" && pub.body.site.published_at && pub.body.refreshed === true, JSON.stringify(pub.body).slice(0, 200));
t("published is live", (await site("test-tours.localhost", "/en/")).body.includes("Test Tours"));
t("www shows the same site", (await site("www.test-tours.localhost", "/en/")).body.includes("Test Tours"));
t("bad status", (await call("POST", "/api/sites/test-tours/status", { status: "gone" }, T)).status === 422);
const save2 = await call("PUT", "/api/sites/test-tours/config", { config: saved.body.site.config }, T);
t("save unchanged published refreshes", save2.body.refreshed === true);
// domains
t("bad domain", (await call("POST", "/api/sites/test-tours/domains", { domain: "not a domain" }, T)).status === 422);
const d1 = await call("POST", "/api/sites/test-tours/domains", { domain: "https://www.TestTours.in/" }, T);
t("add domain", d1.status === 201 && d1.body.domains.some((d) => d.domain === "testtours.in" && d.kind === "custom" && !d.is_primary), JSON.stringify(d1.body).slice(0, 300));
t("domain owned elsewhere", (await call("POST", "/api/sites/other-site/domains", { domain: "testtours.in" }, T)).status === 409);
t("already added", (await call("POST", "/api/sites/test-tours/domains", { domain: "testtours.in" }, T)).status === 409);
t("check without vercel", (await call("GET", "/api/sites/test-tours/domains/testtours.in/check", null, T)).body.configured === false);
t("custom domain live", (await site("testtours.in", "/en/")).body.includes("Test Tours"));
const rm = await call("DELETE", "/api/sites/test-tours/domains/test-tours.localhost", null, T);
t("removed address not live", (await site("test-tours.localhost", "/en/")).status === 404);
t("remove primary → custom becomes primary", rm.status === 200 && rm.body.domains.length === 1 && rm.body.domains[0].is_primary);
t("remove unknown", (await call("DELETE", "/api/sites/test-tours/domains/zzz.in", null, T)).status === 404);
// history
const det = (await call("GET", "/api/sites/test-tours", null, T)).body;
const first = det.versions.at(-1);
const v = await call("GET", `/api/sites/test-tours/versions/${first.id}`, null, T);
t("view version", v.status === 200 && v.body.config.business.tagline === undefined);
t("other site's version hidden", (await call("GET", `/api/sites/other-site/versions/${first.id}`, null, T)).status === 404);
const rs = await call("POST", "/api/sites/test-tours/restore", { versionId: first.id }, T);
t("restore", rs.status === 200 && rs.body.site.config.business.tagline === undefined && rs.body.versions[0].note === `restored version ${first.id}`);
t("suspend", (await call("POST", "/api/sites/test-tours/status", { status: "suspended" }, T)).body.site.status === "suspended");
t("suspended not live", (await site("testtours.in", "/en/")).status === 404);
t("404 route", (await call("GET", "/api/whatever", null, T)).status === 404);
t("bad json", (await fetch(B + "/api/sites/test-tours/config", { method: "PUT", headers: { Authorization: `Bearer ${T}` }, body: "{x" })).status === 400);
const html = await fetch(B + "/"); t("admin page", html.status === 200 && (await html.text()).includes("Averix Sites") && html.headers.get("content-security-policy"));
console.log(`${ok} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
