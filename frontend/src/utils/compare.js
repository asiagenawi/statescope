/**
 * Build a side-by-side comparison of two or more states.
 *
 * Kept as a pure function over the snapshot so it can be tested directly and so
 * the view stays presentational.
 */

export const MAX_COMPARE = 3

const TYPE_KEYS = ['bill', 'guidance', 'executive_order']

export function buildComparison(snapshot, codes) {
  const { states, policiesByState, policyTopics, topics } = snapshot
  const topicNameById = new Map((topics || []).map(t => [t.id, t.name]))

  const columns = codes
    .map(code => states.find(s => s.code === code))
    .filter(Boolean)
    .map(state => {
      const policies = policiesByState[state.code] || []

      const byType = Object.fromEntries(
        TYPE_KEYS.map(k => [k, policies.filter(p => p.policy_type === k).length]),
      )

      const years = policies
        .map(p => p.date_introduced)
        .filter(Boolean)
        .map(d => String(d).slice(0, 4))
        .sort()

      const topicIds = new Set()
      for (const p of policies) {
        for (const id of (policyTopics || {})[String(p.id)] || []) topicIds.add(id)
      }

      return {
        state,
        policies,
        byType,
        binding: policies.filter(p => isBinding(p)).length,
        firstYear: years[0] || null,
        latestYear: years[years.length - 1] || null,
        topicIds,
      }
    })

  // A topic row is only worth showing if at least one state in the comparison
  // touches it; the union keeps rows aligned across columns.
  const allTopicIds = [...new Set(columns.flatMap(c => [...c.topicIds]))]
    .sort((a, b) => (topicNameById.get(a) || '').localeCompare(topicNameById.get(b) || ''))

  const topicRows = allTopicIds.map(id => ({
    id,
    name: topicNameById.get(id) || 'Unknown',
    present: columns.map(c => c.topicIds.has(id)),
  }))

  return {
    columns,
    topicRows,
    shared: topicRows.filter(r => r.present.every(Boolean)).map(r => r.name),
    // Only meaningful with 2+ columns: topics exactly one state covers.
    unique: topicRows
      .filter(r => r.present.filter(Boolean).length === 1)
      .map(r => ({ name: r.name, code: columns[r.present.indexOf(true)]?.state.code })),
  }
}

/**
 * Binding = carries legal force. An enacted bill or an executive order in
 * effect binds; a pending bill and a guidance document do not. Mirrors the
 * precedence documented in the methodology panel.
 */
export function isBinding(policy) {
  if (policy.status === 'enacted') return true
  return policy.policy_type === 'executive_order' && policy.status === 'active'
}

/** Parse the ?states=CA,TX parameter into a clean, de-duplicated list. */
export function parseCompareCodes(value) {
  if (!value) return []
  return [...new Set(
    value
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean),
  )].slice(0, MAX_COMPARE)
}

export function serializeCompareCodes(codes) {
  return codes.length ? codes.join(',') : null
}
