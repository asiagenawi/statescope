import { isBinding } from './compare.js'

/**
 * What to call a policy, given both what it is and what state it is in.
 *
 * Status alone is not enough, and labelling by status alone made the interface
 * contradict itself in two places:
 *
 *  - A guidance document and an executive order both carry status "active", and
 *    both were labelled "In effect". But the methodology says guidance is not
 *    law, and isBinding() agrees — it counts the executive orders and excludes
 *    the guidance. So the badge told a reader those two were the same thing
 *    while the binding count treated them as opposites. 33 guidance documents
 *    were affected.
 *
 *  - An executive order with status "failed" was labelled "Failed", which reads
 *    as "never took effect". The one in this dataset is EO 14110, which was in
 *    force and then revoked — the opposite claim.
 *
 * Labels are therefore derived from (type, status), and each one carries whether
 * it binds, so the card can say so rather than leaving the reader to infer it.
 */

const LABELS = {
  'bill:enacted': { label: 'Enacted', tone: 'enacted' },
  'bill:introduced': { label: 'Pending', tone: 'pending' },
  'bill:failed': { label: 'Failed', tone: 'failed' },
  'executive_order:active': { label: 'In force', tone: 'enacted' },
  'executive_order:failed': { label: 'Revoked', tone: 'failed' },
  'executive_order:enacted': { label: 'In force', tone: 'enacted' },
  'guidance:active': { label: 'Published', tone: 'guidance' },
  'guidance:failed': { label: 'Withdrawn', tone: 'failed' },
}

const FALLBACK_TONE = {
  enacted: 'enacted',
  active: 'guidance',
  introduced: 'pending',
  failed: 'failed',
}

export function describeStatus(policy) {
  if (!policy) return null
  const key = `${policy.policy_type}:${policy.status}`
  const known = LABELS[key]

  const binding = isBinding(policy)

  if (known) return { ...known, binding }

  // An unrecognised combination still has to render something truthful.
  return {
    label: String(policy.status || 'Unknown').replace(/^./, c => c.toUpperCase()),
    tone: FALLBACK_TONE[policy.status] || 'guidance',
    binding,
  }
}

/**
 * Drawer groupings, ordered by how much weight each carries. Grouping by raw
 * status would put binding executive orders and non-binding guidance in the
 * same bucket, which is the conflation this module exists to undo.
 */
export const POLICY_GROUPS = [
  {
    key: 'enacted-law',
    label: 'Enacted law',
    match: p => p.policy_type === 'bill' && p.status === 'enacted',
  },
  {
    key: 'in-force',
    label: 'Executive orders in force',
    match: p => p.policy_type === 'executive_order' && ['active', 'enacted'].includes(p.status),
  },
  {
    key: 'guidance',
    label: 'Published guidance',
    hint: 'Not legally binding',
    match: p => p.policy_type === 'guidance' && p.status === 'active',
  },
  {
    key: 'pending',
    label: 'Pending',
    match: p => p.status === 'introduced',
  },
  {
    key: 'ended',
    label: 'Failed or revoked',
    match: p => p.status === 'failed',
  },
]

export function groupPolicies(policies = []) {
  const claimed = new Set()
  const groups = []

  for (const group of POLICY_GROUPS) {
    const items = policies.filter(p => !claimed.has(p.id) && group.match(p))
    items.forEach(p => claimed.add(p.id))
    if (items.length) groups.push({ ...group, items })
  }

  // Nothing may be silently dropped: an unmatched combination still appears.
  const rest = policies.filter(p => !claimed.has(p.id))
  if (rest.length) groups.push({ key: 'other', label: 'Other', items: rest })

  return groups
}
