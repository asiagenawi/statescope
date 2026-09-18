/**
 * Local search across states and policy text.
 *
 * The 2,200-odd words of policy summaries were only reachable by asking the
 * chat, which costs a round trip to Claude, takes seconds, and can be wrong.
 * The whole corpus is 75 rows already in memory, so searching it locally is
 * instant, free and exact -- the chat is for questions that need reasoning, not
 * for finding a bill by name.
 */

const STATE_EXACT = 100
const STATE_PREFIX = 90
const STATE_CONTAINS = 70
const BILL_EXACT = 85
const TITLE_PREFIX = 60
const TITLE_CONTAINS = 45
const SUMMARY_CONTAINS = 20

function norm(value) {
  return (value || '').toLowerCase()
}

/** Bill numbers are written "HB 531", "HB531" and "hb-531" interchangeably. */
function normBill(value) {
  return norm(value).replace(/[\s-]/g, '')
}

export function searchAll({ states = [], policies = [] }, rawQuery, { limit = 8 } = {}) {
  const q = norm(rawQuery).trim()
  if (q.length < 2) return { states: [], policies: [], query: q }

  const qBill = normBill(q)

  const stateHits = []
  for (const s of states) {
    const name = norm(s.name)
    let score = 0
    if (norm(s.code) === q) score = STATE_EXACT
    else if (name === q) score = STATE_EXACT
    else if (name.startsWith(q)) score = STATE_PREFIX
    else if (name.includes(q)) score = STATE_CONTAINS
    if (score) stateHits.push({ item: s, score })
  }

  const policyHits = []
  for (const p of policies) {
    const title = norm(p.title)
    let score = 0
    if (p.bill_number && normBill(p.bill_number) === qBill) score = BILL_EXACT
    else if (title.startsWith(q)) score = TITLE_PREFIX
    else if (title.includes(q)) score = TITLE_CONTAINS
    else if (norm(p.summary_text).includes(q)) score = SUMMARY_CONTAINS
    if (score) policyHits.push({ item: p, score })
  }

  return {
    query: q,
    states: rank(stateHits, limit).map(h => h.item),
    policies: rank(policyHits, limit).map(h => h.item),
  }
}

function rank(hits, limit) {
  return hits
    .sort((a, b) => b.score - a.score || compareTitle(a.item, b.item))
    .slice(0, limit)
}

function compareTitle(a, b) {
  return (a.name || a.title || '').localeCompare(b.name || b.title || '')
}

/**
 * The matched run inside a field, so a result can show why it matched rather
 * than making the reader hunt for it. Returns null when there is no match.
 */
export function matchExcerpt(text, query, radius = 60) {
  if (!text || !query) return null
  const at = norm(text).indexOf(norm(query))
  if (at === -1) return null

  const start = Math.max(0, at - radius)
  const end = Math.min(text.length, at + query.length + radius)

  return {
    before: (start > 0 ? '…' : '') + text.slice(start, at),
    match: text.slice(at, at + query.length),
    after: text.slice(at + query.length, end) + (end < text.length ? '…' : ''),
  }
}
