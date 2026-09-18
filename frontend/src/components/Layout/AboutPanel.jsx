import { useMemo } from 'react'
import { useDrawerFocus } from '../../hooks/useDrawerFocus'
import { formatMonth } from '../../utils/dates'

const REPO_URL = 'https://github.com/asiagenawi/statescope'

/**
 * Methodology, coverage and limitations.
 *
 * Every serious policy tracker publishes how it counts things and where it falls
 * short -- without that, a map of 50 coloured states is an assertion rather than
 * a finding. All the figures here are computed from the snapshot, so they cannot
 * drift away from the data the way hand-written copy would.
 */
function AboutPanel({ snapshot, onClose }) {
  const drawerRef = useDrawerFocus()

  const stats = useMemo(() => {
    const { policies, states } = snapshot
    if (!policies.length) return null

    const withSource = policies.filter(p => p.source_url)
    const govSourced = withSource.filter(p => {
      try {
        return new URL(p.source_url).hostname.endsWith('.gov')
      } catch {
        return false
      }
    })
    const domains = new Set(
      withSource.map(p => {
        try {
          return new URL(p.source_url).hostname
        } catch {
          return p.source_url
        }
      }),
    )
    const byType = policies.reduce((acc, p) => {
      acc[p.policy_type] = (acc[p.policy_type] || 0) + 1
      return acc
    }, {})
    const dates = policies.map(p => p.date_introduced).filter(Boolean).sort()
    const untracked = states.filter(s => !s.policy_count).map(s => s.code).sort()

    return {
      total: policies.length,
      withSource: withSource.length,
      govSourced: govSourced.length,
      domains: domains.size,
      byType,
      federal: policies.filter(p => p.level === 'federal').length,
      earliest: dates[0]?.slice(0, 4),
      latest: dates[dates.length - 1]?.slice(0, 4),
      untracked,
    }
  }, [snapshot])

  return (
    <aside
      className="drawer about-drawer"
      style={undefined}
      aria-label="About this tracker"
      tabIndex={-1}
      ref={drawerRef}
    >
      <div className="drawer-header">
        <div className="drawer-title-row">
          <h2 className="drawer-title">About this tracker</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close about panel">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="drawer-body prose">
        <p className="lede">
          StateScope tracks how US states are regulating artificial intelligence in
          K–12 and higher education — the legislation, executive orders, and
          department-of-education guidance that determine what schools may and may
          not do with AI.
        </p>

        <h3>What counts as a policy</h3>
        <p>
          Three kinds of document, which carry very different weight and are kept
          distinct throughout:
        </p>
        <ul>
          <li>
            <strong>Bills</strong> — introduced, enacted, or failed legislation
            {stats && <> ({stats.byType.bill ?? 0} tracked)</>}.
          </li>
          <li>
            <strong>Executive orders</strong> — binding directives from a governor
            or the White House
            {stats && <> ({stats.byType.executive_order ?? 0})</>}.
          </li>
          <li>
            <strong>Guidance</strong> — non-binding frameworks and toolkits
            published by a state department of education
            {stats && <> ({stats.byType.guidance ?? 0})</>}.
          </li>
        </ul>
        <p>
          Guidance is <em>not</em> law. A state can publish a thorough AI framework
          without passing a single bill, and the map keeps that distinction rather
          than collapsing everything into "has a policy".
        </p>
        <p>
          Every policy is marked <strong>legally binding</strong> or not, and the
          test is the same one used in every count on this site: an enacted bill
          binds, an executive order in force binds, and nothing else does. A
          pending bill and a published framework are both real activity, but
          neither obliges anyone. A revoked executive order is labelled
          <em> revoked</em> rather than failed — it was in force, and then it
          wasn’t, which is a different fact from never passing.
        </p>

        <h3>How a state gets its colour</h3>
        <p>
          Each state is shaded by the most significant action it has taken, in this
          order — the first rule that matches wins:
        </p>
        <ol className="rule-list">
          <li><strong>Enacted</strong> — an enacted bill, or an executive order in force</li>
          <li><strong>Pending</strong> — a bill introduced but not yet passed</li>
          <li><strong>Guidance only</strong> — department guidance, but no legislation</li>
          <li><strong>Failed</strong> — legislation was attempted and did not pass</li>
          <li><strong>No policy</strong> — nothing found in the sources searched</li>
        </ol>
        <p>
          A darker state is therefore doing more that is legally binding, not
          necessarily more that is <em>good</em>. The map takes no position on the
          merits of any policy.
        </p>

        <h3>Sourcing</h3>
        {stats && (
          <>
            <p>
              Every one of the {stats.total} tracked policies links to a primary
              source — {stats.withSource === stats.total ? 'with no exceptions' : `${stats.withSource} of ${stats.total}`}.
              {' '}{stats.govSourced} of them point at an official{' '}
              <code>.gov</code> domain (state legislature, department of education,
              Congress, or the White House), drawn from {stats.domains} distinct
              sources. Where a legislature has no stable public URL, a legislative
              tracking service is used instead.
            </p>
            <p>
              Coverage runs from {stats.earliest} to {stats.latest}, and includes{' '}
              {stats.federal} federal actions alongside state ones.
            </p>
          </>
        )}

        <h3>Limitations — please read</h3>
        <ul>
          <li>
            <strong>This is a snapshot, not a live feed.</strong> The data was last
            curated in {formatMonth(snapshot.dataUpdated, 'an unrecorded date')}. Anything that moved
            since then is not reflected here.
          </li>
          <li>
            <strong>Blank does not mean nothing exists.</strong>
            {stats && stats.untracked.length > 0 && (
              <> {stats.untracked.length} jurisdictions ({stats.untracked.join(', ')})
              show no tracked policy. That means nothing was found in the sources
              searched — not that nothing is happening there.</>
            )}
          </li>
          <li>
            <strong>Guidance is under-counted by nature.</strong> Bills are indexed
            and searchable; a PDF posted to a state education department's website
            is not. Guidance coverage is the weakest part of this dataset.
          </li>
          <li>
            <strong>Status reflects the source at curation time.</strong> A bill
            listed as pending may since have passed or died.
          </li>
        </ul>

        <h3>Corrections</h3>
        <p>
          Missing policy, wrong status, dead link? Corrections are genuinely
          welcome — <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">open an issue</a>{' '}
          with a source and it will be folded into the next update.
        </p>

        <h3>Citing this</h3>
        <p className="citation-block">
          StateScope: AI in Education Policy Tracker. Data current to{' '}
          {formatMonth(snapshot.dataUpdated, 'an unrecorded date')}. Retrieved from{' '}
          <span className="citation-url">asiagenawi.github.io/statescope</span>
        </p>

        <div className="colophon">
          <p>
            The answer assistant is generated by Claude and grounded in the policies
            listed beneath each answer. It can still be wrong — the linked sources
            are the authority, not the summary.
          </p>
          <p>
            Built and maintained by Asia Genawi ·{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">source on GitHub</a>
          </p>
        </div>
      </div>
    </aside>
  )
}

export default AboutPanel
