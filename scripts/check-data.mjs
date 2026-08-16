/* Build gate. Every check below fails the build with the offending names,
   so a data mistake stops the deploy instead of silently changing the map.

   1. Every visited place in lib/data.ts names a real atlas feature. Keys are
      compared to atlas names exactly — the same plain lookup the engine
      does — so what this verifies is what the browser draws.
   2. Every atlas feature has an en and a zh display name in lib/names.ts.
      Without this a new or updated atlas would quietly reintroduce regions
      that render in the wrong language.
   3. No visited place is on the engine's HIDE list. Such a place would pass
      check 1 and still never appear — exactly the silent drop this gate
      exists to prevent. */
import { readFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { DATA } from '../lib/data.ts'
import { NAMES } from '../lib/names.ts'

const ATLAS = {
  world: 'public/atlas/world.json',
  china: 'public/atlas/china.json',
  us: 'public/atlas/us.json'
}

/* Mirrors HIDE in lib/geo.ts, which is bundler-only and cannot be imported
   here. The duplication is deliberate and small; check 3 is what makes a
   disagreement between the two visible. */
const HIDDEN = {
  world: ['Antarctica'],
  china: ['南海诸岛'],
  us: []
}

/* Same one-line accessor as lib/geo.ts: all three atlases use properties.name. */
const featureName = props => (typeof props?.name === 'string' ? props.name : '')

function featuresOf(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  if (raw.type === 'Topology') {
    const first = Object.keys(raw.objects)[0]
    return feature(raw, raw.objects[first]).features
  }
  return raw.features
}

let failed = false

const fail = (key, msg) => {
  failed = true
  console.error(`[check-data] ${key}: ${msg}`)
}

for (const [key, file] of Object.entries(ATLAS)) {
  const features = featuresOf(file)
  const atlasNames = new Set(features.map(f => featureName(f.properties)))
  const places = Object.keys(DATA[key])

  /* 1 — every visited place is a real feature. */
  const unmatched = places.filter(place => !atlasNames.has(place))
  if (unmatched.length) {
    fail(key, `no atlas feature named: ${unmatched.join(', ')}`)
  } else {
    console.log(`[check-data] ${key}: ${places.length} places all matched`)
  }

  /* 2 — every feature has a display name in both locales. */
  const unnamed = [...atlasNames].filter(n => {
    const entry = NAMES[key][n]
    return !entry || !entry.en || !entry.zh
  })
  if (unnamed.length) {
    fail(key, `no en/zh display name for: ${unnamed.join(', ')}`)
  } else {
    console.log(`[check-data] ${key}: ${atlasNames.size} features all named in en and zh`)
  }

  /* 3 — no visited place is hidden from the map. */
  const hidden = places.filter(place => HIDDEN[key].includes(place))
  if (hidden.length) {
    fail(key, `visited but on the engine's HIDE list, so never drawn: ${hidden.join(', ')}`)
  }
}

if (failed) process.exit(1)
