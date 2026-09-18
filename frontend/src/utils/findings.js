import { isBinding } from './compare.js'

/**
 * Statements the data supports, computed rather than written.
 *
 * A map of fifty shaded states shows what is there but never says what is
 * notable. These are the findings a reader would otherwise have to derive.
 *
 * Two honesty rules are baked in:
 *
 *  - The final year is almost always truncated by the curation date, so it is
 *    excluded from any trend claim. Reading "1 policy in 2026" as a collapse
 *    would be an artifact of when the data was gathered, not a finding.
 *  - Absence is reported as "nothing found in the sources searched", never as
 *    "nothing exists".
 */

function yearCounts(policies) {
  const counts = new Map()
  for (const p of policies) {
    if (!p.date_introduced) continue
    const y = String(p.date_introduced).slice(0, 4)
    counts.set(y, (counts.get(y) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

/**
 * Years whose data is complete enough to compare. The curation month tells us
 * which year is still in progress.
 */
export function completeYears(policies, dataUpdated) {
  const years = yearCounts(policies)
  if (!years.length) return []
  const cutoff = dataUpdated ? Number(dataUpdated.slice(0, 4)) : Infinity
  // A year is only comparable once it is fully behind the curation date.
  return years.filter(([y]) => Number(y) < cutoff)
}

export function buildFindings({ policies = [], states = [], topics = [], policyTopics = {} }, dataUpdated) {
  if (!policies.length) return []

  const findings = []
  const complete = completeYears(policies, dataUpdated)

  // 1. Trajectory, using only complete years.
  if (complete.length >= 2) {
    const [firstYear, firstCount] = complete[0]
    const peak = complete.reduce((a, b) => (b[1] > a[1] ? b : a))
    const [lastYear, lastCount] = complete[complete.length - 1]

    if (peak[1] > firstCount) {
      const factor = (peak[1] / firstCount).toFixed(1).replace(/\.0$/, '')
      findings.push({
        id: 'trajectory',
        headline: `Activity peaked in ${peak[0]}`,
        detail: `Introductions rose from ${firstCount} in ${firstYear} to ${peak[1]} in ${peak[0]}` +
          (peak[0] !== lastYear ? `, then eased to ${lastCount} in ${lastYear}.` : ' — a ') +
          (peak[0] !== lastYear ? ` That is a ${factor}× rise at the peak.` : `${factor}× rise.`),
      })
    }
  }

  // 2. How much of the "action" actually binds anyone.
  const binding = policies.filter(isBinding).length
  const guidanceOnlyStates = states.filter(s => s.policy_status === 'guidance').length
  findings.push({
    id: 'binding',
    headline: `${binding} of ${policies.length} policies carry legal force`,
    detail: `The rest are proposals or non-binding guidance. ${guidanceOnlyStates} states have ` +
      `published department guidance without passing any legislation — real activity, but not law.`,
  })

  // 3. Where the map is blank, said honestly.
  const untracked = states.filter(s => !s.policy_count)
  if (untracked.length) {
    findings.push({
      id: 'gaps',
      headline: `${untracked.length} jurisdictions have nothing on record`,
      detail: `${untracked.map(s => s.code).join(', ')} show no tracked policy. That means nothing ` +
        `was found in the sources searched, not that nothing is happening there.`,
    })
  }

  // 4. What the field is actually about.
  const nameById = new Map(topics.map(t => [t.id, t.name]))
  const topicCounts = new Map()
  for (const p of policies) {
    for (const id of policyTopics[String(p.id)] || []) {
      topicCounts.set(id, (topicCounts.get(id) || 0) + 1)
    }
  }
  const ranked = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])
  if (ranked.length >= 2) {
    const [topId, topCount] = ranked[0]
    const [secondId, secondCount] = ranked[1]
    findings.push({
      id: 'topics',
      headline: `${nameById.get(topId)} is the most common concern`,
      detail: `It appears in ${topCount} policies, ahead of ${nameById.get(secondId)} at ${secondCount}. ` +
        `A policy can cover several topics.`,
    })
  }

  return findings
}

/** Newest first, for the "what changed" question a tracker exists to answer. */
export function recentPolicies(policies, limit = 6) {
  return policies
    .filter(p => p.date_introduced)
    .slice()
    .sort((a, b) => String(b.date_introduced).localeCompare(String(a.date_introduced)))
    .slice(0, limit)
}
