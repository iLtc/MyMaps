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
