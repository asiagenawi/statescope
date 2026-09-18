import { useMemo } from 'react'
import { buildComparison, parseCompareCodes, serializeCompareCodes, MAX_COMPARE } from '../../utils/compare'
import { STATUS_DESCRIPTIONS, statusVar } from '../../utils/colors'
import PolicyCard from '../PolicyPanel/PolicyCard'

const TYPE_ROWS = [
  ['bill', 'Bills'],
  ['guidance', 'Guidance documents'],
  ['executive_order', 'Executive orders'],
]

function StatePicker({ states, value, onChange, onRemove, canRemove }) {
  return (
    <div className="compare-picker">
      <select
        className="filter-select"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        aria-label="Choose a state to compare"
      >
        <option value="" disabled>Choose a state</option>
        {[...states]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
      </select>
      {canRemove && (
        <button className="icon-btn" onClick={onRemove} aria-label={`Remove ${value} from comparison`}>
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

function CompareView({ snapshot, urlState, setUrlState, onSelectState }) {
  const codes = useMemo(() => parseCompareCodes(urlState.states), [urlState.states])
  const comparison = useMemo(
    () => buildComparison(snapshot, codes),
    [snapshot, codes],
  )

  function setCodes(next) {
    setUrlState({ states: serializeCompareCodes(next) })
  }

  const { columns, topicRows, shared, unique } = comparison
  const cols = columns.length

  if (snapshot.loading) return <div className="view-loading">Loading…</div>

  return (
    <div className="trends-view">
      <div className="compare-inner">
        <header className="trends-header">
          <h2 className="trends-title">Compare states</h2>
          <p className="trends-subtitle">
            Put two or three states side by side. Binding action — enacted law and
            executive orders in force — is counted separately from guidance, which
            carries no legal weight.
          </p>
        </header>

        <div className="compare-pickers">
          {codes.map((code, i) => (
            <StatePicker
              key={`${code}-${i}`}
              states={snapshot.states}
              value={code}
              canRemove={codes.length > 1}
              onChange={next => setCodes(codes.map((c, j) => (j === i ? next : c)))}
              onRemove={() => setCodes(codes.filter((_, j) => j !== i))}
            />
          ))}
          {codes.length < MAX_COMPARE && (
            <StatePicker
              states={snapshot.states.filter(s => !codes.includes(s.code))}
              value=""
              onChange={next => setCodes([...codes, next])}
            />
          )}
        </div>

        {cols === 0 ? (
          <p className="chart-empty">Choose a state to begin.</p>
        ) : (
          <>
            <div className="compare-grid" style={{ '--cols': cols }}>
              <div className="compare-row compare-row--head">
                <span className="compare-label" />
                {columns.map(c => (
                  <div key={c.state.code} className="compare-head">
                    <button
                      className="compare-state-name"
                      onClick={() => onSelectState(c.state)}
                    >
                      {c.state.name}
                    </button>
                    <span className="status-pill">
                      <span
                        className="status-pill-dot"
                        style={{ backgroundColor: statusVar(c.state.policy_status || 'none') }}
                      />
                      {STATUS_DESCRIPTIONS[c.state.policy_status || 'none']}
                    </span>
                  </div>
                ))}
              </div>

              <Row label="Policies tracked" columns={columns} render={c => c.policies.length} emphasis />
              <Row
                label="Legally binding"
                hint="Enacted law or an executive order in force"
                columns={columns}
                render={c => c.binding}
                emphasis
              />
              {TYPE_ROWS.map(([key, label]) => (
                <Row key={key} label={label} columns={columns} render={c => c.byType[key]} />
              ))}
              <Row
                label="Activity span"
                columns={columns}
                render={c => (c.firstYear ? (c.firstYear === c.latestYear ? c.firstYear : `${c.firstYear}–${c.latestYear}`) : '—')}
              />
            </div>

            {topicRows.length > 0 && (
              <section className="compare-section">
                <h3 className="chart-title">Topics covered</h3>
                <div className="compare-grid" style={{ '--cols': cols }}>
                  {topicRows.map(row => (
                    <div key={row.id} className="compare-row">
                      <span className="compare-label">{row.name}</span>
                      {row.present.map((has, i) => (
                        <span key={i} className="compare-cell">
                          {has ? (
                            <span className="topic-yes" title="Covered">
                              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                                <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="sr-only">Covered</span>
                            </span>
                          ) : (
                            <span className="topic-no" aria-label="Not covered">—</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {cols > 1 && (
                  <p className="compare-summary">
                    {shared.length > 0
                      ? <>Both cover <strong>{shared.join(', ')}</strong>. </>
                      : <>No topic is covered by every state shown. </>}
                    {unique.length > 0 && (
                      <>Only one state covers{' '}
                        {unique.slice(0, 4).map((u, i) => (
                          <span key={u.name}>
                            {i > 0 && ', '}
                            <strong>{u.name}</strong> ({u.code})
                          </span>
                        ))}
                        {unique.length > 4 && <> and {unique.length - 4} more</>}.
                      </>
                    )}
                  </p>
                )}
              </section>
            )}

            <section className="compare-section">
              <h3 className="chart-title">The policies themselves</h3>
              <div className="compare-columns" style={{ '--cols': cols }}>
                {columns.map(c => (
                  <div key={c.state.code} className="compare-column">
                    <h4 className="compare-column-title">{c.state.name}</h4>
                    {c.policies.length === 0 ? (
                      <p className="chart-empty">No policy on record.</p>
                    ) : (
                      c.policies.map(p => <PolicyCard key={p.id} policy={p} />)
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, hint, columns, render, emphasis }) {
  return (
    <div className={`compare-row${emphasis ? ' compare-row--emphasis' : ''}`}>
      <span className="compare-label">
        {label}
        {hint && <span className="compare-hint">{hint}</span>}
      </span>
      {columns.map(c => (
        <span key={c.state.code} className="compare-cell compare-value">{render(c)}</span>
      ))}
    </div>
  )
}

export default CompareView
