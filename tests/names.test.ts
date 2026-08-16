import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NAMES } from '../lib/names.ts'
import { I18N, MAP_KEYS, titleFor } from '../lib/i18n.ts'

/* Coverage against the real atlas files is enforced by
   scripts/check-data.mjs, which can read them. These cover what is
   checkable without the atlases. */

test('every region name is filled in for both locales', () => {
  for (const key of MAP_KEYS) {
    for (const [atlasName, entry] of Object.entries(NAMES[key])) {
      assert.ok(entry.en, `${key}.${atlasName} is missing an English name`)
      assert.ok(entry.zh, `${key}.${atlasName} is missing a Chinese name`)
    }
  }
})

test('Chinese names carry no latin letters, English names carry no han', () => {
  for (const key of MAP_KEYS) {
    for (const [atlasName, entry] of Object.entries(NAMES[key])) {
      assert.ok(
        !/[一-鿿]/.test(entry.en),
        `${key}.${atlasName} English name contains Chinese characters: ${entry.en}`
      )
      assert.ok(
        !/[a-z]/i.test(entry.zh),
        `${key}.${atlasName} Chinese name contains latin letters: ${entry.zh}`
      )
    }
  }
})

test('Shanxi and Shaanxi stay distinct', () => {
  assert.equal(NAMES.china['山西'].en, 'Shanxi')
  assert.equal(NAMES.china['陕西'].en, 'Shaanxi')
})

test('titleFor builds "<map> | <site>" in both locales', () => {
  assert.equal(titleFor('en', 'world'), 'World | My Maps')
  assert.equal(titleFor('en', 'china'), 'China | My Maps')
  assert.equal(titleFor('en', 'us'), 'United States | My Maps')
  assert.equal(titleFor('zh', 'world'), '世界 | 我的地图')
  assert.equal(titleFor('zh', 'china'), '中国 | 我的地图')
  assert.equal(titleFor('zh', 'us'), '美国 | 我的地图')
})

test('every map key has a title in both locales', () => {
  for (const key of MAP_KEYS) {
    for (const locale of ['en', 'zh'] as const) {
      assert.ok(titleFor(locale, key).includes(I18N[locale].title))
    }
  }
})
