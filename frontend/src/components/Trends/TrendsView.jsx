import { useMemo, useCallback } from 'react'
import { useTrends } from '../../hooks/useTrends'
import { POLICY_STATUS_BADGES } from '../../utils/colors'
import PolicyTimeline from './PolicyTimeline'
import CategoryBreakdown from './CategoryBreakdown'
import FilterBar from './FilterBar'
import { downloadCSV } from '../../utils/export'

/** Name the file after what's actually in it, so downloads stay tellable apart. */
function exportFilename(filters) {
  const parts = ['statescope']
  if (filters.state) parts.push(filters.state.toLowerCase())
  if (filters.policyType) parts.push(filters.policyType)
  return `${parts.join('-')}-policies.csv`
}

const STATUS_LABELS = {
  enacted: 'Enacted',
  active: 'In effect',
  introduced: 'Pending',
  failed: 'Failed',
}

function TrendsView({ snapshot, urlState, setUrlState, onSelectState }) {
  // Filters live in the URL so a narrowed view is shareable and survives reload.
  const filters = useMemo(() => ({
    state: urlState.fstate || null,
    topicId: urlState.topic || null,
    policyType: urlState.type || null,
  }), [urlState.fstate, urlState.topic, urlState.type])

  const setFilters = useCallback(next => {
    setUrlState({ fstate: next.state, topic: next.topicId, type: next.policyType })
  }, [setUrlState])

  const resetFilters = useCallback(() => {
    setUrlState({ fstate: null, topic: null, type: null })
  }, [setUrlState])

  const trends = useTrends(snapshot, filters)

  const filteredState = filters.state
    ? snapshot.states.find(s => s.code === filters.state)
    : null

  const peakYear = useMemo(() => {
    if (!trends.timeline.length) return null
    return trends.timeline.reduce((a, b) => (b.count > a.count ? b : a))
  }, [trends.timeline])

  if (snapshot.loading) {
    return <div className="view-loading">Loading trends…</div>
  }

  return (
    <div className="trends-view">
      <div className="trends-inner">
        <header className="trends-header">
          <h2 className="trends-title">How AI education policy is moving</h2>
          <p className="trends-subtitle">
            Every tracked bill, executive order, and department guidance document,
            across all 50 states and DC.
          </p>
          {filteredState && (
            <button
              className="trends-crosslink"
              onClick={() => onSelectState(filteredState)}
            >
              View {filteredState.name} on the map →
            </button>
          )}
        </header>

        <FilterBar
          states={snapshot.states}
          topics={snapshot.topics}
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          onExport={() => downloadCSV(trends.filtered, exportFilename(filters))}
          resultCount={trends.total}
        />

        <div className="tile-row">
          <div className="tile">
            <span className="tile-value">{trends.total}</span>
            <span className="tile-label">policies tracked</span>
          </div>
          <div className="tile">
            <span className="tile-value">{trends.statesActing}</span>
            <span className="tile-label">states represented</span>
          </div>
          <div className="tile">
            <span className="tile-value">{peakYear ? peakYear.count : 0}</span>
            <span className="tile-label">
              peak year{peakYear ? ` (${peakYear.year})` : ''}
            </span>
          </div>
          <div className="tile">
            <span className="tile-value">{trends.topicCounts.length}</span>
            <span className="tile-label">topics covered</span>
          </div>
        </div>

        <div className="panel-grid">
          <section className="chart-panel">
            <h3 className="chart-title">Policies introduced per year</h3>
            <PolicyTimeline data={trends.timeline} />
          </section>

          <section className="chart-panel">
            <h3 className="chart-title">Status of tracked policies</h3>
            <ul className="status-list">
              {trends.statusBreakdown.map(s => {
                const badge = POLICY_STATUS_BADGES[s.name] || POLICY_STATUS_BADGES.active
                const pct = trends.total ? (s.count / trends.total) * 100 : 0
                return (
                  <li key={s.name} className="status-row">
                    <span className="status-row-label">
                      {STATUS_LABELS[s.name] || s.name}
                    </span>
                    <span className="status-row-track">
                      <span
                        className="status-row-fill"
                        style={{ width: `${pct}%`, backgroundColor: badge.accent }}
                      />
                    </span>
                    <span className="status-row-value">{s.count}</span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="chart-panel chart-panel--wide">
            <h3 className="chart-title">Policies by topic</h3>
            <CategoryBreakdown data={trends.topicCounts} />
          </section>
        </div>
      </div>
    </div>
  )
}

export default TrendsView
