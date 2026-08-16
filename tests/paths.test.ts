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
