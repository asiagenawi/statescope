import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Guards on the build artifact the whole frontend reads.
 *
 * The map has no backend to fall back on, and the methodology panel makes
 * specific public claims about sourcing. If the seed data or the export script
 * drifts, that should fail here rather than quietly ship a map that is wrong or
 * a claim that is no longer true.
 */
const snapshot = JSON.parse(
  readFileSync(fileURLToPath(new URL('../public/data/snapshot.json', import.meta.url)), 'utf8'),
)

test('snapshot: covers every state plus DC', () => {
  assert.equal(snapshot.states.length, 51)
  const codes = new Set(snapshot.states.map(s => s.code))
  assert.equal(codes.size, 51, 'no duplicate state codes')
  assert.ok(codes.has('DC'))
})

test('snapshot: every state has the fields the map draws from', () => {
  for (const s of snapshot.states) {
    assert.ok(s.fips, `${s.code} has a FIPS id`)
    assert.ok(s.name, `${s.code} has a name`)
    assert.ok(
      ['none', 'failed', 'guidance', 'pending', 'enacted'].includes(s.policy_status),
      `${s.code} has a known status, got ${s.policy_status}`,
    )
    assert.equal(typeof s.policy_count, 'number')
  }
})

test('snapshot: derived status agrees with the policies themselves', () => {
  // Mirrors the precedence in models/queries.py and the methodology panel.
  const byState = {}
  for (const p of snapshot.policies) {
    if (p.state_code) (byState[p.state_code] ||= []).push(p)
  }

  for (const s of snapshot.states) {
    const policies = byState[s.code] || []
    const expected =
      policies.some(p => p.status === 'enacted' || (p.policy_type === 'executive_order' && p.status === 'active')) ? 'enacted'
        : policies.some(p => p.status === 'introduced') ? 'pending'
          : policies.some(p => p.policy_type === 'guidance' || p.status === 'active') ? 'guidance'
            : policies.some(p => p.status === 'failed') ? 'failed'
              : 'none'

    assert.equal(s.policy_status, expected, `${s.code} status`)
    assert.equal(s.policy_count, policies.length, `${s.code} count`)
  }
})

test('snapshot: the methodology claim "every policy links to a primary source" holds', () => {
  const unsourced = snapshot.policies.filter(p => !p.source_url)
  assert.deepEqual(unsourced, [], 'an unsourced policy would make the About panel untrue')

  for (const p of snapshot.policies) {
    assert.doesNotThrow(() => new URL(p.source_url), `${p.title} has a parseable URL`)
  }
})

test('snapshot: policies carry the fields the cards and export rely on', () => {
  const TYPES = new Set(['bill', 'guidance', 'executive_order'])
  const STATUSES = new Set(['enacted', 'introduced', 'active', 'failed'])

  for (const p of snapshot.policies) {
    assert.ok(p.id != null, 'policy has an id')
    assert.ok(p.title, `policy ${p.id} has a title`)
    assert.ok(TYPES.has(p.policy_type), `policy ${p.id} type: ${p.policy_type}`)
    assert.ok(STATUSES.has(p.status), `policy ${p.id} status: ${p.status}`)
    assert.ok(['state', 'federal'].includes(p.level), `policy ${p.id} level`)
  }

  assert.equal(new Set(snapshot.policies.map(p => p.id)).size, snapshot.policies.length,
    'policy ids are unique')
})

test('snapshot: topic links point at real topics and real policies', () => {
  const topicIds = new Set(snapshot.topics.map(t => t.id))
  const policyIds = new Set(snapshot.policies.map(p => String(p.id)))

  for (const [policyId, ids] of Object.entries(snapshot.policy_topics)) {
    assert.ok(policyIds.has(policyId), `policy_topics references known policy ${policyId}`)
    for (const id of ids) {
      assert.ok(topicIds.has(id), `topic ${id} exists`)
    }
  }
})

test('snapshot: carries a curation date, not a build date', () => {
  assert.match(snapshot.data_updated, /^\d{4}-\d{2}$/)
})
