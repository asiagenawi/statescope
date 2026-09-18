const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

/** "2026-02" -> "February 2026". One implementation, so the date reads the
 *  same everywhere it appears. */
export function formatMonth(value, fallback = null) {
  if (!value) return fallback
  const [year, month] = value.split('-')
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : year
}
