import { useMemo } from 'react'
import { buildFindings, recentPolicies } from '../../utils/findings'
import { formatMonth } from '../../utils/dates'
import { STATUS_ORDER, STATUS_LABELS, statusVar } from '../../utils/colors'
import ThemeToggle from '../Layout/ThemeToggle'
import { useEffect } from 'react'
import { prefetchGeo } from '../../hooks/useGeoData'

const ROUTES = [
  {
    id: 'map',
    title: 'Explore the map',
    body: 'Every state shaded by how far it has actually gone — enacted law, pending bills, guidance, or nothing at all.',
    cta: 'Open the map',
  },
  {
    id: 'trends',
    title: 'See what the data shows',
    body: 'How activity has moved year to year, which topics dominate, and how much of it carries legal force.',
    cta: 'View trends',
  },
  {
    id: 'compare',
    title: 'Compare two states',
    body: 'Put jurisdictions side by side — binding action counted separately from non-binding guidance.',
    cta: 'Compare states',
  },
  {
    id: 'ask',
    title: 'Ask a question',
    body: 'Answers grounded in the tracked policies, with every claim linked back to its primary source.',
    cta: 'Open the assistant',
  },
]

function LandingView({ snapshot, onNavigate, onOpenChat, onOpenAbout, onSelectPolicy }) {
  const { states, policies, dataUpdated, loading } = snapshot

  const stats = useMemo(() => {
    if (!states.length) return null
    return {
      policies: policies.length,
      acting: states.filter(s => s.policy_status !== 'none').length,
      enacted: states.filter(s => s.policy_status === 'enacted').length,
    }
  }, [states, policies])

  const lead = useMemo(() => {
    const all = buildFindings(snapshot, dataUpdated)
    // The binding/guidance split is the least obvious thing on the map and the
    // most consequential, so it leads.
    return all.find(f => f.id === 'binding') || all[0] || null
  }, [snapshot, dataUpdated])

  const newest = useMemo(() => recentPolicies(policies, 1)[0], [policies])

  // The landing draws no map, so neither the map chunk nor the 114KB topojson
  // belong in its critical path -- but both should be ready the moment someone
  // clicks through. Fetch them once the page is idle.
  useEffect(() => {
    const warm = () => {
      prefetchGeo()
      import('../Map/USMap')
    }
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(warm, { timeout: 2000 })
      : setTimeout(warm, 600)
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])

  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="landing-bar">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <rect x="2" y="13" width="4.5" height="8" rx="1.25" fill="var(--status-guidance)" />
              <rect x="9.75" y="8" width="4.5" height="13" rx="1.25" fill="var(--status-pending)" />
              <rect x="17.5" y="3" width="4.5" height="18" rx="1.25" fill="var(--status-enacted)" />
            </svg>
          </span>
          <span className="landing-wordmark">StateScope</span>
          <ThemeToggle />
        </div>

        <header className="landing-head">
          <p className="landing-eyebrow">AI in education policy · all 50 states and DC</p>
          <h1 className="landing-title">Who’s regulating AI in the classroom?</h1>
          <p className="landing-sub">
            States are moving fast and in different directions. StateScope tracks the
            legislation, executive orders, and department guidance that decide what
            schools may and may not do with AI — each one linked to its primary source.
          </p>
        </header>

        {loading ? (
          <div className="landing-stats landing-stats--loading" aria-hidden="true" />
        ) : stats && (
          <div className="landing-stats">
            <div className="landing-stat">
              <span className="landing-stat-value">{stats.policies}</span>
              <span className="landing-stat-label">policies tracked</span>
            </div>
            <div className="landing-stat">
              <span className="landing-stat-value">{stats.acting}</span>
              <span className="landing-stat-label">states with action on record</span>
            </div>
            <div className="landing-stat">
              <span className="landing-stat-value">{stats.enacted}</span>
              <span className="landing-stat-label">with enacted law</span>
            </div>
          </div>
        )}

        {lead && (
          <blockquote className="landing-finding">
            <p className="landing-finding-headline">{lead.headline}</p>
            <p className="landing-finding-detail">{lead.detail}</p>
          </blockquote>
        )}

        <nav className="landing-routes" aria-label="Where to start">
          {ROUTES.map(r => (
            <button
              key={r.id}
              className="landing-route"
              onClick={() => (r.id === 'ask' ? onOpenChat() : onNavigate(r.id))}
            >
              <span className="landing-route-title">{r.title}</span>
              <span className="landing-route-body">{r.body}</span>
              <span className="landing-route-cta">
                {r.cta}
                <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
                  <path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" fill="none" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ))}
        </nav>

        <div className="landing-key" aria-label="How states are shaded">
          <span className="landing-key-label">How states are shaded</span>
          <div className="landing-key-items">
            {STATUS_ORDER.map(status => (
              <span key={status} className="legend-key">
                <span className="legend-swatch" style={{ backgroundColor: statusVar(status) }} />
                <span className="legend-label">{STATUS_LABELS[status]}</span>
              </span>
            ))}
          </div>
        </div>

        <footer className="landing-foot">
          {newest && (
            <p className="landing-foot-line">
              Most recent:{' '}
              <button className="landing-link" onClick={() => onSelectPolicy(newest)}>
                {newest.title}
              </button>{' '}
              ({newest.state_name || 'Federal'},{' '}
              {formatMonth(String(newest.date_introduced).slice(0, 7))})
            </p>
          )}
          <p className="landing-foot-line">
            A curated snapshot, current to {formatMonth(dataUpdated, 'its curation date')} — not a
            live feed.{' '}
            <button className="landing-link" onClick={onOpenAbout}>
              Methodology and limitations
            </button>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default LandingView
