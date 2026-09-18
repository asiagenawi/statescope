import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { buildFindings, completeYears, recentPolicies } from '../src/utils/findings.js'

const snapshot = JSON.parse(
  readFileSync(fileURLToPath(new URL('../public/data/snapshot.json', import.meta.url)), 'utf8'),
)

test('findings: the truncated final year is excluded from trend claims', () => {
  // Curated in Feb 2026, so 2026 holds a few weeks of data. Treating that as a
  // decline would be an artifact of when the data was gathered.
  const years = completeYears(snapshot.policies, snapshot.data_updated).map(([y]) => y)
  assert.ok(!years.includes('2026'), '2026 is in progress and must not anchor a trend')
  assert.ok(years.includes('2024'), 'complete years are still compared')
})

test('findings: a complete dataset uses every year', () => {
  const policies = [
    { id: 1, date_introduced: '2023-01-01' },
    { id: 2, date_introduced: '2024-01-01' },
  ]
  assert.deepEqual(completeYears(policies, '2025-06').map(([y]) => y), ['2023', '2024'])
})

test('findings: every claim is backed by the data it cites', () => {
  const findings = buildFindings(
    { ...snapshot, policyTopics: snapshot.policy_topics },
    snapshot.data_updated,
  )
  assert.ok(findings.length >= 3, 'produces a real briefing')

  const binding = findings.find(f => f.id === 'binding')
  const actualBinding = snapshot.policies.filter(
    p => p.status === 'enacted' || (p.policy_type === 'executive_order' && p.status === 'active'),
  ).length
  assert.ok(
    binding.headline.startsWith(`${actualBinding} of ${snapshot.policies.length}`),
    `binding count matches the data (${actualBinding})`,
  )

  const gaps = findings.find(f => f.id === 'gaps')
  const untracked = snapshot.states.filter(s => !s.policy_count)
  assert.ok(gaps.headline.startsWith(String(untracked.length)))
  // Absence must never be stated as fact about the world.
  assert.match(gaps.detail, /not that nothing is happening/)
})

test('findings: degrades quietly on an empty dataset', () => {
  assert.deepEqual(buildFindings({ policies: [], states: [] }, '2026-02'), [])
})

test('recent: newest first, undated rows dropped', () => {
  const recent = recentPolicies(snapshot.policies, 5)
  assert.equal(recent.length, 5)
  for (let i = 1; i < recent.length; i++) {
    assert.ok(
      recent[i - 1].date_introduced >= recent[i].date_introduced,
      'sorted newest first',
    )
  }
  assert.ok(recent.every(p => p.date_introduced))
})

test('recent: does not mutate the input array', () => {
  const input = [
    { id: 1, date_introduced: '2023-01-01' },
    { id: 2, date_introduced: '2025-01-01' },
  ]
  recentPolicies(input)
  assert.equal(input[0].id, 1, 'caller ordering is preserved')
})
