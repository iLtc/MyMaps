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
