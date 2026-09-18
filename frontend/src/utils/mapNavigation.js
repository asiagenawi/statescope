/**
 * Arrow-key movement across the map.
 *
 * The map was 68 focusable shapes in a row, so reaching anything past it meant
 * 68 tab stops. The fix is the standard composite-widget pattern: the map is a
 * single tab stop (roving tabindex) and the arrows move within it -- but on a
 * map "next" has to mean *geographically* next, not next in document order,
 * which is alphabetical by FIPS and jumps around the country.
 *
 * Positions are projected screen coordinates, so "left" means left as drawn.
 */

/** Weighting for how far off-axis a candidate may drift and still count. */
const OFF_AXIS_PENALTY = 2.2

const AXIS = {
  ArrowLeft: { axis: 'x', sign: -1 },
  ArrowRight: { axis: 'x', sign: 1 },
  ArrowUp: { axis: 'y', sign: -1 },
  ArrowDown: { axis: 'y', sign: 1 },
}

export function isArrowKey(key) {
  return key in AXIS
}

/**
 * The nearest state in the pressed direction.
 *
 * @param positions [{ code, x, y }]
 * @param fromCode  the currently focused state
 * @returns the code to move to, or null when nothing lies that way
 */
export function nextInDirection(positions, fromCode, key) {
  const dir = AXIS[key]
  if (!dir) return null

  const from = positions.find(p => p.code === fromCode)
  if (!from) return positions[0]?.code ?? null

  let best = null
  let bestCost = Infinity

  for (const p of positions) {
    if (p.code === fromCode) continue

    const along = dir.axis === 'x' ? (p.x - from.x) * dir.sign : (p.y - from.y) * dir.sign
    if (along <= 0) continue // not in the direction pressed

    const off = dir.axis === 'x' ? Math.abs(p.y - from.y) : Math.abs(p.x - from.x)

    // Prefer close and on-axis. Drifting sideways costs more than distance
    // ahead, so Right from Kansas lands in Missouri rather than Texas.
    const cost = along + off * OFF_AXIS_PENALTY
    if (cost < bestCost) {
      bestCost = cost
      best = p.code
    }
  }

  return best
}

/** First state to focus when the map receives focus with nothing selected. */
export function defaultFocus(positions) {
  if (!positions.length) return null
  // Westernmost of the contiguous run reads as "the start" of the map.
  return positions.reduce((a, b) => (b.x < a.x ? b : a)).code
}
