/**
 * Choropleth encoding for state policy status, in both themes.
 *
 * The five statuses are ordinal, not arbitrary categories -- they mirror the
 * precedence in backend/models/queries.py:get_all_states(), where a state is
 * labelled by the most significant action it has taken:
 *
 *   enacted > pending > guidance > failed > none
 *
 * So three of them ride a single-hue sequential ramp, "failed" sits off-ramp in
 * orange because it is an outcome rather than a level, and "none" is a
 * near-surface neutral meaning "nothing to report". Deliberately no red/blue
 * opposition: on a US state map that reads as partisan, which this data is not.
 *
 * The dark steps are *selected for the dark surface*, not inverted from the
 * light ones, and the ramp runs the other way: on paper more ink means more,
 * on a dark ground more light means more.
 *
 * Both sets were validated against their own surface:
 *
 *   light (#fcfcfb)  ordinal ramp passes; all-pairs CVD dE 14.0, normal 15.6
 *   dark  (#1a1a19)  ordinal ramp passes; all-pairs CVD dE 15.8, normal 15.9
 *
 * Floors are 8 (CVD) and 15 (normal vision). The lightest fill in each theme
 * sits below 3:1 against its surface, so the relief rule applies -- colour never
 * carries meaning alone: every state has a legend entry, a map label, an
 * accessible name, a tooltip, and the policy drawer as the table view.
 */
export const THEMES = {
  light: {
    surface: '#fcfcfb',
    status: {
      none: '#dcdbd5',
      failed: '#eb6834',
      guidance: '#86b6ef',
      pending: '#3987e5',
      enacted: '#184f95',
    },
    // Ink that clears 4.5:1 on each fill, for the postal labels drawn on top.
    ink: {
      none: '#0b0b0b',
      failed: '#0b0b0b',
      guidance: '#0b0b0b',
      pending: '#0b0b0b',
      enacted: '#ffffff',
    },
    // Single-series chart colours, drawn from the same ramp.
    series: '#3987e5',
    seriesStrong: '#184f95',
    grid: '#e8e6de',
    axis: '#cfcdc2',
    axisText: '#85837a',
    labelText: '#56554d',
  },
  dark: {
    surface: '#1a1a19',
    status: {
      none: '#3a3a36',
      failed: '#d95926',
      guidance: '#184f95',
      pending: '#3987e5',
      enacted: '#9ec5f4',
    },
    ink: {
      none: '#ffffff',
      failed: '#0b0b0b',
      guidance: '#ffffff',
      pending: '#0b0b0b',
      enacted: '#0b0b0b',
    },
    series: '#3987e5',
    seriesStrong: '#9ec5f4',
    grid: '#2c2c2a',
    axis: '#383835',
    axisText: '#898781',
    labelText: '#c3c2b7',
  },
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
 * Fills and label inks are referenced as CSS variables so the map, legend and
 * badges re-theme without JavaScript. Charts still need literal values, which
 * is what THEMES is for.
 */
export const statusVar = status => `var(--status-${status})`
export const statusInkVar = status => `var(--ink-on-${status})`

/** Per-status badge colours for policy cards, keyed by the raw policy.status. */
export const POLICY_STATUS_BADGES = {
  enacted: { bg: 'var(--badge-enacted-bg)', text: 'var(--badge-enacted-text)', accent: 'var(--status-enacted)' },
  introduced: { bg: 'var(--badge-pending-bg)', text: 'var(--badge-pending-text)', accent: 'var(--status-pending)' },
  active: { bg: 'var(--badge-guidance-bg)', text: 'var(--badge-guidance-text)', accent: 'var(--status-guidance)' },
  failed: { bg: 'var(--badge-failed-bg)', text: 'var(--badge-failed-text)', accent: 'var(--status-failed)' },
}
