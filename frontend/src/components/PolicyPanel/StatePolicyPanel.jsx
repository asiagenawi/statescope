import { useMemo, useState, useEffect, useRef } from 'react'
import { useDrawerFocus } from '../../hooks/useDrawerFocus'
import { STATUS_DESCRIPTIONS, statusVar } from '../../utils/colors'
import PolicyCard from './PolicyCard'
import { groupPolicies } from '../../utils/policyStatus'

function StateDropdown({ states, selectedCode, onSelect }) {
  const sorted = useMemo(
    () => [...states].sort((a, b) => a.name.localeCompare(b.name)),
    [states],
  )
  return (
    <select
      className="state-select"
      value={selectedCode || ''}
      onChange={e => {
        const code = e.target.value
        const next = code === 'US' ? { code: 'US' } : states.find(s => s.code === code)
        if (next) onSelect(next)
      }}
      aria-label="Jump to another state"
    >
      <option value="" disabled>Jump to state</option>
      <option value="US">Federal</option>
      {sorted.map(s => (
        <option key={s.code} value={s.code}>{s.name}</option>
      ))}
    </select>
  )
}

function StatePolicyPanel({ state, states = [], policies = [], onClose, onSelectState, onCompare, onAsk, highlightPolicyId, style }) {
  const status = state?.policy_status || 'none'
  const drawerRef = useDrawerFocus()
  const bodyRef = useRef(null)
  const [copied, setCopied] = useState(false)

  // Arriving from a policy search result: bring that policy into view rather
  // than dropping the reader at the top of a long list to hunt for it.
  useEffect(() => {
    if (!highlightPolicyId) return
    const el = bodyRef.current?.querySelector(`[data-policy-id="${highlightPolicyId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightPolicyId, policies])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context, denied permission) -- the URL bar
      // already holds the right link, so this is a convenience, not the only way.
    }
  }

  const groups = useMemo(() => groupPolicies(policies), [policies])

  return (
    <aside
      className="drawer policy-drawer"
      style={style}
      aria-label={`${state.name} policies`}
      tabIndex={-1}
      ref={drawerRef}
    >
      <div className="drawer-header">
        <div className="drawer-title-row">
          <h2 className="drawer-title">{state.name}</h2>
          <div className="drawer-title-actions">
            {onCompare && (
              <button className="text-btn" onClick={onCompare}>Compare</button>
            )}
            <button className="text-btn" onClick={copyLink}>
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Close state panel">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="drawer-meta">
          <span className="status-pill">
            <span className="status-pill-dot" style={{ backgroundColor: statusVar(status) }} />
            {STATUS_DESCRIPTIONS[status]}
          </span>
          <span className="drawer-count">
            {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
          </span>
        </div>

        {states.length > 0 && (
          <StateDropdown states={states} selectedCode={state.code} onSelect={onSelectState} />
        )}

        {onAsk && (
          <button className="drawer-ask" onClick={onAsk}>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 1.5c3.6 0 6.5 2.4 6.5 5.4S11.6 12.3 8 12.3c-.5 0-1-.05-1.5-.14L3 14l.7-2.6C2.35 10.4 1.5 9 1.5 6.9 1.5 3.9 4.4 1.5 8 1.5Z"
                fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            Ask about {state.name}
          </button>
        )}
      </div>

      <div className="drawer-body" ref={bodyRef}>
        {policies.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No AI education policy on record</h3>
            <p className="empty-text">
              Nothing was found for {state.name} in the sources searched — which is
              not the same as nothing existing. Guidance published as a PDF on a
              department website is the most likely thing to be missed.
            </p>
            {/* An empty drawer was a dead end; these are the next moves someone
                actually wants from here. */}
            <div className="empty-actions">
              {onCompare && (
                <button className="empty-action" onClick={onCompare}>
                  Compare with a state that has acted
                </button>
              )}
              {onAsk && (
                <button className="empty-action" onClick={onAsk}>
                  Ask what neighbouring states are doing
                </button>
              )}
              <a
                className="empty-action"
                href="https://github.com/asiagenawi/statescope/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Know of a policy we’ve missed? Tell us
              </a>
            </div>
          </div>
        ) : (
          <>
            {groups.map(group => (
              <section key={group.key} className="policy-group">
                <h3 className="policy-group-title">
                  {group.label}
                  <span className="policy-group-count">{group.items.length}</span>
                  {group.hint && <span className="policy-group-hint">{group.hint}</span>}
                </h3>
                {group.items.map(p => (
                  <PolicyCard key={p.id} policy={p} highlighted={String(p.id) === highlightPolicyId} />
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

export default StatePolicyPanel
