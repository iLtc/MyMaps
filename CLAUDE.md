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
- `lib/data.ts` — the ONLY file to edit for a new visit. Add the place to
  `DATA` and its Chinese name to `ZH_LABELS` (types enforce the pairing).
  Counts are derived — never hardcode them.

### Region-name matching

Visited names must match atlas features through `lib/normalize.ts` (`norm()`:
lowercase, strip admin suffixes, alias table). The china atlas names features
in bare Chinese (安徽), matched via `ZH_LABELS.china`. A wrong name cannot
silently drop a region: `scripts/check-data.mjs` runs the same `norm()` logic
against the committed atlases and fails the build listing unmatched names.

Atlas files in `public/atlas/` are committed, from world-atlas@2.0.2
(countries-110m), us-atlas@3.0.1 (states-10m), and china-geojson@1.0.0.

### Node-run TypeScript constraint

`scripts/check-data.mjs` and `tests/*.test.ts` run under plain Node 24 (type
stripping) and import lib files with explicit `.ts` extensions. Therefore
`lib/i18n.ts`, `lib/data.ts`, `lib/normalize.ts`, and `lib/paths.ts` may only
cross-import each other with `import type`. `lib/geo.ts` is bundler-only and
exempt.

## Conventions

Commits follow `feat:` / `fix:` / `chore:` / `docs:` prefixes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
