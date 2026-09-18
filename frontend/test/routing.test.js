import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveView, hasDeepLinkIntent } from '../src/utils/routing.js'

test('routing: a first-time visitor gets the front door', () => {
  assert.equal(resolveView({}, false), 'home')
})

test('routing: a returning visitor goes straight to the tool', () => {
  // A front door helps once and is a toll booth every time after.
  assert.equal(resolveView({}, true), 'map')
})

test('routing: a deep link is never intercepted, even on a first visit', () => {
  for (const params of [
    { state: 'TX' },
    { about: '1' },
    { states: 'CA,TX' },
    { policy: '12' },
    { fstate: 'CA' },
  ]) {
    assert.equal(resolveView(params, false), 'map', JSON.stringify(params))
    assert.ok(hasDeepLinkIntent(params))
  }
})

test('routing: an explicit view always wins', () => {
  assert.equal(resolveView({ view: 'trends' }, false), 'trends')
  assert.equal(resolveView({ view: 'compare' }, true), 'compare')
  // Returning home has to be possible after visiting.
  assert.equal(resolveView({ view: 'home' }, true), 'home')
})

test('routing: an unknown view falls back rather than rendering nothing', () => {
  assert.equal(resolveView({ view: 'nonsense' }, true), 'map')
  assert.equal(resolveView({ view: 'nonsense' }, false), 'home')
})

test('routing: a bare view param is not mistaken for intent', () => {
  assert.equal(hasDeepLinkIntent({ view: 'trends' }), false)
  assert.equal(hasDeepLinkIntent({}), false)
})
