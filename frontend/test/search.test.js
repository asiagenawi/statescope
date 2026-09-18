import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { searchAll, matchExcerpt } from '../src/utils/search.js'

const snapshot = JSON.parse(
  readFileSync(fileURLToPath(new URL('../public/data/snapshot.json', import.meta.url)), 'utf8'),
)

test('search: ignores queries too short to be useful', () => {
  assert.deepEqual(searchAll(snapshot, 'a').states, [])
  assert.deepEqual(searchAll(snapshot, '').policies, [])
})

test('search: a state code beats a partial name match', () => {
  const { states } = searchAll(snapshot, 'CA')
  assert.equal(states[0].code, 'CA', 'exact code ranks first')
})

test('search: prefix matches outrank mid-string ones', () => {
  const { states } = searchAll(snapshot, 'new')
  assert.ok(states.every(s => s.name.toLowerCase().includes('new')))
  assert.ok(states[0].name.toLowerCase().startsWith('new'))
})

test('search: finds policies by bill number regardless of spacing', () => {
  const withBill = snapshot.policies.find(p => p.bill_number)
  for (const variant of [
    withBill.bill_number,
    withBill.bill_number.replace(/\s/g, ''),
    withBill.bill_number.toLowerCase(),
  ]) {
    const { policies } = searchAll(snapshot, variant)
    assert.ok(
      policies.some(p => p.id === withBill.id),
      `"${variant}" finds ${withBill.bill_number}`,
    )
  }
})

test('search: reaches into summary text the chat used to be needed for', () => {
  const { policies } = searchAll(snapshot, 'teacher', { limit: 20 })
  assert.ok(policies.length > 0, 'summaries are searchable')
  // At least one hit should match only via the summary, not the title.
  assert.ok(
    policies.some(p => !p.title.toLowerCase().includes('teacher')),
    'a summary-only match is reachable',
  )
})

test('search: title matches outrank summary-only matches', () => {
  const corpus = {
    states: [],
    policies: [
      { id: 1, title: 'Unrelated act', summary_text: 'mentions privacy once' },
      { id: 2, title: 'Privacy in schools', summary_text: 'nothing relevant' },
    ],
  }
  const { policies } = searchAll(corpus, 'privacy')
  assert.equal(policies[0].id, 2, 'the title match comes first')
})

test('search: respects the result limit', () => {
  const { policies } = searchAll(snapshot, 'ai', { limit: 3 })
  assert.ok(policies.length <= 3)
})

test('excerpt: returns the matched run with surrounding context', () => {
  const e = matchExcerpt('Directs the department to expand teacher training statewide.', 'teacher')
  assert.equal(e.match, 'teacher')
  assert.ok(e.before.includes('expand'))
  assert.ok(e.after.includes('training'))
})

test('excerpt: is case-insensitive but preserves original casing', () => {
  const e = matchExcerpt('Teacher Training programs', 'teacher')
  assert.equal(e.match, 'Teacher', 'the source casing is kept for display')
})

test('excerpt: returns null when there is no match', () => {
  assert.equal(matchExcerpt('nothing here', 'absent'), null)
  assert.equal(matchExcerpt(null, 'x'), null)
})

test('federal policies are reachable, not orphaned by having no state code', async () => {
  const { buildFederalJurisdiction, deriveStatus } = await import('../src/utils/federal.js')
  const federal = snapshot.policies.filter(p => !p.state_code)

  assert.ok(federal.length > 0, 'the dataset contains federal policy')

  const jurisdiction = buildFederalJurisdiction(federal)
  assert.equal(jurisdiction.code, 'US')
  assert.equal(jurisdiction.policy_count, federal.length)
  assert.ok(jurisdiction.isFederal)

  // Same precedence the states use.
  assert.equal(
    deriveStatus([{ status: 'active', policy_type: 'executive_order' }]),
    'enacted',
    'an executive order in force is binding',
  )
  assert.equal(deriveStatus([{ status: 'introduced', policy_type: 'bill' }]), 'pending')
  assert.equal(deriveStatus([]), 'none')
})
