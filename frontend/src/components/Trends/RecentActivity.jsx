import { formatMonth } from '../../utils/dates'

const TYPE_LABELS = {
  bill: 'Bill',
  guidance: 'Guidance',
  executive_order: 'Executive order',
}

/**
 * "What changed?" is the question a tracker exists to answer, and until now
 * nothing in the interface answered it.
 */
function RecentActivity({ policies, onSelectPolicy, dataUpdated }) {
  if (!policies.length) return null

  return (
    <section className="compare-section" aria-label="Recent activity">
      <h3 className="chart-title">Most recent activity</h3>
      <ol className="recent-list">
        {policies.map(p => (
          <li key={p.id}>
            <button className="recent-item" onClick={() => onSelectPolicy(p)}>
              <span className="recent-date">
                {formatMonth(String(p.date_introduced).slice(0, 7))}
              </span>
              <span className="recent-body">
                <span className="recent-title">{p.title}</span>
                <span className="recent-meta">
                  {p.state_name || 'Federal'} · {TYPE_LABELS[p.policy_type] || p.policy_type}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="recent-note">
        Newest first, by date introduced. Nothing after{' '}
        {formatMonth(dataUpdated, 'the curation date')} is reflected here.
      </p>
    </section>
  )
}

export default RecentActivity
