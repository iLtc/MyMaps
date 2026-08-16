import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DATA, countFor } from '../lib/data.ts'
import { I18N, MAP_KEYS } from '../lib/i18n.ts'
import { NAMES } from '../lib/names.ts'

test('counts are derived from the data', () => {
  assert.equal(countFor('world'), 6)
  assert.equal(countFor('china'), 18)
  assert.equal(countFor('us'), 19)
})

/* DATA keys are atlas feature names verbatim. That they name a REAL feature
   is checked against the committed atlases by scripts/check-data.mjs; here
   we check the half that needs no atlas — that each one can be displayed. */
test('every visited place has a display name in both locales', () => {
  for (const key of MAP_KEYS) {
    for (const place of Object.keys(DATA[key])) {
      const entry = NAMES[key][place]
      assert.ok(entry, `NAMES.${key} has no entry for visited place "${place}"`)
      assert.ok(entry.en, `NAMES.${key}["${place}"] is missing an English name`)
      assert.ok(entry.zh, `NAMES.${key}["${place}"] is missing a Chinese name`)
    }
  }
})

test('china is keyed in Chinese, world and us in English', () => {
  const han = /[一-鿿]/
  for (const place of Object.keys(DATA.china)) {
    assert.ok(han.test(place), `DATA.china key "${place}" should be the atlas's Chinese name`)
  }
  for (const key of ['world', 'us'] as const) {
    for (const place of Object.keys(DATA[key])) {
      assert.ok(!han.test(place), `DATA.${key} key "${place}" should be the atlas's English name`)
    }
  }
})

test('both locales cover the same string keys', () => {
  assert.deepEqual(Object.keys(I18N.en).sort(), Object.keys(I18N.zh).sort())
})
