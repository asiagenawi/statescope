import test from 'node:test'
import assert from 'node:assert/strict'

import { linkifyCitations } from '../src/utils/citations.js'
import { policiesToCSV } from '../src/utils/export.js'
import { formatMonth } from '../src/utils/dates.js'
import { buildComparison, isBinding, parseCompareCodes, MAX_COMPARE } from '../src/utils/compare.js'
import { STATUS_COLORS, STATUS_ORDER, STATUS_LABELS, labelInkOn } from '../src/utils/colors.js'

test('citations: numbered markers become jump links', () => {
  assert.equal(
    linkifyCitations('California [1] and Texas [2].', 3),
    'California [1](#cite-1) and Texas [2](#cite-2).',
  )
})

test('citations: a genuine markdown link is left alone', () => {
  assert.equal(
    linkifyCitations('See [the bill](https://example.gov) and [1].', 2),
    'See [the bill](https://example.gov) and [1](#cite-1).',
  )
})

test('citations: a marker beyond the source count stays plain text', () => {
  // A dead citation would undermine the credibility the source list exists for.
  assert.equal(linkifyCitations('Out of range [9].', 3), 'Out of range [9].')
  assert.equal(linkifyCitations('No sources [1].', 0), 'No sources [1].')
})

test('citations: handles empty and missing content', () => {
  assert.equal(linkifyCitations('', 3), '')
  assert.equal(linkifyCitations(undefined, 3), undefined)
})

test('csv: quotes, commas and newlines survive a round trip', () => {
  const csv = policiesToCSV([
    { state_code: 'CA', title: 'AB 2885 - "AI Literacy" Act', summary_text: 'One,\ntwo' },
  ])
  assert.ok(csv.includes('""AI Literacy""'), 'embedded quotes are doubled')
  assert.ok(csv.includes('"One,\ntwo"'), 'commas and newlines stay inside the field')
  assert.equal(csv.split('\r\n')[0].split(',').length, 12, 'header has every column')
})

test('csv: a missing field becomes an empty cell, not "undefined"', () => {
  const csv = policiesToCSV([{ state_code: 'CA' }])
  assert.ok(!csv.includes('undefined'))
  assert.ok(!csv.includes('null'))
})

test('dates: month keys render the same everywhere', () => {
  assert.equal(formatMonth('2026-02'), 'February 2026')
  assert.equal(formatMonth('2026-12'), 'December 2026')
  assert.equal(formatMonth(null, 'unknown'), 'unknown')
})

test('colors: every status has a colour and a label, in escalating order', () => {
  assert.deepEqual(STATUS_ORDER, ['none', 'failed', 'guidance', 'pending', 'enacted'])
  for (const status of STATUS_ORDER) {
    assert.ok(STATUS_COLORS[status], `${status} has a colour`)
    assert.ok(STATUS_LABELS[status], `${status} has a label`)
  }
})

test('colors: only the darkest ramp step takes light ink', () => {
  // White on `pending` measures 3.64:1, below the 4.5 needed for label text.
  assert.equal(labelInkOn('enacted'), '#ffffff')
  for (const status of ['none', 'failed', 'guidance', 'pending']) {
    assert.equal(labelInkOn(status), '#0b0b0b', `${status} takes dark ink`)
  }
})

test('compare: binding means enacted law or an executive order in force', () => {
  assert.equal(isBinding({ status: 'enacted', policy_type: 'bill' }), true)
  assert.equal(isBinding({ status: 'active', policy_type: 'executive_order' }), true)
  assert.equal(isBinding({ status: 'introduced', policy_type: 'bill' }), false)
  assert.equal(isBinding({ status: 'active', policy_type: 'guidance' }), false, 'guidance is not law')
  assert.equal(isBinding({ status: 'failed', policy_type: 'bill' }), false)
})

test('compare: codes are normalised, de-duplicated and capped', () => {
  assert.deepEqual(parseCompareCodes('ca, tx'), ['CA', 'TX'])
  assert.deepEqual(parseCompareCodes('CA,CA,TX'), ['CA', 'TX'])
  assert.deepEqual(parseCompareCodes(''), [])
  assert.equal(parseCompareCodes('CA,TX,NY,FL,WA').length, MAX_COMPARE)
})

test('compare: counts, topic overlap and spans line up across columns', () => {
  const snapshot = {
    states: [
      { code: 'CA', name: 'California', policy_status: 'enacted' },
      { code: 'TX', name: 'Texas', policy_status: 'enacted' },
    ],
    policiesByState: {
      CA: [
        { id: 1, policy_type: 'bill', status: 'enacted', date_introduced: '2023-01-01' },
        { id: 2, policy_type: 'guidance', status: 'active', date_introduced: '2025-06-01' },
      ],
      TX: [
        { id: 3, policy_type: 'bill', status: 'introduced', date_introduced: '2024-03-01' },
      ],
    },
    policyTopics: { 1: [1, 2], 2: [3], 3: [1] },
    topics: [
      { id: 1, name: 'AI Literacy' },
      { id: 2, name: 'Student Privacy' },
      { id: 3, name: 'Teacher Training' },
    ],
  }

  const { columns, topicRows, shared, unique } = buildComparison(snapshot, ['CA', 'TX'])

  assert.equal(columns.length, 2)
  assert.equal(columns[0].policies.length, 2)
  assert.equal(columns[0].byType.bill, 1)
  assert.equal(columns[0].byType.guidance, 1)
  assert.equal(columns[0].binding, 1, 'the enacted bill binds, the guidance does not')
  assert.equal(columns[1].binding, 0, 'an introduced bill binds nothing')
  assert.equal(columns[0].firstYear, '2023')
  assert.equal(columns[0].latestYear, '2025')

  assert.equal(topicRows.length, 3, 'the union of both states\' topics')
  assert.deepEqual(shared, ['AI Literacy'], 'only AI Literacy is in both')
  assert.deepEqual(
    unique.map(u => `${u.name}:${u.code}`).sort(),
    ['Student Privacy:CA', 'Teacher Training:CA'],
  )
})

test('compare: unknown codes are dropped rather than rendering blank columns', () => {
  const snapshot = {
    states: [{ code: 'CA', name: 'California', policy_status: 'enacted' }],
    policiesByState: { CA: [] },
    policyTopics: {},
    topics: [],
  }
  assert.equal(buildComparison(snapshot, ['CA', 'ZZ']).columns.length, 1)
})
