# MyMaps Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the static single-file travel map site into a statically exported Next.js/TypeScript app with six bilingual routes, a d3-geo vector map engine, and GitHub Actions deployment to GitHub Pages.

**Architecture:** Next.js App Router with `output: 'export'` and `trailingSlash: true`, so every route becomes `<route>/index.html` and GitHub Pages serves it with no server-side routing. Single root layout; all six routes are client-side `<Link>` navigations. The d3 draw engine (ported from the Claude Design prototype) runs in one client component; everything else is server-rendered static HTML. Atlas TopoJSON/GeoJSON is committed under `public/atlas/` — no runtime third-party fetches.

**Tech Stack:** Next.js 16, React 19, TypeScript ~5.9, d3-geo/d3-selection/d3-zoom/d3-transition, topojson-client, @next/third-parties (GA), node:test (built into Node 24) for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-13-nextjs-migration-design.md`

## Global Constraints

- Node 24 everywhere (CI and local). TypeScript pinned `~5.9` — NOT TypeScript 7 (native compiler; Next.js compatibility unverified).
- Exactly six routes: `/`, `/china`, `/united-states`, `/zh`, `/zh/china`, `/zh/united-states`. No `/world` route — the world map lives at the locale roots.
- `next.config.ts` must contain `output: 'export'` and `trailingSlash: true`.
- URL is the only locale source: no localStorage, no browser-language detection, no redirects.
- Custom domain `maps.iltc.app` via `public/CNAME`.
- Google Analytics ID `G-ZJY9VYC238` must be present in the root layout.
- Counts shown in the UI are always derived via `Object.keys(...).length` — never hardcoded.
- **Node-loaded lib files** (`lib/i18n.ts`, `lib/data.ts`, `lib/normalize.ts`, `lib/paths.ts`) may only cross-import each other with `import type` (erased at strip time). Runtime cross-imports would break `node scripts/check-data.mjs` and `node --test`, which load these `.ts` files via Node 24's built-in type stripping. `lib/geo.ts` is bundler-only and may import freely.
- Commit prefixes: `feat:` / `fix:` / `chore:` / `docs:`. End commit messages with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Atlas provenance (verified 2026-08-13, all 43 visited places match features through `norm()`):
  - world: `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json` (TopoJSON, object `countries`, `properties.name` in English)
  - us: `https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json` (TopoJSON, object `states`, `properties.name` in English)
  - china: `https://cdn.jsdelivr.net/npm/china-geojson@1.0.0/src/geojson/china.json` (GeoJSON FeatureCollection, `properties.name` in bare Chinese: `安徽`, `香港`, `南海诸岛`, …)

---

### Task 1: Next.js scaffold that builds to a static export

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `app/layout.tsx` (minimal placeholder), `app/page.tsx` (minimal placeholder)
- Move: `CNAME` → `public/CNAME`

**Interfaces:**
- Consumes: nothing.
- Produces: a repo where `npm run build` emits a static site to `out/`. Later tasks replace the placeholder layout/page and add scripts to `package.json` (`prebuild` arrives in Task 3 — do not add it here).

- [ ] **Step 1: Write `.gitignore`**

```gitignore
node_modules/
.next/
out/
*.tsbuildinfo
npm-debug.log*
.DS_Store
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "mymaps",
  "private": true,
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "node --test tests/*.test.ts",
    "check-data": "node scripts/check-data.mjs"
  },
  "dependencies": {
    "@next/third-parties": "^16.3.0",
    "d3-geo": "^3.1.1",
    "d3-selection": "^3.0.0",
    "d3-transition": "^3.0.1",
    "d3-zoom": "^3.0.0",
    "next": "^16.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "topojson-client": "^3.1.0"
  },
  "devDependencies": {
    "@types/d3-geo": "^3.1.0",
    "@types/d3-selection": "^3.0.0",
    "@types/d3-transition": "^3.0.0",
    "@types/d3-zoom": "^3.0.0",
    "@types/geojson": "^7946.0.14",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/topojson-client": "^3.1.0",
    "typescript": "~5.9.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

`allowImportingTsExtensions` is required: test files and `scripts/check-data.mjs` import lib files with explicit `.ts` extensions so plain Node can run them.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

- [ ] **Step 4: Write `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true
}

export default nextConfig
```

- [ ] **Step 5: Write minimal placeholder `app/layout.tsx`**

(Replaced with the real layout in Task 4.)

```tsx
export const metadata = { title: 'My Maps' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Write minimal placeholder `app/page.tsx`**

(Replaced with the real page in Task 6.)

```tsx
export default function Page() {
  return <h1>My Maps</h1>
}
```

- [ ] **Step 7: Move CNAME into public/**

```bash
mkdir -p public && git mv CNAME public/CNAME
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: succeeds, creates `package-lock.json` and `node_modules/`. Check `node --version` reports 24.x first; if the sandbox has an older Node, install Node 24 (e.g. via nvm) before continuing.

- [ ] **Step 9: Build and verify static export**

Run: `npm run build && ls out/`
Expected: build succeeds; `out/` contains `index.html`, `404.html`, `CNAME`, and `_next/`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js static-export app"
```

---

### Task 2: Core libs — i18n strings, visit data, path builder, name normalization (TDD)

**Files:**
- Create: `lib/i18n.ts`, `lib/data.ts`, `lib/paths.ts`, `lib/normalize.ts`
- Test: `tests/paths.test.ts`, `tests/normalize.test.ts`, `tests/data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (exact names later tasks rely on):
  - `lib/i18n.ts`: `type Locale = 'en' | 'zh'`; `type MapKey = 'world' | 'china' | 'us'`; `const MAP_KEYS: readonly MapKey[]`; `interface Strings`; `const I18N: Record<Locale, Strings>`; `const YEAR_ZH: Record<string, string>`
  - `lib/data.ts`: `const DATA` (per-map `Record<placeName, yearString>`); `const ZH_LABELS` (per-map Chinese labels, keys type-locked to `DATA`'s); `function countFor(key: MapKey): number`
  - `lib/paths.ts`: `function pathFor(locale: Locale, map: MapKey): string` returning `'/'`, `'/zh/'`, `'/china/'`, `'/zh/china/'`, `'/united-states/'`, `'/zh/united-states/'`
  - `lib/normalize.ts`: `function norm(s: unknown): string`; `function featureName(props: Record<string, unknown> | null | undefined): string`

- [ ] **Step 1: Write the failing tests**

`tests/paths.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pathFor } from '../lib/paths.ts'

test('pathFor builds all six routes with trailing slashes', () => {
  assert.equal(pathFor('en', 'world'), '/')
  assert.equal(pathFor('zh', 'world'), '/zh/')
  assert.equal(pathFor('en', 'china'), '/china/')
  assert.equal(pathFor('zh', 'china'), '/zh/china/')
  assert.equal(pathFor('en', 'us'), '/united-states/')
  assert.equal(pathFor('zh', 'us'), '/zh/united-states/')
})
```

`tests/normalize.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { featureName, norm } from '../lib/normalize.ts'

test('norm strips admin suffixes', () => {
  assert.equal(norm('Heilongjiang Sheng'), 'heilongjiang')
  assert.equal(norm('Beijing Shi'), 'beijing')
})

test('norm applies aliases', () => {
  assert.equal(norm('United States of America'), 'united states')
  assert.equal(norm('Macao SAR'), 'macau')
  assert.equal(norm('Xizang'), 'tibet')
})

test('norm handles empty and non-latin input', () => {
  assert.equal(norm(''), '')
  assert.equal(norm(null), '')
  assert.equal(norm('南海诸岛'), '')
})

test('featureName falls back across property spellings', () => {
  assert.equal(featureName({ name: 'Fiji' }), 'Fiji')
  assert.equal(featureName({ NAME_1: 'Anhui' }), 'Anhui')
  assert.equal(featureName(null), '')
  assert.equal(featureName({}), '')
})
```

`tests/data.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DATA, ZH_LABELS, countFor } from '../lib/data.ts'
import { I18N, MAP_KEYS } from '../lib/i18n.ts'

test('counts are derived from the data', () => {
  assert.equal(countFor('world'), 6)
  assert.equal(countFor('china'), 18)
  assert.equal(countFor('us'), 19)
})

test('every visited place has a Chinese label', () => {
  for (const key of MAP_KEYS) {
    assert.deepEqual(
      Object.keys(ZH_LABELS[key]).sort(),
      Object.keys(DATA[key]).sort(),
      `ZH_LABELS.${key} keys must match DATA.${key} keys`
    )
  }
})

test('both locales cover the same string keys', () => {
  assert.deepEqual(Object.keys(I18N.en).sort(), Object.keys(I18N.zh).sort())
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/paths.ts'` (and siblings).

- [ ] **Step 3: Write `lib/i18n.ts`**

```ts
export type Locale = 'en' | 'zh'
export type MapKey = 'world' | 'china' | 'us'

export const MAP_KEYS: readonly MapKey[] = ['world', 'china', 'us']

export interface Strings {
  title: string
  tagline: string
  updated: string
  tabs: Record<MapKey, string>
  kicker: Record<MapKey, string>
  unit: Record<MapKey, string>
  visited: string
  notYet: string
  loading: string
  failed: string
  reset: string
}

export const I18N: Record<Locale, Strings> = {
  en: {
    title: 'My Maps',
    tagline: 'Places I have been',
    updated: 'Last updated August 2026',
    tabs: { world: 'World', china: 'China', us: 'United States' },
    kicker: { world: 'Countries', china: 'Provinces & regions', us: 'States' },
    unit: { world: 'countries', china: 'provinces', us: 'states' },
    visited: 'Visited',
    notYet: 'Not yet',
    loading: 'Drawing the map…',
    failed: 'Map data unavailable.',
    reset: 'Reset view'
  },
  zh: {
    title: '我的地图',
    tagline: '我去过的地方',
    updated: '更新于 2026 年 8 月',
    tabs: { world: '世界', china: '中国', us: '美国' },
    kicker: { world: '国家', china: '省与地区', us: '州' },
    unit: { world: '个国家', china: '个省', us: '个州' },
    visited: '去过',
    notYet: '还没去',
    loading: '正在绘制地图…',
    failed: '地图数据加载失败。',
    reset: '重置视图'
  }
}

/* Chinese renderings of the non-year sentinel values used in lib/data.ts. */
export const YEAR_ZH: Record<string, string> = {
  Childhood: '童年',
  Home: '故乡'
}
```

- [ ] **Step 4: Write `lib/data.ts`**

Only `import type` from siblings — this file is loaded by plain Node (see Global Constraints).

```ts
import type { MapKey } from './i18n'

/* Visit records. Values are a year ('2015') or a sentinel ('Childhood' |
   'Home') translated by the UI. Single source of truth — counts derive
   from these objects. */
export const DATA = {
  world: {
    China: '1994',
    'United States': '2015',
    France: '2013',
    Italy: '2013',
    Switzerland: '2013',
    Canada: '2024'
  },
  china: {
    Anhui: 'Home',
    Heilongjiang: '2019',
    Jilin: '2019',
    Zhejiang: '2015',
    Beijing: '2015',
    Shanghai: '2015',
    Guangdong: '2012',
    'Hong Kong': '2012',
    Macau: '2012',
    Liaoning: '2012',
    Sichuan: '2010',
    Jiangsu: '2010',
    Shanxi: 'Childhood',
    Yunnan: 'Childhood',
    Jiangxi: 'Childhood',
    Hunan: 'Childhood',
    Hubei: 'Childhood',
    Chongqing: 'Childhood'
  },
  us: {
    Iowa: '2015',
    California: '2015',
    Illinois: '2016',
    Connecticut: '2017',
    Delaware: '2017',
    Massachusetts: '2017',
    'New Jersey': '2017',
    'New York': '2017',
    Pennsylvania: '2017',
    'Rhode Island': '2017',
    Nevada: '2017',
    Arizona: '2023',
    Oregon: '2023',
    Washington: '2023',
    Alaska: '2025',
    Hawaii: '2026',
    Utah: '2026',
    Montana: '2026',
    Wyoming: '2026'
  }
} as const satisfies Record<MapKey, Record<string, string>>

/* Chinese place-name labels. The mapped type locks each map's keys to
   DATA's keys, so a typo or a missing label fails tsc. For the china map
   these double as the atlas lookup keys (the atlas names features in
   Chinese). */
export const ZH_LABELS: { [K in MapKey]: Record<keyof (typeof DATA)[K], string> } = {
  world: {
    China: '中国',
    'United States': '美国',
    France: '法国',
    Italy: '意大利',
    Switzerland: '瑞士',
    Canada: '加拿大'
  },
  china: {
    Anhui: '安徽',
    Heilongjiang: '黑龙江',
    Jilin: '吉林',
    Zhejiang: '浙江',
    Beijing: '北京',
    Shanghai: '上海',
    Guangdong: '广东',
    'Hong Kong': '香港',
    Macau: '澳门',
    Liaoning: '辽宁',
    Sichuan: '四川',
    Jiangsu: '江苏',
    Shanxi: '山西',
    Yunnan: '云南',
    Jiangxi: '江西',
    Hunan: '湖南',
    Hubei: '湖北',
    Chongqing: '重庆'
  },
  us: {
    Iowa: '艾奥瓦',
    California: '加利福尼亚',
    Illinois: '伊利诺伊',
    Connecticut: '康涅狄格',
    Delaware: '特拉华',
    Massachusetts: '马萨诸塞',
    'New Jersey': '新泽西',
    'New York': '纽约',
    Pennsylvania: '宾夕法尼亚',
    'Rhode Island': '罗得岛',
    Nevada: '内华达',
    Arizona: '亚利桑那',
    Oregon: '俄勒冈',
    Washington: '华盛顿',
    Alaska: '阿拉斯加',
    Hawaii: '夏威夷',
    Utah: '犹他',
    Montana: '蒙大拿',
    Wyoming: '怀俄明'
  }
}

export function countFor(key: MapKey): number {
  return Object.keys(DATA[key]).length
}
```

- [ ] **Step 5: Write `lib/paths.ts`**

```ts
import type { Locale, MapKey } from './i18n'

const MAP_SLUG: Record<MapKey, string> = {
  world: '',
  china: 'china',
  us: 'united-states'
}

/* World lives at the locale root; trailing slashes match trailingSlash: true
   so links never bounce through a redirect. */
export function pathFor(locale: Locale, map: MapKey): string {
  const segs: string[] = []
  if (locale === 'zh') segs.push('zh')
  if (MAP_SLUG[map]) segs.push(MAP_SLUG[map])
  return segs.length ? `/${segs.join('/')}/` : '/'
}
```

- [ ] **Step 6: Write `lib/normalize.ts`**

```ts
/* Region-name matching, ported from the design prototype. Both the map
   engine and scripts/check-data.mjs use exactly this logic, so what the
   build gate verifies is what the browser draws. */

const ALIAS: Record<string, string> = {
  'united states of america': 'united states',
  usa: 'united states',
  hongkong: 'hong kong',
  xianggang: 'hong kong',
  macao: 'macau',
  aomen: 'macau',
  'nei mongol': 'inner mongolia',
  'xinjiang uygur': 'xinjiang',
  'ningxia hui': 'ningxia',
  'guangxi zhuang': 'guangxi',
  xizang: 'tibet'
}

const STRIP =
  /\b(sheng|shi|province|municipality|zizhiqu|autonomous region|special administrative region|sar|zhuang|hui|uygur|uyghur)\b/g

export function norm(s: unknown): string {
  if (!s) return ''
  const v = String(s)
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(STRIP, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return ALIAS[v] ?? v
}

export function featureName(props: Record<string, unknown> | null | undefined): string {
  if (!props) return ''
  for (const k of ['name', 'NAME_1', 'NAME', 'name_1', 'NAME_ENG', 'admin', 'full_name', 'state']) {
    const v = props[k]
    if (typeof v === 'string' && v) return v
  }
  return ''
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in all three files.

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add lib/ tests/
git commit -m "feat: add i18n strings, visit data, path builder, and name normalization"
```

---

### Task 3: Committed atlas data + build-time region-name gate

**Files:**
- Create: `public/atlas/world.json`, `public/atlas/china.json`, `public/atlas/us.json` (downloaded, ~108KB/344KB/115KB)
- Create: `scripts/check-data.mjs`
- Modify: `package.json` (add `prebuild` script)

**Interfaces:**
- Consumes: `DATA`, `ZH_LABELS` from `lib/data.ts`; `norm`, `featureName` from `lib/normalize.ts`; `topojson-client`.
- Produces: `/atlas/{world,china,us}.json` static URLs the engine fetches (Task 5); `npm run check-data` exits non-zero listing any visited place that matches no atlas feature; `prebuild` makes every `npm run build` run the gate first.

- [ ] **Step 1: Download the atlas files**

```bash
mkdir -p public/atlas
curl -sL -o public/atlas/world.json "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json"
curl -sL -o public/atlas/us.json "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json"
curl -sL -o public/atlas/china.json "https://cdn.jsdelivr.net/npm/china-geojson@1.0.0/src/geojson/china.json"
ls -la public/atlas/
```

Expected sizes roughly: world 107KB, us 114KB, china 344KB. Sanity-check content:

```bash
node -e "const w=require('./public/atlas/world.json');console.log(w.type, Object.keys(w.objects))"
node -e "const c=require('./public/atlas/china.json');console.log(c.type, c.features.length)"
```

Expected: `Topology [ 'countries', 'land' ]` and `FeatureCollection 35`.

- [ ] **Step 2: Write `scripts/check-data.mjs`**

Runs under plain Node 24 (type stripping lets it import the `.ts` lib files).

```js
/* Build gate: every visited place in lib/data.ts must match a feature in
   its committed atlas, using the same norm() logic the map engine uses.
   Exits non-zero listing unmatched names — a misspelled region fails the
   deploy instead of silently vanishing from the map. */
import { readFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { DATA, ZH_LABELS } from '../lib/data.ts'
import { featureName, norm } from '../lib/normalize.ts'

const ATLAS = {
  world: 'public/atlas/world.json',
  china: 'public/atlas/china.json',
  us: 'public/atlas/us.json'
}

function featuresOf(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  if (raw.type === 'Topology') {
    const first = Object.keys(raw.objects)[0]
    return feature(raw, raw.objects[first]).features
  }
  return raw.features
}

let failed = false

for (const [key, file] of Object.entries(ATLAS)) {
  const names = new Set()
  for (const f of featuresOf(file)) {
    const n = featureName(f.properties)
    names.add(n)
    names.add(norm(n))
  }
  const missing = Object.keys(DATA[key]).filter(place => {
    const candidates = [norm(place)]
    if (key === 'china') candidates.push(ZH_LABELS.china[place])
    return !candidates.some(c => names.has(c))
  })
  if (missing.length) {
    failed = true
    console.error(`[check-data] ${key}: no atlas feature matches: ${missing.join(', ')}`)
  } else {
    console.log(`[check-data] ${key}: ${Object.keys(DATA[key]).length} places all matched`)
  }
}

if (failed) process.exit(1)
```

- [ ] **Step 3: Run the gate — expect pass**

Run: `npm run check-data`
Expected output (exit 0):

```
[check-data] world: 6 places all matched
[check-data] china: 18 places all matched
[check-data] us: 19 places all matched
```

- [ ] **Step 4: Verify the gate actually fails on a bad name**

Temporarily add `Atlantis: '2020',` as the first entry of the `us` object in `lib/data.ts`, then:

Run: `npm run check-data`
Expected: exit 1 with `[check-data] us: no atlas feature matches: Atlantis`.

Remove the `Atlantis` line, run `npm run check-data` again, expect exit 0. Confirm `git diff lib/data.ts` is empty.

- [ ] **Step 5: Wire the gate into every build**

In `package.json` `"scripts"`, add (alphabetically before `"build"`):

```json
    "prebuild": "node scripts/check-data.mjs",
```

Run: `npm run build`
Expected: check-data output appears first, then the Next build succeeds.

- [ ] **Step 6: Commit**

```bash
git add public/atlas/ scripts/check-data.mjs package.json
git commit -m "feat: commit atlas data and add build-time region-name gate"
```

---

### Task 4: Global styles, fonts, and the real root layout

**Files:**
- Create: `styles/broadsheet.css`, `styles/base.css`, `components/LangAttr.tsx`
- Modify: `app/layout.tsx` (replace placeholder)

**Interfaces:**
- Consumes: nothing from earlier tasks (CSS-only classes; `LangAttr` uses only Next APIs).
- Produces: global CSS classes used by Task 6's markup (`.sheet`, `.masthead`, `.dateline`, `.spacer`, `.lang`, `.sep`, `.tabs`, `.tab`, `.panel-head`, `.kicker`, `.count`, `.fig`, `.unit`, `.legend`, `.sw-visited`, `.sw-not`, `.map`) and by Task 5's engine (`.region`, `.tip`, `.tip-name`, `.tip-year`, `.tip-dim`, `.map-loading`, `.map-reset`); CSS variables `--font-source-serif` / `--font-noto-serif-sc` defined by `next/font` in the layout; `<LangAttr />` mounted in the layout keeping `<html lang>` in sync with the route.

- [ ] **Step 1: Write `styles/broadsheet.css`**

Design-system tokens from the Claude Design "Broadsheet" system, trimmed to what this site uses (the print-plate/CMYK blocks, buttons, forms, cards, tags, nav, tables, and dialog components are deliberately dropped; the secondary accent ramp and process yellow went with them). Font tokens point at the `next/font` variables set in the layout.

```css
/* Broadsheet design-system tokens (from the Claude Design project, trimmed
   to what this site uses). */

:root {
  --color-bg: #f3f2f2;
  --color-surface: #eae9e9;
  --color-text: #201e1d;
  --color-accent: #0088b0;
  --color-divider: color-mix(in srgb, #201e1d 16%, transparent);

  --color-neutral-100: #f8f4f4;
  --color-neutral-200: #eae7e7;
  --color-neutral-300: #d7d3d3;
  --color-neutral-400: #bab6b6;
  --color-neutral-500: #9b9797;
  --color-neutral-600: #7d7979;
  --color-neutral-700: #605d5d;
  --color-neutral-800: #444141;
  --color-neutral-900: #2d2b2b;

  --color-accent-100: #e9f8ff;
  --color-accent-200: #cbeeff;
  --color-accent-300: #99e0ff;
  --color-accent-400: #62c5ee;
  --color-accent-500: #38a6cf;
  --color-accent-600: #1186ac;
  --color-accent-700: #006786;
  --color-accent-800: #004961;
  --color-accent-900: #0a303e;

  /* Font families come from next/font variables set on <html> in layout.tsx. */
  --font-heading: var(--font-source-serif), Georgia, serif;
  --font-heading-weight: 600;
  --font-body: var(--font-source-serif), Georgia, serif;

  --space-1: 5px;
  --space-2: 10px;
  --space-3: 15px;
  --space-4: 20px;
  --space-6: 30px;
  --space-8: 40px;

  --radius-sm: 1px;
  --radius-md: 2px;
  --radius-lg: 4px;

  --shadow-sm: 0 1px 2px color-mix(in srgb, #2d2b2b 14%, transparent);
  --shadow-md: 0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent);
  --shadow-lg: 0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-heading-weight);
  line-height: 1.12;
  letter-spacing: -0.015em;
  margin: 0;
}
```

- [ ] **Step 2: Write `styles/base.css`**

The design's `base.css` plus the tab/panel styles that lived in `mymaps-tabs.html`'s inline `<style>`, adapted: the two `@import` lines are gone (design system flattened to `broadsheet.css`; fonts via `next/font`), tabs/language toggles are links (`aria-current`) instead of buttons (`aria-selected`/`aria-pressed`), and the unused `.foot`, `.sec-title`, and `.panel-head .lede` rules are dropped.

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

/* Source Serif 4 carries no CJK glyphs — keep the serif voice in 中 mode. */
:lang(zh) body, :lang(zh) h1, :lang(zh) button, :lang(zh) a, :lang(zh) .count .fig, :lang(zh) .tip {
  font-family: var(--font-source-serif), var(--font-noto-serif-sc), 'Songti SC', serif;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--color-accent-700);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent-700) 35%, transparent);
}
a:hover { color: var(--color-accent-600); border-bottom-color: var(--color-accent-600); }
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
::selection { background: var(--color-accent-200); }

.sheet { max-width: 1180px; margin: 0 auto; padding: var(--space-8) var(--space-6); }

/* Masthead — thick-thin head pair around the dateline rail */
.masthead { border-top: 6px solid var(--color-text); padding-top: var(--space-3); }
.masthead h1 {
  font-size: clamp(44px, 6.2vw, 82px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-3);
}
.dateline {
  border-top: 1px solid var(--color-text);
  border-bottom: 1px solid var(--color-text);
  padding: 6px 0;
  display: flex;
  gap: var(--space-6);
  align-items: baseline;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-neutral-700);
}
.dateline .spacer { flex: 1; }

/* Language toggle (links, not buttons: locale is a route) */
.lang {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.lang a { color: var(--color-neutral-500); border-bottom: none; }
.lang a:hover { color: var(--color-accent-600); }
.lang a[aria-current='true'] { color: var(--color-text); font-weight: 600; }
.lang .sep { color: var(--color-neutral-400); }

/* Tabs (links, not buttons: each tab is a route) */
.tabs { display: flex; gap: var(--space-6); margin: var(--space-8) 0 var(--space-6); }
.tab {
  font-family: var(--font-heading);
  font-size: 26px;
  letter-spacing: -0.01em;
  padding: 0 0 8px;
  color: var(--color-neutral-500);
  border-bottom: 3px solid transparent;
}
.tab:hover { color: var(--color-accent-600); border-bottom-color: transparent; }
.tab[aria-current='page'] { color: var(--color-text); border-bottom-color: var(--color-accent); }
:lang(zh) .tab, :lang(zh) h1 { letter-spacing: 0; }

/* Panel head: kicker + count on the left, legend on the right */
.panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-8);
  margin-bottom: var(--space-4);
}
.kicker {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-neutral-600);
}
.count { display: flex; align-items: baseline; gap: var(--space-2); }
.count .fig {
  font-family: var(--font-heading);
  font-size: 62px;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--color-accent);
}
.count .unit { font-size: 17px; color: var(--color-neutral-700); }

/* Legend */
.legend { display: flex; gap: var(--space-4); font-size: 13px; color: var(--color-neutral-700); }
.legend span { display: flex; align-items: center; gap: 7px; }
.legend i { width: 13px; height: 13px; display: block; border-radius: 1px; }
.sw-visited { background: var(--color-accent); }
.sw-not { background: var(--color-neutral-300); }

/* Map */
.map { width: 100%; position: relative; }
.map svg { cursor: grab; touch-action: none; overflow: hidden; }
.map svg:active { cursor: grabbing; }
.map-reset {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  padding: 5px 11px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}
.map-reset:hover { color: var(--color-accent-700); border-color: var(--color-accent-700); }
.region {
  fill: var(--color-neutral-300);
  stroke: var(--color-bg);
  stroke-width: 0.6;
  transition: fill 120ms ease;
}
.region[data-visited='yes'] { fill: var(--color-accent); }
.region[data-visited='yes']:hover { fill: var(--color-accent-700); }
.region[data-visited='no']:hover { fill: var(--color-neutral-400); }
.map-loading { padding: var(--space-8) 0; color: var(--color-neutral-600); font-style: italic; }

/* Tooltip (attached to <body> by the engine) */
.tip {
  position: fixed;
  z-index: 50;
  pointer-events: none;
  opacity: 0;
  transition: opacity 90ms ease;
  background: #fff;
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  padding: 5px 10px;
  font-family: var(--font-body);
  font-size: 15px;
  display: flex;
  gap: 10px;
  align-items: baseline;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}
.tip-name { font-weight: 600; }
.tip-year { color: var(--color-accent-700); font-style: italic; }
.tip-dim { color: var(--color-neutral-600); font-weight: 400; }
```

- [ ] **Step 3: Write `components/LangAttr.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/* Single root layout means the static shell says lang="en" everywhere;
   this corrects it to zh on /zh/* after hydration (accepted trade-off in
   the spec). */
export default function LangAttr() {
  const pathname = usePathname()
  useEffect(() => {
    const zh = pathname === '/zh' || pathname.startsWith('/zh/')
    document.documentElement.lang = zh ? 'zh' : 'en'
  }, [pathname])
  return null
}
```

- [ ] **Step 4: Replace `app/layout.tsx`**

`Noto_Serif_SC` needs `preload: false` (Google Fonts exposes no subset next/font can preload for CJK).

```tsx
import type { Metadata } from 'next'
import { Noto_Serif_SC, Source_Serif_4 } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import LangAttr from '@/components/LangAttr'
import '@/styles/broadsheet.css'
import '@/styles/base.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif'
})

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600'],
  variable: '--font-noto-serif-sc',
  preload: false
})

export const metadata: Metadata = {
  title: 'My Maps',
  description: 'Places I have been'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${notoSerifSC.variable}`}>
      <body>
        <LangAttr />
        {children}
      </body>
      <GoogleAnalytics gaId="G-ZJY9VYC238" />
    </html>
  )
}
```

- [ ] **Step 5: Verify build and styling**

Run: `npm run build`
Expected: succeeds. Then `grep -o 'G-ZJY9VYC238' out/index.html | head -1` prints the GA id, and `grep -rl 'font-source-serif' out/_next/static/` lists at least one CSS file (the token reference lives in the built CSS, not the HTML).

- [ ] **Step 6: Commit**

```bash
git add styles/ components/LangAttr.tsx app/layout.tsx
git commit -m "feat: add Broadsheet styles, self-hosted fonts, and root layout"
```

---

### Task 5: Map engine and GeoMap client component

**Files:**
- Create: `lib/geo.ts`, `components/GeoMap.tsx`

**Interfaces:**
- Consumes: `DATA`, `ZH_LABELS` (`lib/data.ts`); `I18N`, `YEAR_ZH`, `Locale`, `MapKey` (`lib/i18n.ts`); `norm`, `featureName` (`lib/normalize.ts`); `pathFor` (`lib/paths.ts`); CSS classes `.region`, `.tip*`, `.map-loading`, `.map-reset` (Task 4); `/atlas/*.json` (Task 3).
- Produces: `drawMap(key, el, { locale, onDrill?, isStale? }): Promise<void>` in `lib/geo.ts`; default-export React component `GeoMap({ mapKey, locale })` in `components/GeoMap.tsx` — the only component Task 6 needs from this task.

- [ ] **Step 1: Write `lib/geo.ts`**

Ported from the design prototype's `maps.js`. Bundler-only module (d3 imports), so extensionless imports are fine here.

```ts
/* Vector map engine (d3-geo + TopoJSON), ported from the Claude Design
   prototype. Draws into a plain element; React stays outside. */
import { geoAlbersUsa, geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom'
import 'd3-transition'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { DATA, ZH_LABELS } from './data'
import { I18N, YEAR_ZH, type Locale, type MapKey } from './i18n'
import { featureName, norm } from './normalize'

type Region = Feature<Geometry, Record<string, unknown>>
type Entry = { label: string; year: string }

export interface DrawOptions {
  locale: Locale
  /* World-map clicks on China / the US drill into that map's route. */
  onDrill?: (target: 'china' | 'us') => void
  /* Lets the caller abandon a draw that lost a race (map switched mid-fetch). */
  isStale?: () => boolean
}

const ATLAS_PATH: Record<MapKey, string> = {
  world: '/atlas/world.json',
  china: '/atlas/china.json',
  us: '/atlas/us.json'
}

const HIDE: Record<MapKey, string[]> = {
  world: ['antarctica'],
  china: ['南海诸岛'],
  us: []
}

const ASPECT: Record<MapKey, number> = { world: 0.52, china: 0.72, us: 0.58 }

const PROJ: Record<MapKey, () => GeoProjection> = {
  world: geoNaturalEarth1,
  china: geoMercator,
  us: geoAlbersUsa
}

const cache: Partial<Record<MapKey, Region[]>> = {}

async function loadFeatures(key: MapKey): Promise<Region[]> {
  const hit = cache[key]
  if (hit) return hit
  const res = await fetch(ATLAS_PATH[key])
  if (!res.ok) throw new Error(`atlas ${key}: HTTP ${res.status}`)
  const raw = await res.json()
  const fc = (
    raw.type === 'Topology'
      ? feature(raw, raw.objects[Object.keys(raw.objects)[0]])
      : raw
  ) as FeatureCollection<Geometry, Record<string, unknown>>
  cache[key] = fc.features
  return fc.features
}

let tip: HTMLDivElement | null = null
function tooltip(): HTMLDivElement {
  if (!tip) {
    tip = document.createElement('div')
    tip.className = 'tip'
    document.body.appendChild(tip)
  }
  return tip
}

export async function drawMap(key: MapKey, el: HTMLElement, opts: DrawOptions): Promise<void> {
  const { locale, onDrill, isStale } = opts
  const features = await loadFeatures(key)
  if (isStale?.()) return

  const visited: Record<string, string> = DATA[key]
  const zhLabels: Record<string, string> = ZH_LABELS[key]
  const lookup = new Map<string, Entry>()
  for (const place of Object.keys(visited)) {
    const raw = visited[place]
    const entry: Entry = {
      label: locale === 'zh' ? (zhLabels[place] ?? place) : place,
      year: locale === 'zh' ? (YEAR_ZH[raw] ?? raw) : raw
    }
    lookup.set(norm(place), entry)
    /* The china atlas names features in Chinese — index by label too. */
    if (key === 'china') lookup.set(zhLabels[place], entry)
  }

  const w = el.clientWidth || 900
  const h = Math.round(w * ASPECT[key])

  el.innerHTML = ''
  const svg = select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('width', '100%')
    .attr('height', h)
    .style('display', 'block')

  const shown = features.filter(f => {
    const n = featureName(f.properties)
    return !HIDE[key].includes(n) && !HIDE[key].includes(norm(n))
  })

  const projection = PROJ[key]()
  projection.fitSize([w, h], { type: 'FeatureCollection', features: shown })
  const path = geoPath(projection)

  const t = tooltip()
  const g = svg.append('g')

  g.selectAll<SVGPathElement, Region>('path')
    .data(shown)
    .join('path')
    .attr('d', d => path(d))
    .attr('class', 'region')
    .attr('data-visited', d => {
      const nm = featureName(d.properties)
      return lookup.has(nm) || lookup.has(norm(nm)) ? 'yes' : 'no'
    })
    .on('mousemove', (ev: MouseEvent, d: Region) => {
      const name = featureName(d.properties)
      const hit = lookup.get(name) ?? lookup.get(norm(name))
      /* Content comes from our own data files and atlas — no user input. */
      t.innerHTML = hit
        ? `<span class="tip-name">${hit.label}</span><span class="tip-year">${hit.year}</span>`
        : `<span class="tip-name tip-dim">${name}</span>`
      t.style.opacity = '1'
      t.style.left = `${ev.clientX + 14}px`
      t.style.top = `${ev.clientY + 14}px`
    })
    .on('mouseleave', () => {
      t.style.opacity = '0'
    })
    .on('click', (_ev: MouseEvent, d: Region) => {
      if (key !== 'world' || !onDrill) return
      const n = norm(featureName(d.properties))
      if (n === 'china') onDrill('china')
      else if (n === 'united states') onDrill('us')
    })

  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'map-reset'
  reset.textContent = I18N[locale].reset
  reset.hidden = true
  el.appendChild(reset)

  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([[0, 0], [w, h]])
    .extent([[0, 0], [w, h]])
    .on('zoom', (ev: D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', ev.transform.toString())
      g.attr('stroke-width', 0.6 / ev.transform.k)
      reset.hidden = ev.transform.k === 1 && ev.transform.x === 0 && ev.transform.y === 0
      if (ev.sourceEvent) t.style.opacity = '0'
    })

  svg.call(zoomBehavior).on('dblclick.zoom', null)
  reset.addEventListener('click', () => {
    svg.transition().duration(400).call(zoomBehavior.transform, zoomIdentity)
  })
}
```

If `tsc` complains about the `.call(zoomBehavior.transform, zoomIdentity)` transition overload or the `feature(...)` topojson types, use a targeted `as` cast at that expression only — do not weaken the exported signatures.

- [ ] **Step 2: Write `components/GeoMap.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { drawMap } from '@/lib/geo'
import { I18N, type Locale, type MapKey } from '@/lib/i18n'
import { pathFor } from '@/lib/paths'

export default function GeoMap({ mapKey, locale }: { mapKey: MapKey; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const t = I18N[locale]
    let epoch = 0

    const draw = () => {
      const mine = ++epoch
      const isStale = () => mine !== epoch
      el.innerHTML = `<div class="map-loading">${t.loading}</div>`
      drawMap(mapKey, el, {
        locale,
        isStale,
        onDrill: target => router.push(pathFor(locale, target))
      }).catch(err => {
        if (!isStale()) {
          el.innerHTML = `<div class="map-loading">${t.failed}</div>`
          console.error(err)
        }
      })
    }

    draw()

    /* GeoChart-era lesson kept from the old site: only redraw on real width
       changes (24px threshold), or resize events cause redraw storms. */
    let lastWidth = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (Math.abs(el.clientWidth - lastWidth) < 24) return
      lastWidth = el.clientWidth
      draw()
    })
    ro.observe(el)

    return () => {
      epoch = Number.MAX_SAFE_INTEGER // stale-out any in-flight draw
      ro.disconnect()
      el.innerHTML = ''
    }
  }, [mapKey, locale, router])

  return <div ref={ref} className="map" />
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (see Step 1's note on permitted targeted casts).

- [ ] **Step 4: Verify the build still passes**

Run: `npm run build`
Expected: succeeds. (`GeoMap` isn't rendered by any page yet — Task 6 wires it up and does the visual verification.)

- [ ] **Step 5: Commit**

```bash
git add lib/geo.ts components/GeoMap.tsx
git commit -m "feat: add d3 map engine and GeoMap client component"
```

---

### Task 6: MapPage and the six routes

**Files:**
- Create: `components/MapPage.tsx`, `app/china/page.tsx`, `app/united-states/page.tsx`, `app/zh/page.tsx`, `app/zh/china/page.tsx`, `app/zh/united-states/page.tsx`
- Modify: `app/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `GeoMap` (Task 5); `I18N`, `MAP_KEYS`, `Locale`, `MapKey` (`lib/i18n.ts`); `countFor` (`lib/data.ts`); `pathFor` (`lib/paths.ts`); CSS classes (Task 4).
- Produces: `MapPage({ locale, mapKey })` server component; the complete six-route site.

- [ ] **Step 1: Write `components/MapPage.tsx`**

```tsx
import Link from 'next/link'
import GeoMap from '@/components/GeoMap'
import { countFor } from '@/lib/data'
import { I18N, MAP_KEYS, type Locale, type MapKey } from '@/lib/i18n'
import { pathFor } from '@/lib/paths'

export default function MapPage({ locale, mapKey }: { locale: Locale; mapKey: MapKey }) {
  const t = I18N[locale]
  return (
    <div className="sheet">
      <header className="masthead">
        <h1>{t.title}</h1>
        <div className="dateline">
          <span>{t.tagline}</span>
          <span className="spacer" />
          <span>{t.updated}</span>
          <span className="lang">
            <Link href={pathFor('en', mapKey)} aria-current={locale === 'en' ? 'true' : undefined}>
              En
            </Link>
            <span className="sep">/</span>
            <Link href={pathFor('zh', mapKey)} aria-current={locale === 'zh' ? 'true' : undefined}>
              中
            </Link>
          </span>
        </div>
      </header>

      <nav className="tabs">
        {MAP_KEYS.map(k => (
          <Link
            key={k}
            className="tab"
            href={pathFor(locale, k)}
            aria-current={k === mapKey ? 'page' : undefined}
          >
            {t.tabs[k]}
          </Link>
        ))}
      </nav>

      <section>
        <div className="panel-head">
          <div>
            <div className="kicker">{t.kicker[mapKey]}</div>
            <div className="count">
              <span className="fig">{countFor(mapKey)}</span>
              <span className="unit">{t.unit[mapKey]}</span>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="sw-visited" /> {t.visited}
            </span>
            <span>
              <i className="sw-not" /> {t.notYet}
            </span>
          </div>
        </div>
        <GeoMap mapKey={mapKey} locale={locale} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Write the six route files**

`app/page.tsx` (replace placeholder):

```tsx
import MapPage from '@/components/MapPage'

export const metadata = { title: 'My Maps' }

export default function Page() {
  return <MapPage locale="en" mapKey="world" />
}
```

`app/china/page.tsx`:

```tsx
import MapPage from '@/components/MapPage'

export const metadata = { title: 'China — My Maps' }

export default function Page() {
  return <MapPage locale="en" mapKey="china" />
}
```

`app/united-states/page.tsx`:

```tsx
import MapPage from '@/components/MapPage'

export const metadata = { title: 'United States — My Maps' }

export default function Page() {
  return <MapPage locale="en" mapKey="us" />
}
```

`app/zh/page.tsx`:

```tsx
import MapPage from '@/components/MapPage'

export const metadata = { title: '我的地图' }

export default function Page() {
  return <MapPage locale="zh" mapKey="world" />
}
```

`app/zh/china/page.tsx`:

```tsx
import MapPage from '@/components/MapPage'

export const metadata = { title: '中国 — 我的地图' }

export default function Page() {
  return <MapPage locale="zh" mapKey="china" />
}
```

`app/zh/united-states/page.tsx`:

```tsx
import MapPage from '@/components/MapPage'

export const metadata = { title: '美国 — 我的地图' }

export default function Page() {
  return <MapPage locale="zh" mapKey="us" />
}
```

- [ ] **Step 3: Build and verify all six exports**

Run: `npm run build && ls out/index.html out/china/index.html out/united-states/index.html out/zh/index.html out/zh/china/index.html out/zh/united-states/index.html`
Expected: all six files exist. Then:

Run: `grep -l '我的地图' out/zh/index.html out/zh/china/index.html out/zh/united-states/index.html`
Expected: all three zh files listed (server-rendered Chinese chrome).

Run: `grep -o '<span class="fig">[0-9]*</span>' out/united-states/index.html`
Expected: `<span class="fig">19</span>` (derived count, server-rendered).

- [ ] **Step 4: Manual smoke test in the dev server**

Run: `npm run dev`, open `http://localhost:3000`, and check:

1. World map draws; 6 countries in accent blue; hovering France shows "France 2013"; hovering an unvisited country shows its dimmed name.
2. Clicking the China tab swaps content in place (no full page load — the browser doesn't flash); URL becomes `/china/`; count shows 18.
3. On `/china/`, hovering 安徽 shows "Anhui Home" (en) — and on `/zh/china/`, "安徽 故乡".
4. 中 toggle from `/china/` lands on `/zh/china/` with Chinese chrome; `document.documentElement.lang` is `zh` (check in devtools console).
5. On the world map, clicking China navigates to `/china/` (or `/zh/china/` from `/zh/`).
6. Scroll-zoom and drag pan the map; "Reset view" appears when transformed and animates back; double-click does NOT zoom.
7. 南海诸岛 inset and Antarctica do not render.
8. Narrow the window by >24px: map redraws at the new width.

If a browser isn't available in this environment, run the checks that are scriptable (`curl -s http://localhost:3000/zh/china/ | grep 安徽`) and flag the rest for the user to verify.

- [ ] **Step 5: Commit**

```bash
git add components/MapPage.tsx app/
git commit -m "feat: add MapPage and all six bilingual routes"
```

---

### Task 7: Remove legacy site files and rewrite CLAUDE.md

**Files:**
- Delete: `index.html`, `script.js`
- Modify: `CLAUDE.md` (full rewrite)

**Interfaces:**
- Consumes: nothing.
- Produces: a repo whose only site implementation is the Next.js app; CLAUDE.md describing it.

- [ ] **Step 1: Delete the legacy files**

```bash
git rm index.html script.js
```

- [ ] **Step 2: Rewrite `CLAUDE.md`** with exactly this content:

```markdown
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
```

- [ ] **Step 3: Verify the build is unaffected**

Run: `npm test && npm run build`
Expected: tests pass; build succeeds; `out/index.html` is the Next.js page (contains `class="sheet"`), not the legacy page: `grep -c 'class="sheet"' out/index.html` ≥ 1.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy static site and rewrite CLAUDE.md"
```

---

### Task 8: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm test`, `npm run build` (with its `prebuild` data gate), `out/`.
- Produces: automated Pages deployment on every push to `master`.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Validate the YAML parses**

Run: `node -e "const fs=require('fs');const y=fs.readFileSync('.github/workflows/deploy.yml','utf8');console.log(y.includes('node-version: 24')&&y.includes('path: out')?'ok':'MISSING KEYS')"`
Expected: `ok`. (If `npx yaml` or `python3 -c "import yaml"` is available, prefer a real parse.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: deploy to GitHub Pages via Actions"
```

- [ ] **Step 4: Note the manual step for the user**

Record in the final report: **the user must flip repo Settings → Pages → Build and deployment → Source to "GitHub Actions"** (one-time). Until then, pushes build but don't publish. Do not push to `master` without the user's go-ahead.

---

### Task 9: Full verification pass

**Files:** none created — this task gates completion.

**Interfaces:**
- Consumes: everything.
- Produces: evidence the site works, reported to the user.

- [ ] **Step 1: Clean full build from scratch**

```bash
rm -rf out .next
npm test && npm run build
```

Expected: tests pass, check-data reports all three maps matched, build succeeds.

- [ ] **Step 2: Verify the export inventory**

```bash
ls out/index.html out/404.html out/CNAME \
  out/china/index.html out/united-states/index.html \
  out/zh/index.html out/zh/china/index.html out/zh/united-states/index.html \
  out/atlas/world.json out/atlas/china.json out/atlas/us.json
```

Expected: every file listed exists.

- [ ] **Step 3: Serve the export and probe every route like Pages would**

```bash
python3 -m http.server 8123 -d out & SERVER_PID=$!
sleep 1
for r in / /china/ /united-states/ /zh/ /zh/china/ /zh/united-states/; do
  echo "$r -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8123$r)"
done
curl -s http://localhost:8123/zh/united-states/ | grep -o '美国' | head -1
curl -s http://localhost:8123/ | grep -o 'G-ZJY9VYC238' | head -1
kill $SERVER_PID
```

Expected: six `200`s; `美国`; `G-ZJY9VYC238`.

- [ ] **Step 4: Browser smoke test**

Repeat Task 6 Step 4's checklist against the served `out/` (port 8123) rather than the dev server — this exercises the actual static export. If no browser is available, state exactly which checks were script-verified and which remain for the user.

- [ ] **Step 5: Report**

Summarize to the user: what was built, test/build evidence, the one manual step (Pages → "GitHub Actions"), and that pushing to `master` will deploy once flipped.
