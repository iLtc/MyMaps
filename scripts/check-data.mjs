/* Build gate, two checks, both exiting non-zero with the offending names:

   1. Every visited place in lib/data.ts must match a feature in its
      committed atlas, using the same norm() logic the map engine uses —
      a misspelled region fails the deploy instead of silently vanishing
      from the map.
   2. Every atlas feature must have an en and a zh display name in
      lib/names.ts, and those must agree with the Chinese label a visited
      place carries in lib/data.ts. Without this, a new or updated atlas
      would quietly reintroduce regions that render in the wrong language. */
import { readFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { DATA, ZH_LABELS } from '../lib/data.ts'
import { NAMES } from '../lib/names.ts'
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
  const features = featuresOf(file)
  const names = new Set()
  for (const f of features) {
    const n = featureName(f.properties)
    if (n) names.add(n)
    const nn = norm(n)
    if (nn) names.add(nn)
  }

  /* Check 1 — every visited place matches an atlas feature. */
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

  /* Check 2a — every atlas feature has a display name in both locales. */
  const unnamed = []
  for (const f of features) {
    const n = featureName(f.properties)
    const entry = NAMES[key][n]
    if (!entry || !entry.en || !entry.zh) unnamed.push(n || '(unnamed feature)')
  }
  if (unnamed.length) {
    failed = true
    console.error(`[check-data] ${key}: no en/zh display name for: ${unnamed.join(', ')}`)
  } else {
    console.log(`[check-data] ${key}: ${features.length} features all named in en and zh`)
  }

  /* Check 2b — a visited place's Chinese label must equal what NAMES will
     actually render for the atlas feature it matched, or the tooltip and
     the data file would disagree. */
  const drifted = []
  for (const place of Object.keys(DATA[key])) {
    const zh = ZH_LABELS[key][place]
    const hit = features.find(f => {
      const n = featureName(f.properties)
      return n === zh || n === place || (norm(n) && norm(n) === norm(place))
    })
    if (!hit) continue // already reported by check 1
    const entry = NAMES[key][featureName(hit.properties)]
    if (entry && entry.zh !== zh) {
      drifted.push(`${place} (data: ${zh}, names: ${entry.zh})`)
    }
  }
  if (drifted.length) {
    failed = true
    console.error(`[check-data] ${key}: Chinese label disagrees with lib/names.ts: ${drifted.join(', ')}`)
  }
}

if (failed) process.exit(1)
