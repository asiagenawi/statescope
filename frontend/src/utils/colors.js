/**
 * Choropleth encoding for state policy status.
 *
 * The five statuses are ordinal, not arbitrary categories -- they mirror the
 * precedence in backend/models/queries.py:get_all_states(), where a state is
 * labelled by the most significant action it has taken:
 *
 *   enacted > pending > guidance > failed > none
 *
 * So three of them ride a single-hue sequential ramp (more ink = more binding
 * policy in force), "failed" sits off-ramp in orange because it is an outcome
 * rather than a level, and "none" is a near-surface neutral meaning "nothing to
 * report". Deliberately no red/blue opposition: on a US state map that reads as
 * partisan, which this data is not.
 *
 * Validated as an ordinal ramp (monotone lightness, all step gaps >= 0.06,
 * light end 2.06:1 vs surface) and for all-pairs separation: worst CVD dE 14.0
 * and worst normal-vision dE 15.6, both clear of the 8 / 15 floors.
 *
 * The lightest two fills sit below 3:1 against the surface, so the relief rule
 * applies -- they never carry meaning alone. Every state also has a text label
 * in the legend, an accessible name on the shape, a tooltip, and the policy
 * panel as the table view.
 */
export const STATUS_COLORS = {
  none: '#dcdbd5',
  failed: '#eb6834',
  guidance: '#86b6ef',
  pending: '#3987e5',
  enacted: '#184f95',
}

/** Legend order: escalating, least action -> most action. */
export const STATUS_ORDER = ['none', 'failed', 'guidance', 'pending', 'enacted']

export const STATUS_LABELS = {
  none: 'No policy',
  failed: 'Failed',
  guidance: 'Guidance only',
  pending: 'Pending',
  enacted: 'Enacted',
}

/** Longer phrasing for tooltips and accessible names. */
export const STATUS_DESCRIPTIONS = {
  none: 'No policy yet',
  failed: 'Failed legislation',
  guidance: 'Guidance only',
  pending: 'Pending bills',
  enacted: 'Enacted legislation',
}

/**
 * Ink color for a label drawn on top of a status fill. The ramp spans a wide
 * lightness range, so a single label color cannot stay legible across it.
 */
export function labelInkOn(status) {
  // Only the darkest ramp step needs light ink. White on `pending` measures
  // 3.64:1, short of 4.5 for label-sized text; dark ink on it clears at 5.77:1.
  return status === 'enacted' ? '#ffffff' : '#0b0b0b'
}

/** Per-status badge colors for policy cards, keyed by the raw policy.status. */
export const POLICY_STATUS_BADGES = {
  enacted: { bg: '#e2ecfa', text: '#123a6e', accent: '#184f95' },
  introduced: { bg: '#e6f0fd', text: '#1c5cab', accent: '#3987e5' },
  active: { bg: '#edf3fd', text: '#25538f', accent: '#86b6ef' },
  failed: { bg: '#fdeae2', text: '#8f3c17', accent: '#eb6834' },
}
