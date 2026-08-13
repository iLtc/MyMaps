# MyMaps Next.js Migration — Design Spec

**Date:** 2026-08-13
**Status:** Approved design, pending implementation plan
**Source design:** Claude Design project `ed90cc95-abb9-460f-9cab-422b003d7c4b`, variant `mymaps-tabs.html` (with `base.css`, `maps.js`, Broadsheet design-system `styles.css`)

## Overview

Convert the static single-file travel map site (`index.html` + `script.js`, Google
Charts) into a statically exported Next.js/TypeScript app implementing the
"tabs" design: Broadsheet newspaper styling, a d3-geo vector map engine, an
En/中 bilingual route tree, and GitHub Actions deployment to GitHub Pages at
`maps.iltc.app`.

Google Charts, jQuery, and the hardcoded Maps API key are removed entirely.

## Routes

Six routes, locale encoded in the path. English is implicit (no `/en` prefix);
the world map lives at the locale roots (there is no `/world` route).

| Route | Locale | Map |
|---|---|---|
| `/` | en | world |
| `/china` | en | china |
| `/united-states` | en | us |
| `/zh` | zh | world |
| `/zh/china` | zh | china |
| `/zh/united-states` | zh | us |

- The URL is the **only** locale source. No localStorage, no browser-language
  detection, no redirects.
- `next.config.ts`: `output: 'export'`, `trailingSlash: true`. Every route
  exports as `<route>/index.html`, which GitHub Pages serves natively — this is
  the whole workaround for Pages having no server-side routing.
- Single root layout; all six routes are client-side `<Link>` navigations
  (content swap, never a full page load). This includes the En/中 toggle.
- `<html lang>` is `en` in the static shell; a small client component
  (`LangAttr`) sets it to `zh` on `/zh/*` at hydration. Accepted trade-off:
  pre-hydration static HTML of `/zh/*` pages carries `lang="en"`.
- Tab links and the language toggle are built by `pathFor(locale, mapKey)`.
  Language toggle preserves the current map (`/china` ↔ `/zh/china`).
- Clicking China or the United States on the world map calls
  `router.push(pathFor(currentLocale, 'china' | 'us'))` — drill-down stays
  in-locale.

## Project structure

```
MyMaps/
├── app/
│   ├── layout.tsx               # single root layout: fonts, global CSS, GA tag
│   ├── page.tsx                 # /                (world, en)
│   ├── china/page.tsx           # /china
│   ├── united-states/page.tsx   # /united-states
│   └── zh/
│       ├── page.tsx             # /zh              (world, zh)
│       ├── china/page.tsx       # /zh/china
│       └── united-states/page.tsx
├── components/
│   ├── MapPage.tsx              # shared page: masthead, tabs, counts, legend, map slot
│   ├── GeoMap.tsx               # 'use client' wrapper around the d3 engine
│   └── LangAttr.tsx             # 'use client'; syncs <html lang> to the route
├── lib/
│   ├── data.ts                  # visit data + Chinese labels (single source of truth)
│   ├── i18n.ts                  # UI strings for en/zh; Locale and MapKey types
│   ├── paths.ts                 # pathFor(locale, mapKey)
│   └── geo.ts                   # d3 draw engine (ported from the design's maps.js)
├── styles/
│   ├── base.css                 # page chrome styles from the design
│   └── broadsheet.css           # design-system tokens (flattened from _ds/, trimmed)
├── public/
│   ├── atlas/world.json         # TopoJSON, committed to the repo
│   ├── atlas/china.json
│   ├── atlas/us.json
│   └── CNAME                    # maps.iltc.app
├── scripts/
│   └── check-data.mjs           # build-time region-name validation (CI gate)
├── docs/superpowers/specs/      # this spec; later the implementation plan
├── next.config.ts               # output: 'export', trailingSlash: true
├── .github/workflows/deploy.yml
├── package.json / tsconfig.json
└── CLAUDE.md                    # rewritten for the new architecture
```

Deleted: `index.html`, `script.js`. `CNAME` moves to `public/CNAME`.

Each `page.tsx` is a one-liner rendering `<MapPage locale mapKey />` plus a
static `metadata` export with the localized page title. (Per-route static
metadata is the reason for six explicit files over a catch-all route.)

## Data model (`lib/data.ts`)

- Visit records per map: `Record<placeName, year>` where year is a string
  (`'2015'`) or a sentinel (`Childhood`, `Home`) that the UI translates
  (`童年`, `故乡` in zh).
- Chinese labels per map, typed `Record<keyof typeof DATA[k], string>` so a
  label for a nonexistent place — or a visited place missing a label — fails
  `tsc`.
- Counts are **derived** (`Object.keys(DATA[k]).length`), never hardcoded.
  (Deliberate change from the design prototype's `COUNTS` table.)
- Current data carries over verbatim: 6 countries, 18 China provinces/regions,
  19 US states, including the 2025–2026 additions (Alaska, Hawaii, Utah,
  Montana, Wyoming).

## Map engine (`lib/geo.ts` + `components/GeoMap.tsx`)

Ported from the design's `maps.js` with minimal changes:

- Kept as-is: `norm()` normalization with alias table and suffix stripping
  (`Sheng`, `Shi`, `SAR`, …), `featureName()` property fallback chain,
  projections (`geoNaturalEarth1` world / `geoMercator` china / `geoAlbersUsa`
  us), aspect ratios (0.52 / 0.72 / 0.58), `data-visited` attributes driving
  CSS fills, fixed-position tooltip singleton, d3-zoom pan/zoom (scale extent
  1–12) with a Reset-view button that appears when transformed, hidden regions
  (Antarctica on world, 南海诸岛 inset on china).
- Changed: d3 from npm as modular packages (`d3-geo`, `d3-selection`,
  `d3-zoom`, `d3-transition`, `topojson-client`) instead of CDN `<script>`
  tags. Atlas data fetched same-origin from `/atlas/*.json` with a
  module-level parsed cache (one fetch per atlas per session).
- `GeoMap.tsx`: `useEffect` on `(mapKey, locale)` draws into a ref'd div; a
  `ResizeObserver` with the design's 24px width threshold triggers redraws;
  cleanup empties the container. Loading/failure states render the localized
  italic `.map-loading` text.

Atlas sourcing (implementation-time task): world from `world-atlas@2`
(countries-110m), US from `us-atlas@3` (states-10m), China from a
to-be-verified TopoJSON/GeoJSON source covering all provinces plus HK, Macau,
and the 南海诸岛 inset (the design's `china-geojson@1.0.0` jsDelivr URL is
unverified — the plan must verify or substitute, then commit the file).
Files are downloaded once and committed; no runtime third-party fetches.

## Styling, fonts, analytics

- `broadsheet.css` (tokens + used component styles; unused CMYK/print-plate
  blocks stripped, since `print-plates.js` is not brought over) and `base.css`
  load as global stylesheets from the root layout. Global selectors are
  required because the d3 engine creates `.region`/`.tip` elements outside
  React.
- Fonts via `next/font/google`: Source Serif 4 (400/600 + italic) and Noto
  Serif SC (400/600), self-hosted at build time. The CSS `@import
  url(fonts.googleapis.com…)` lines are removed.
- `:lang(zh)` font-stack override from the design is kept so 中 mode stays in
  the serif voice.
- Google Analytics `G-ZJY9VYC238` carries over via `@next/third-parties`
  `<GoogleAnalytics>` in the root layout.

## Deployment

`.github/workflows/deploy.yml`, on push to `master`:

1. Checkout; setup **Node 24** with npm cache; `npm ci`
2. `node scripts/check-data.mjs` (region-name gate, see Testing)
3. `npm run build` → static site in `out/` (includes `404.html`, all six
   `index.html` files, `public/` contents incl. `CNAME` and atlases)
4. `actions/upload-pages-artifact` on `out/` → `actions/deploy-pages`

Workflow declares `pages: write` and `id-token: write` permissions. The
official Pages actions skip Jekyll, so `_next/` survives without `.nojekyll`.

**One-time manual step (user):** repo Settings → Pages → source = "GitHub
Actions". Until flipped, pushes build but do not publish.

Dev loop: `npm run dev`; production preview via `npm run build && npx serve
out`.

## Error handling

- Atlas fetch/parse failure → localized "Map data unavailable." in the map
  slot; page chrome (tabs, counts, toggle) keeps working.
- Unknown routes → Next's exported `404.html`, served automatically by Pages.

## Testing & verification

The historical failure mode is silent region drops (a name that matches no map
feature simply vanishes). Guards:

1. **Types:** data/label key relationships enforced by `tsc` (see Data model).
2. **Build gate:** `scripts/check-data.mjs` loads the three committed atlas
   files, runs every visited place name through the same `norm()` logic the
   engine uses, and exits non-zero listing any unmatched name. Runs in CI
   before `next build`. (The design's runtime `console.warn` becomes a deploy
   gate.)
3. **Smoke pass (manual, in the plan's verification steps):** `out/` contains
   all six route `index.html` files + atlases; dev-server check of tab
   navigation, language toggle, tooltips, zoom/reset, world-map drill-down.

No permanent browser-test framework — out of proportion for a personal static
site.

## Decisions log

- Approach A chosen over catch-all route (B) and React-idiomatic SVG rewrite (C).
- `/world` routes removed; world map lives at `/` and `/zh` (6 routes total).
- Deploy via GitHub Actions, not committed build output.
- URL-only locale; no persistence or detection.
- Single root layout → all navigation client-side; hydration-corrected
  `<html lang>` accepted.
- TypeScript.
- Node 24 in CI.
- GA tag retained (present on the current site, absent from the design
  prototype).
