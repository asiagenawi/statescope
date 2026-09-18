import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describeStatus, groupPolicies } from '../src/utils/policyStatus.js'

const snapshot = JSON.parse(
  readFileSync(fileURLToPath(new URL('../public/data/snapshot.json', import.meta.url)), 'utf8'),
)

test('status: guidance and an executive order are not given the same label', () => {
  // Both carry status "active"; only one of them is law.
  const guidance = describeStatus({ policy_type: 'guidance', status: 'active' })
  const order = describeStatus({ policy_type: 'executive_order', status: 'active' })

  assert.notEqual(guidance.label, order.label)
  assert.equal(guidance.binding, false, 'guidance is not law')
  assert.equal(order.binding, true, 'an executive order in force is')
})

test('status: a revoked executive order is not called "Failed"', () => {
  // "Failed" reads as "never took effect"; EO 14110 was in force and then revoked.
  const revoked = describeStatus({ policy_type: 'executive_order', status: 'failed' })
  assert.equal(revoked.label, 'Revoked')
  assert.equal(revoked.binding, false)
})

test('status: the label always agrees with the binding count', () => {
  // The contradiction this module fixes: a badge implying force on something
  // the binding count excludes.
  const BINDING_LABELS = new Set(['Enacted', 'In force'])
  for (const p of snapshot.policies) {
    const d = describeStatus(p)
    assert.equal(
      BINDING_LABELS.has(d.label), d.binding,
      `${p.policy_type}/${p.status} labelled "${d.label}" but binding=${d.binding}`,
    )
  }
})

test('status: every combination in the real data is explicitly handled', () => {
  const combos = new Set(snapshot.policies.map(p => `${p.policy_type}:${p.status}`))
  for (const combo of combos) {
    const [policy_type, status] = combo.split(':')
    const d = describeStatus({ policy_type, status })
    assert.ok(d.label && d.label !== 'Unknown', `${combo} has a real label`)
    assert.ok(['enacted', 'pending', 'guidance', 'failed'].includes(d.tone), `${combo} tone`)
  }
})

test('status: an unknown combination degrades instead of throwing', () => {
  const d = describeStatus({ policy_type: 'treaty', status: 'ratified' })
  assert.equal(d.label, 'Ratified')
  assert.equal(d.binding, false)
  assert.equal(describeStatus(null), null)
})

test('grouping: binding orders and non-binding guidance land in different groups', () => {
  const groups = groupPolicies([
    { id: 1, policy_type: 'guidance', status: 'active' },
    { id: 2, policy_type: 'executive_order', status: 'active' },
    { id: 3, policy_type: 'bill', status: 'enacted' },
  ])
  const keyOf = id => groups.find(g => g.items.some(p => p.id === id)).key
  assert.notEqual(keyOf(1), keyOf(2))
  assert.equal(keyOf(3), 'enacted-law')
})

test('grouping: nothing is silently dropped', () => {
  const policies = [
    { id: 1, policy_type: 'bill', status: 'enacted' },
    { id: 2, policy_type: 'treaty', status: 'ratified' },
  ]
  const total = groupPolicies(policies).reduce((n, g) => n + g.items.length, 0)
  assert.equal(total, policies.length, 'an unmatched policy still appears somewhere')
})

test('grouping: every real state keeps all of its policies', () => {
  const byState = {}
  for (const p of snapshot.policies) {
    if (p.state_code) (byState[p.state_code] ||= []).push(p)
  }
  for (const [code, policies] of Object.entries(byState)) {
    const total = groupPolicies(policies).reduce((n, g) => n + g.items.length, 0)
    assert.equal(total, policies.length, `${code} keeps all ${policies.length}`)
  }
})
