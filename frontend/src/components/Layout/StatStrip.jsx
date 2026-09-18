import { useMemo } from 'react'
import { formatMonth } from '../../utils/dates'

/**
 * The headline numbers, derived from the snapshot rather than hardcoded, so
 * they stay true whenever the data is re-seeded.
 */
function StatStrip({ snapshot }) {
  const { states, policies, dataUpdated, loading } = snapshot

  const stats = useMemo(() => {
    if (!states.length) return null
    const acting = states.filter(s => s.policy_status !== 'none').length
    const enacted = states.filter(s => s.policy_status === 'enacted').length
    return [
      { value: policies.length, label: 'policies' },
      { value: acting, label: 'states acting' },
      { value: enacted, label: 'with law enacted' },
    ]
  }, [states, policies])

  if (loading || !stats) {
    return <div className="stat-strip stat-strip--loading" aria-hidden="true" />
  }

  const updated = formatMonth(dataUpdated)

  return (
    <div className="stat-strip">
      {stats.map(s => (
        <span key={s.label} className="stat">
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </span>
      ))}
      {updated && <span className="stat-updated">Data current to {updated}</span>}
    </div>
  )
}

export default StatStrip
