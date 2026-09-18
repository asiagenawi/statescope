/**
 * Generate the social preview card from the real data.
 *
 * Sharing a link to a policy tracker with no preview makes it look like a dead
 * URL. This renders the actual choropleth and the actual headline numbers, so
 * the card cannot show something the tracker does not say.
 *
 *   node scripts/make-og-image.mjs
 *
 * Writes public/og-image.png (1200x630). Re-run when the data changes; the
 * result is committed so the build needs no browser.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { feature } from 'topojson-client'
import { geoAlbersUsa, geoPath } from 'd3-geo'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'public')

const STATUS_COLORS = {
  none: '#dcdbd5',
  failed: '#eb6834',
  guidance: '#86b6ef',
  pending: '#3987e5',
  enacted: '#184f95',
}

const WIDTH = 1200
const HEIGHT = 630

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].find(existsSync)

function buildMapSvg(snapshot) {
  const topo = JSON.parse(readFileSync(join(pub, 'us-states-10m.json'), 'utf8'))
  const states = feature(topo, topo.objects.states).features

  const byFips = Object.fromEntries(snapshot.states.map(s => [s.fips, s]))

  // Sized for the right-hand two thirds of the card.
  const projection = geoAlbersUsa().scale(820).translate([390, 235])
  const path = geoPath(projection)

  const paths = states.map(f => {
    const d = path(f)
    if (!d) return ''
    const status = byFips[f.id]?.policy_status || 'none'
    return `<path d="${d}" fill="${STATUS_COLORS[status]}" stroke="#ffffff" stroke-width="0.8"/>`
  }).join('')

  return `<svg width="780" height="470" viewBox="0 0 780 470" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`
}

function buildHtml(snapshot) {
  const acting = snapshot.states.filter(s => s.policy_status !== 'none').length
  const enacted = snapshot.states.filter(s => s.policy_status === 'enacted').length

  const legend = ['none', 'failed', 'guidance', 'pending', 'enacted']
    .map(k => `<span class="sw" style="background:${STATUS_COLORS[k]}"></span>`)
    .join('')

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:${WIDTH}px;height:${HEIGHT}px;display:flex;background:#f5f4f0;
       font-family:Inter,system-ui,sans-serif;color:#14140f;overflow:hidden}
  .left{width:440px;padding:64px 0 64px 64px;display:flex;flex-direction:column;justify-content:center}
  .mark{display:flex;gap:4px;align-items:flex-end;margin-bottom:26px}
  .mark i{display:block;width:13px;border-radius:3px}
  h1{font-family:'Source Serif 4',Georgia,serif;font-size:60px;font-weight:600;
     letter-spacing:-0.02em;line-height:1.02;margin-bottom:16px}
  .sub{font-family:'Source Serif 4',Georgia,serif;font-size:23px;line-height:1.4;color:#56554d;margin-bottom:38px}
  .stats{display:flex;gap:34px;margin-bottom:26px}
  .stat b{display:block;font-size:38px;font-weight:600;line-height:1;letter-spacing:-0.01em}
  .stat span{font-size:14px;color:#85837a}
  .legend{display:flex;align-items:center;gap:10px;font-size:13px;color:#85837a}
  .ramp{display:flex;border-radius:3px;overflow:hidden;border:1px solid rgba(20,20,15,.12)}
  .sw{display:block;width:26px;height:11px}
  .right{flex:1;display:flex;align-items:center;justify-content:center;padding-right:24px}
</style></head>
<body>
  <div class="left">
    <div class="mark">
      <i style="height:15px;background:#86b6ef"></i>
      <i style="height:25px;background:#3987e5"></i>
      <i style="height:35px;background:#184f95"></i>
    </div>
    <h1>StateScope</h1>
    <p class="sub">Who’s regulating AI in the classroom — tracked across all 50 states and DC.</p>
    <div class="stats">
      <div class="stat"><b>${snapshot.policies.length}</b><span>policies</span></div>
      <div class="stat"><b>${acting}</b><span>states acting</span></div>
      <div class="stat"><b>${enacted}</b><span>with law enacted</span></div>
    </div>
    <div class="legend"><div class="ramp">${legend}</div><span>no policy → enacted law</span></div>
  </div>
  <div class="right">${buildMapSvg(snapshot)}</div>
</body></html>`
}

function main() {
  if (!CHROME) {
    console.error('No Chrome/Chromium found; skipping OG image generation.')
    process.exit(1)
  }

  const snapshot = JSON.parse(readFileSync(join(pub, 'data', 'snapshot.json'), 'utf8'))
  const htmlPath = join(pub, '.og-card.html')
  writeFileSync(htmlPath, buildHtml(snapshot))

  const out = join(pub, 'og-image.png')
  try {
    execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${WIDTH},${HEIGHT}`,
      '--virtual-time-budget=5000',
      `--screenshot=${out}`,
      `file://${htmlPath}`,
    ], { stdio: 'ignore', timeout: 60000 })
  } catch {
    // Chrome's updater can keep the process alive past the screenshot; the file
    // landing is what matters.
  } finally {
    unlinkSync(htmlPath)
  }

  if (!existsSync(out)) {
    console.error('Screenshot did not produce a file.')
    process.exit(1)
  }
  console.log(`Wrote ${out} (${(readFileSync(out).length / 1024).toFixed(0)} KB)`)
}

main()
