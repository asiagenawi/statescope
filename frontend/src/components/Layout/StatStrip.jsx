import { useMemo } from 'react'

/**
 * Headline figures, derived from the snapshot rather than hardcoded, so they
 * stay true whenever the data is re-seeded.
 *
 * Set quietly and inline: on a map view these are context for the map, not the
 * subject of the page, and big bordered figure tiles compete with it. The
 * curation date lives in the utility bar above, where provenance belongs.
 */
function StatStrip({ snapshot }) {
  const { states, policies, loading } = snapshot

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

  return (
    <div className="stat-strip">
      {stats.map(s => (
        <span key={s.label} className="stat">
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </span>
      ))}
    </div>
  )
}

export default StatStrip
