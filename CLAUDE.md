# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A bilingual travel map site (maps.iltc.app) built with Next.js and statically
exported to GitHub Pages. Pushing to `master` triggers the GitHub Actions
workflow (`.github/workflows/deploy.yml`), which runs the data gate, builds,
and deploys. The repo's Pages setting must be "GitHub Actions".

## Commands

- `npm run dev` — dev server at localhost:3000
- `npm test` — unit tests (node:test; Node 24 runs the .ts files natively)
- `npm run check-data` — verify every visited place matches an atlas feature
- `npm run build` — runs check-data (prebuild), then exports the site to `out/`
- `npm run build && npx serve out` — preview exactly what Pages serves

## Architecture

Six static routes, locale in the path, world map at the locale roots:
`/`, `/china`, `/united-states`, `/zh`, `/zh/china`, `/zh/united-states`.
`next.config.ts` sets `output: 'export'` + `trailingSlash: true`, so each
route exports as `<route>/index.html` — that is the entire GitHub Pages
routing story. The URL is the only locale source (no localStorage, no
detection). Each `app/**/page.tsx` is a one-liner rendering
`<MapPage locale mapKey />` with a localized title.

- `components/MapPage.tsx` — server-rendered chrome (masthead, tab links,
  derived counts, legend). Tabs and the En/中 toggle are `<Link>`s built by
  `pathFor()` (`lib/paths.ts`); navigation is fully client-side (single root
  layout). `components/LangAttr.tsx` syncs `<html lang>` after hydration.
- `components/GeoMap.tsx` + `lib/geo.ts` — the d3-geo map engine (client
  side). Fetches `/atlas/*.json` (module-level cache), draws SVG with
  tooltip, zoom/pan + reset. World-map clicks on China/US drill into that
  map's route.
- `lib/data.ts` — the ONLY file to edit for a new visit. Add the place under
  the right map, keyed by the atlas's own name for it. Counts are derived —
  never hardcode them.

### Region-name matching

`DATA`'s keys ARE atlas feature names, character for character, so matching
is a plain object lookup with no normalisation layer in between — the world
and us atlases name features in English (`United States of America`), the
china atlas in bare Chinese (`安徽`), and the keys follow suit. Display names
come from `lib/names.ts`, so a key never has to be pretty; it only has to
match. Get one wrong and `scripts/check-data.mjs` fails the build naming it,
rather than the region silently vanishing from the map.

This replaced an earlier `lib/normalize.ts`, whose fuzzy matching (lowercase,
strip admin suffixes, alias table) was inherited from the Google Charts site's
pinyin identifiers (`Heilongjiang Sheng`). Against the committed atlases it
earned its keep on exactly one entry, did nothing at all on `us`, and
collapsed every china name to the empty string. Don't reintroduce it.

Atlas files in `public/atlas/` are committed, from world-atlas@2.0.2
(countries-110m), us-atlas@3.0.1 (states-10m), and china-geojson@1.0.0.

### Region display names

`lib/names.ts` holds an en/zh display name for **every** feature in every
atlas, keyed by the atlas's own name for that feature — so a region reads in
the page's language whether or not it has been visited. The atlases are
single-language (world/us English, china Chinese), so without this table
unvisited regions render in the atlas's language instead of the page's.
`en` is a display name, not an echo of the key: it spells out the atlases'
abbreviations (`Bosnia and Herz.` → `Bosnia and Herzegovina`).

`scripts/check-data.mjs` fails the build if an atlas feature has no entry or
is missing either locale, so swapping an atlas cannot silently reintroduce
mixed-language tooltips. It also fails if a visited place sits on the
engine's `HIDE` list, which would otherwise match cleanly and still never be
drawn. `HIDE` is mirrored in the gate because `lib/geo.ts` is bundler-only
and can't be imported there — that check is what keeps the two honest.

### Node-run TypeScript constraint

`scripts/check-data.mjs` and `tests/*.test.ts` run under plain Node 24 (type
stripping) and import lib files with explicit `.ts` extensions. Therefore
`lib/i18n.ts`, `lib/data.ts`, `lib/names.ts`, and `lib/paths.ts` may only
cross-import each other with `import type`. `lib/geo.ts` is bundler-only and
exempt.

## Conventions

Commits follow `feat:` / `fix:` / `chore:` / `docs:` prefixes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
