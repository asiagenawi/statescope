import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { THEMES, STATUS_ORDER } from '../src/utils/colors.js'

const css = readFileSync(fileURLToPath(new URL('../src/index.css', import.meta.url)), 'utf8')

/** Values declared in a given selector/at-rule scope. */
function varsIn(scope) {
  const at = css.indexOf(scope)
  assert.notEqual(at, -1, `scope ${scope} exists`)
  const body = css.slice(at, at + 3000)
  const out = {}
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (!(name in out)) out[name] = value.trim()
  }
  return out
}

test('theme: both palettes define every status and its label ink', () => {
  for (const mode of ['light', 'dark']) {
    for (const status of STATUS_ORDER) {
      assert.ok(THEMES[mode].status[status], `${mode}.status.${status}`)
      assert.ok(THEMES[mode].ink[status], `${mode}.ink.${status}`)
    }
  }
})

test('theme: dark is a selected palette, not an inversion of light', () => {
  const same = STATUS_ORDER.filter(s => THEMES.light.status[s] === THEMES.dark.status[s])
  // pending happens to hold its step in both; everything else must differ.
  assert.ok(same.length <= 1, `expected distinct steps, shared: ${same.join(', ')}`)
})

test('theme: the ramp direction flips between themes', () => {
  const lum = hex => {
    const v = n => {
      const c = parseInt(hex.slice(n, n + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * v(1) + 0.7152 * v(3) + 0.0722 * v(5)
  }
  // On light, "enacted" is the darkest step; on dark it is the lightest.
  assert.ok(lum(THEMES.light.status.enacted) < lum(THEMES.light.status.guidance),
    'light: more action is more ink')
  assert.ok(lum(THEMES.dark.status.enacted) > lum(THEMES.dark.status.guidance),
    'dark: more action is more light')
})

test('theme: label ink clears 4.5:1 on its own fill in both themes', () => {
  const lum = hex => {
    const v = n => {
      const c = parseInt(hex.slice(n, n + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * v(1) + 0.7152 * v(3) + 0.0722 * v(5)
  }
  const ratio = (a, b) => {
    const x = lum(a), y = lum(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  for (const mode of ['light', 'dark']) {
    for (const status of STATUS_ORDER) {
      const r = ratio(THEMES[mode].status[status], THEMES[mode].ink[status])
      assert.ok(r >= 4.5, `${mode}/${status} label contrast ${r.toFixed(2)} >= 4.5`)
    }
  }
})

test('theme: the stylesheet matches the JS palette exactly', () => {
  // Two sources of truth is a drift risk; this is what keeps them honest.
  const light = varsIn(':root {')
  const dark = varsIn(':root[data-theme="dark"]')

  for (const status of STATUS_ORDER) {
    assert.equal(light[`status-${status}`], THEMES.light.status[status], `light --status-${status}`)
    assert.equal(light[`ink-on-${status}`], THEMES.light.ink[status], `light --ink-on-${status}`)
    assert.equal(dark[`status-${status}`], THEMES.dark.status[status], `dark --status-${status}`)
    assert.equal(dark[`ink-on-${status}`], THEMES.dark.ink[status], `dark --ink-on-${status}`)
  }
})

test('theme: dark values are declared under both the media query and the toggle', () => {
  assert.ok(css.includes('@media (prefers-color-scheme: dark)'), 'follows the OS')
  assert.ok(css.includes(':root:not([data-theme="light"])'), 'an explicit light stamp wins')
  assert.ok(css.includes(':root[data-theme="dark"]'), 'an explicit dark stamp wins')
})
