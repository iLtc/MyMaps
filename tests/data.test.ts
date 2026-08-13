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
