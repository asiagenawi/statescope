/**
 * Federal policy as a first-class jurisdiction.
 *
 * Six of the tracked policies are federal -- two executive orders among them --
 * and because the choropleth only draws states, they were counted in the totals
 * but could not be opened anywhere in the UI. This gives them the same drawer
 * every state gets.
 */
export const FEDERAL_CODE = 'US'

/** Same precedence as models/queries.py, applied to the federal set. */
export function deriveStatus(policies) {
  if (policies.some(p => p.status === 'enacted' || (p.policy_type === 'executive_order' && p.status === 'active'))) return 'enacted'
  if (policies.some(p => p.status === 'introduced')) return 'pending'
  if (policies.some(p => p.policy_type === 'guidance' || p.status === 'active')) return 'guidance'
  if (policies.some(p => p.status === 'failed')) return 'failed'
  return 'none'
}

export function buildFederalJurisdiction(policies) {
  return {
    code: FEDERAL_CODE,
    name: 'Federal',
    policy_count: policies.length,
    policy_status: deriveStatus(policies),
    isFederal: true,
  }
}
