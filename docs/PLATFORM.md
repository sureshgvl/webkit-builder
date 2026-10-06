# Averix sites platform (Phases A + B)

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
  RENDER  backend + admin panel ── direct Postgres (owner) ──────────►  SUPABASE
            │  login: Supabase Auth (only ADMIN_EMAILS)
            ├── uploads (resized to WebP) ───────────────────────────►  CLOUDFLARE R2
            ├── after every visible change: POST /api/revalidate/ ──►  VERCEL (all addresses of the site)
            └── client domains (optional VERCEL_TOKEN) ──────────────►  Vercel Domains API
```

## How it works

| Piece | Where | Notes |
|---|---|---|
| Admin panel | `backend/admin/index.html` | served by the backend at `/`; login, sites list, new-site form, editor (business, design, sections, photos, addresses, history, JSON), preview, publish |
| Backend API | `backend/src/` | `app.ts` routes, `db.ts` (Postgres), `auth.ts` (Supabase Auth), `storage.ts` (R2 + resize), `vercel.ts` (domains), `website.ts` (refresh + preview links) |
| Draft preview | `src/app/preview/[token]/` | signed 1-hour link from the admin panel; the website fetches the draft from the backend; never cached or indexed |
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
| `BACKEND_URL` | Render URL, e.g. `https://averix-backend.onrender.com` | no (needed for draft previews) |

### 4. Admin login (Supabase Auth)
1. **Authentication → Sign In / Providers**: keep **Email** on; turn **off** "Allow new users to sign up".
2. **Authentication → Users → Add user**: your email + a strong password, tick **Auto Confirm**.
3. Only emails listed in the backend's `ADMIN_EMAILS` can use the panel, even if more users exist.

### 5. Render (backend + admin panel)
**New → Blueprint** → this repo (uses `render.yaml`, branch `platform`), or **New → Web Service** with
build `npm ci && npm run build:backend`, start `npm run start:backend`, health check `/health`, Node 22.

| Name | Value | Secret? |
|---|---|---|
| `DATABASE_URL` | Supabase → **Connect** → **Session pooler** URI (port 5432), with your DB password | **yes** |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | same as Vercel | no |
| `ADMIN_EMAILS` | your email(s), comma separated | no |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | R2 token | **yes** |
| `R2_BUCKET` | `averix-sites` | no |
| `ASSETS_BASE_URL` | R2 public URL (same as Vercel) | no |
| `WEBSITE_URL` | Vercel platform URL, e.g. `https://averix-platform.vercel.app` | no |
| `REVALIDATE_SECRET` | **same value as on Vercel** | **yes** |
| `PREVIEW_SECRET` | long random string (Blueprint generates one) | **yes** |
| `PLATFORM_DOMAIN` | later: your client domain, e.g. `averix.site` (new sites get `<slug>.averix.site`) | no |
| `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | optional: adds client domains to Vercel automatically and checks their DNS | **yes** (token) |
| `ADMIN_ORIGIN` | optional: only if the panel is opened from another web address | no |

Open the Render URL → log in. The free plan sleeps after 15 minutes (first load then takes ~1 minute); websites
are not affected because they are served by Vercel. Use Starter (~$7/month) once clients depend on it.

### Daily work in the admin panel
1. **+ New site** → site id, industry, look (or paste "Copy setup" from the showcase), languages, business details →
   a **draft** with the address `<slug>.<PLATFORM_DOMAIN>`.
2. **Photos**: upload phone photos (auto-rotated, resized, WebP); copy the name into a section (`"image": "images/…"`).
   Upload the logo as **Logo** and it is set automatically.
3. **Sections**: layout per section and your changes as JSON (open "Industry default content" to copy keys).
   **Design**: ready-made looks, style, brand colours. **Advanced** shows everything as one JSON.
4. **Save** (checked with the same rules as every build; errors are shown, nothing broken is saved) →
   **Preview** (1-hour private link) → **Publish**. Edits to a published site go live right after Save.
5. **Addresses**: add the client's domain; with `VERCEL_TOKEN` it is added to Vercel and **Check DNS** shows the
   records to send the client. Without it, add the domain in Vercel → Project → Domains yourself.
6. **History**: every save is kept; **Restore** brings back any version. **Suspend** hides a site (e.g. unpaid).

### 6. Import existing sites (from a computer with this repo, or later from the backend)
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
Backend tests (local Postgres with the migration applied, stand-ins for Supabase Auth/PostgREST and R2):
`backend/test/fakes.mjs`, `backend/test/api.test.mjs` (56 checks, also run in CI) and
`backend/test/admin-ui.test.mjs` (browser). The CI workflow shows the exact environment.

## Next phases
- **C — Client self-editing**, **D — Billing**, **E — More industries**, **F — Distance through the backend.**
