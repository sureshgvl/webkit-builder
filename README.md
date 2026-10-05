# webkit-builder

Config-driven business websites. Each client site is **one JSON file + photos**; the kit turns it into a fast,
mobile-first, Marathi + English static website deployed on Vercel.

```
clients/<slug>/site.json  +  industry preset  +  style  →  static site  →  Vercel  →  client's domain
(business details, photos)   (sections & sample text)  (colours, fonts)
```

## Quick start

```bash
npm install
npm run dev                         # previews clients/demo-travel at http://localhost:3000
CLIENT=demo-travel-elegant npm run dev
```

## New client in 5 steps

```bash
npm run new-client -- patil-tours --industry travel --style warm --langs mr,en
```

1. Fill in `clients/patil-tours/site.json` → `business` (name, phone, address, hours…).
2. Put photos in `clients/patil-tours/images/` and use them as `"images/goa.jpg"`. Vehicle photos look best as
   cut-outs (transparent PNG/WebP), e.g. `"images/fleet/innova-crysta.webp"`. If a travel client has no vehicles,
   remove the section with `"order"`.
3. Replace the sample **testimonials**, **stats** and **fleet** with the client's real ones (the build warns until you do —
   never publish made-up reviews).
4. Override anything else you need under `sections` (see below).
5. Preview with `CLIENT=patil-tours npm run dev`, then deploy (see [Deploy](#deploy-to-vercel)).

`npm run validate` checks every client config and prints clear errors such as
`Section "packages" is invalid: items.0.price: expected number`.

## How a site is put together

| Layer | Where | What it controls |
|---|---|---|
| **Sections** | `src/sections/` | Building blocks with 2–3 layouts each |
| **Styles** | `src/styles/` | Colours, fonts, corner radius, spacing |
| **Industry presets** | `src/presets/` | Which sections, in which order, with sample Marathi + English text |
| **Client config** | `clients/<slug>/site.json` | The client's details and any overrides |

### Sections and layouts

The first layout is the default.

| Section | Layouts | Notes |
|---|---|---|
| `navbar` | `simple`, `centered` | Links come from sections that have a `navLabel` |
| `hero` | `image`, `split`, `centered` | Default button is "Enquire on WhatsApp" |
| `about` | `split`, `centered` | Separate paragraphs in `body` with a blank line |
| `packages` | `cards`, `list` | Price in rupees, days/nights, highlights; each card has a WhatsApp button |
| `fleet` | `compact`, `cards`, `scroll` | Vehicles for hire (`compact` = 2 per row on phones, for big fleets): cut-out photo, seats, features, optional rate per km; "Book" on WhatsApp |
| `features` | `grid`, `split` | `icon` is one of the names in `src/components/icon.tsx` |
| `stats` | `band`, `cards` | |
| `gallery` | `masonry`, `grid` | |
| `testimonials` | `cards`, `scroll` | `scroll` is a swipeable row on phones |
| `faq` | `accordion`, `two-column` | |
| `cta` | `card`, `strip` | WhatsApp + call buttons |
| `enquiry` | `split`, `simple` | WhatsApp form; package list comes from `packages` automatically |
| `contact` | `map`, `details` | Uses `business.mapQuery` or the address |
| `footer` | `columns`, `simple` | |

Every section also accepts `tone` (`default`, `surface`, `primary`) and `navLabel`.
Phones get a fixed **Call + WhatsApp** bar at the bottom; larger screens get a floating WhatsApp button.

### Styles

`modern` (teal, rounded) · `warm` (orange/teal, friendly — travel default) · `elegant` (serif, browns).
A client can keep a style but use its own brand colours:

```json
"colors": { "primary": "#1D4ED8", "accent": "#F59E0B" }
```

### Industries

| Industry | Default style | Sections |
|---|---|---|
| `travel` | `warm` | hero, packages, fleet, features, stats, gallery, testimonials, faq, cta, enquiry, contact — 6 ready looks |

## Client config reference

```jsonc
{
  "industry": "travel",
  "style": "warm",
  "languages": ["mr", "en"],          // first = default language at "/", others at "/en/"
  "siteUrl": "https://patiltours.in",  // needed for sitemap + WhatsApp/Facebook share previews
  "colors": { "primary": "#1D4ED8" },  // optional brand colours
  "business": {
    "name": { "mr": "पाटील टूर्स", "en": "Patil Tours" },
    "tagline": { "mr": "...", "en": "..." },
    "phone": "+91 98765 43210",        // 10-digit numbers get +91 automatically
    "whatsapp": "+91 98765 43210",     // optional, defaults to phone
    "email": "hello@patiltours.in",
    "address": { "mr": "...", "en": "..." },
    "mapQuery": "Patil Tours, Kolhapur",
    "hours": { "mr": "...", "en": "..." },
    "logo": "images/logo.png",
    "socials": { "instagram": "https://instagram.com/..." }
  },
  "order": ["hero", "packages", "enquiry", "contact"],   // optional: reorder or drop sections
  "sections": {
    "hero": { "layout": "split", "image": "images/hero.jpg", "secondaryCta": null },
    "packages": { "items": [ { "title": { "mr": "गोवा", "en": "Goa" }, "days": 4, "price": 11499 } ] }
  },
  "seo": { "title": { "mr": "...", "en": "..." }, "keywords": ["tours kolhapur"] },
  "analytics": { "ga4": "G-XXXXXXX" }
}
```

**Override rules:** each key under `sections.<id>` replaces the preset's value for that key (lists are replaced
whole), and `null` removes it. Any text can be a plain string (same in every language) or `{ "mr": "…", "en": "…" }`.

## Deploy to Vercel

One Vercel project per client, all from this repo:

1. Vercel → **Add New Project** → import this repo.
2. **Environment Variables:** `CLIENT` = the client's slug (e.g. `patil-tours`).
3. Framework preset: Next.js (auto-detected). Build command `npm run build` (default).
4. Deploy, then **Settings → Domains** → add the client's domain and follow the DNS steps.
5. Set `siteUrl` in the client's `site.json` to that domain.

Every push to `main` redeploys every client project, so kit improvements reach all sites at once.

## Showcase demo (for selling)

Add `"showcase": true` to a client config (the `demo-travel` site has it) and the page gets a
**🎨 Customize / डिझाइन बदला** button. Visitors can:

- pick a **ready look** (a style + layout combination defined in the preset's `looks`),
- switch **style** and try their own **brand colour**,
- change the **layout of each section**,
- **copy a link** to that exact design (e.g. `/?style=elegant&color=1d4ed8&hero=split`) to send to a client,
- **copy the setup** as `site.json` (style, colour and every section's layout) to start the client's site.

Everything switches instantly: in showcase mode all layouts are rendered into the static page and only the
active one is shown. Normal client sites (without `showcase`) are unaffected. The language switch keeps the design.

Live demo: https://webkit-builder.vercel.app

To add looks for an industry, edit `looks` in its preset (`src/presets/<industry>.ts`). The build checks that every
look uses a real style and real layouts.

## What every site gets

- Static HTML (fast, cheap, nothing to hack), mobile-first layout, no sideways scrolling
- Marathi + English with a language switch and Devanagari-friendly fonts
- WhatsApp enquiry form (no server, no form service) and click-to-call everywhere
- SEO: title/description per language, Open Graph share previews, `sitemap.xml`, `robots.txt`,
  schema.org business data (e.g. `TravelAgency`) for Google
- Optional Google Analytics 4
- Favicon generated from the business name and brand colour when there is no logo

## Checks

```bash
npm run lint          # TypeScript
npm run validate      # all client configs
npm run build && npm run screenshots   # phone + desktop screenshots of the built site, fails on sideways scroll or JS errors
CLIENT=demo-travel npm run build && npm run test:showcase   # clicks through the showcase panel in a real browser
```

CI (`.github/workflows/ci.yml`) runs on each push: type check, config validation, a build of every demo client, and
browser tests (showcase panel + screenshots). Screenshots are attached to each CI run as an artifact.

## Adding things

- **New industry:** copy `src/presets/travel.ts`, change `order`, `sections` and `schemaType`, register it in
  `src/presets/index.ts`. Add a `demo-<industry>` client and add it to the CI matrix.
- **New style:** copy a file in `src/styles/`, register it in `src/styles/index.ts`.
- **New section or layout:** add a component in `src/sections/`, register it in `src/sections/index.ts`.
- **Sample images:** `node scripts/make-placeholders.mjs` regenerates the illustrated SVG placeholders.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0. Setup | Next.js static export, Tailwind, config schema, `new-client` | ✅ |
| 1. Core engine | Section + style system, WhatsApp/call buttons | ✅ |
| 2. First industry | Travel preset (mr + en), 13 sections, SEO | ✅ |
| 3. More industries | Next industries + 3 more styles, added as clients ask | ⬜ |
| 4. Delivery tools | Deploy helper, image resizing for client photos, privacy page | ⬜ |
| 5. Demo site + tests | Showcase panel (looks, styles, brand colour, layouts, share link, copy setup), browser tests + screenshots in CI | ✅ |
| 5b. | Lighthouse scores in CI; industry switcher once there are more industries | ⬜ |
