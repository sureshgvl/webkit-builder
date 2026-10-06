# Averix sites platform (Phase A)

One deployment serves every client website, chosen by the web address. Single-site builds (`CLIENT=<slug>`, the
existing demos and SearchCab) keep working unchanged.

```
Visitor → patil-tours.<platform domain> / patiltours.in
            │
            ▼
  VERCEL (PLATFORM=1)  ── reads published site by web address ──►  SUPABASE  (sites, domains, site_versions)
  same Next.js code         (public anon key + Row Level Security)
            │
            └── images ──────────────────────────────────────────►  CLOUDFLARE R2  (sites/<slug>/images/…)
  RENDER (Phase B): admin API — saves sites, uploads images, calls /api/revalidate/ after publishing
```

## How it works

| Piece | Where | Notes |
|---|---|---|
| Mode switch | `next.config.ts` | `PLATFORM=1` → server app using only `*.p.tsx` / `*.p.ts` files; otherwise the static single-site export (`page.tsx`) |
| Routing | `next.config.ts` rewrites | every path → `/sites/<host>/<path>` (except `_next`, `api`, `placeholders`, `dev-assets`) |
| Site lookup | `src/platform/source.ts` | Supabase (`domains → sites`, published only) or, without Supabase, `clients/<slug>` for `<slug>.localhost` |
| Validation | `src/platform/load.ts` | same `parseSite` as every build; a broken config shows "under maintenance", never a crash |
| Pages | `src/app/sites/[host]/…` | default language at `/`, others at `/<lang>/`; per-host `robots.txt` and `sitemap.xml` |
| Caching | 5 minutes per host, cleared on demand | `POST /api/revalidate/` with `Authorization: Bearer $REVALIDATE_SECRET` and `{ "hosts": [...] }` — refresh **every** host of a site after a change |
| Images | `ASSETS_BASE_URL/sites/<slug>/images/…` | config keeps `"images/x.webp"`; placeholders stay on the website |
| Database | `supabase/migrations/` | `sites` (config, status draft/published/suspended, plan, expiry), `domains`, `site_versions` (automatic history) |
| Access rules | RLS | public key: read **published** sites and safe columns only; no writes; no plans, expiry or history. Tested in `supabase/tests/rls_test.sql` |
| Import | `scripts/platform-import.ts` | `clients/<slug>` → R2 + Supabase; refuses to move a domain that belongs to another site |

## Set up (once)

### 1. Supabase (new project `averix-sites`, region Mumbai)
1. **SQL Editor** → paste and run `supabase/migrations/20261006000000_sites.sql`.
2. Optional check: run `supabase/tests/rls_test.sql` (it rolls back; prints "All RLS / schema tests passed").
3. **Project Settings → API**: note the **Project URL**, the **anon (public) key** and the **service_role key** (secret).

### 2. Cloudflare R2
1. Create bucket `averix-sites`.
2. **Settings → Public access**: for testing enable the `r2.dev` URL; for production connect a custom domain
   (e.g. `img.<platform domain>`). This public URL is `ASSETS_BASE_URL`.
3. **Manage API tokens** → Object Read & Write, this bucket only → note Access Key ID, Secret, Account ID.

### 3. Vercel (a **new** project, e.g. `averix-platform`; existing projects are not touched)
- Import `webkit-builder`, **branch `platform`** for testing (later `main`).
- **Build Command:** `npm run build:platform`
- **Environment variables:**

| Name | Value | Secret? |
|---|---|---|
| `PLATFORM` | `1` | no |
| `SUPABASE_URL` | Project URL | no |
| `SUPABASE_ANON_KEY` | anon key | no (public by design; RLS protects data) |
| `ASSETS_BASE_URL` | R2 public URL | no |
| `REVALIDATE_SECRET` | long random string | **yes** |
| `GOOGLE_MAPS_API_KEY` | browser key (for now) | restricted by website |

### 4. Import the first sites (from a computer with this repo, or later from the backend)
```bash
export SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=averix-sites
npx tsx scripts/platform-import.ts demo-cab demo-travel --status published --domain demo-cab=<test address>
```
Use `--dry-run` first. Never commit these values.

## Test locally
```bash
npm run build:platform && npm run start:platform
# open http://demo-cab.localhost:3000/ , http://searchcab.localhost:3000/en/  (served from clients/)
```

## Next phases
- **B — Backend on Render + admin panel:** create/edit sites with a form, upload images (auto-resize), publish /
  unpublish, add domains, refresh caches; uses the service key server-side only.
- **C — Client self-editing**, **D — Billing**, **E — More industries**, **F — Distance through the backend.**
