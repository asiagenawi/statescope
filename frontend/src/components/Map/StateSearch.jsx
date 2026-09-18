import { useState, useRef, useEffect, useMemo } from 'react'
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/colors'
import { searchAll, matchExcerpt } from '../../utils/search'

/**
 * One search box over both states and policy text.
 *
 * It began as a state jumper, but the substance of this dataset is in the policy
 * summaries -- finding "teacher training" used to mean asking the chat. Keeping
 * it a single field means the search people already reach for now answers both
 * kinds of question.
 */
function StateSearch({ snapshot, onSelectState, onSelectPolicy }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const results = useMemo(
    () => searchAll(snapshot, query, { limit: 5 }),
    [snapshot, query],
  )

  // One flat list so arrow keys move through both groups continuously.
  const flat = useMemo(() => [
    ...results.states.map(item => ({ kind: 'state', item })),
    ...results.policies.map(item => ({ kind: 'policy', item })),
  ], [results])

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function choose(entry) {
    if (!entry) return
    if (entry.kind === 'state') onSelectState(entry.item)
    else onSelectPolicy(entry.item)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e) {
    if (!flat.length) {
      if (e.key === 'Escape') setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(i => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(i => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(flat[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && query.trim().length >= 2
  const hasResults = flat.length > 0

  return (
    <div className="state-search" ref={rootRef}>
      <svg className="state-search-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className="state-search-input"
        placeholder="Search states and policies"
        value={query}
        onChange={e => { setQuery(e.target.value); setHighlight(0); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showList}
        aria-controls="search-results"
        aria-autocomplete="list"
        aria-label="Search states and policies"
      />

      {showList && (
        <div className="search-results" id="search-results">
          {!hasResults && (
            <p className="search-empty">
              Nothing matches “{query.trim()}”. Try a state, a bill number, or a
              topic like “teacher training”.
            </p>
          )}

          {results.states.length > 0 && (
            <>
              <p className="search-group">States</p>
              <ul role="listbox" aria-label="Matching states">
                {results.states.map((s, i) => (
                  <li key={s.code} role="option" aria-selected={highlight === i}>
                    <button
                      className={`search-option${highlight === i ? ' is-highlighted' : ''}`}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => choose({ kind: 'state', item: s })}
                    >
                      <span
                        className="state-search-dot"
                        style={{ backgroundColor: STATUS_COLORS[s.policy_status || 'none'] }}
                      />
                      <span className="state-search-name">{s.name}</span>
                      <span className="state-search-meta">
                        {STATUS_LABELS[s.policy_status || 'none']}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {results.policies.length > 0 && (
            <>
              <p className="search-group">
                Policies
                <span className="search-group-hint">title, bill number, summary</span>
              </p>
              <ul role="listbox" aria-label="Matching policies">
                {results.policies.map((p, i) => {
                  const idx = results.states.length + i
                  const excerpt = matchExcerpt(p.summary_text, results.query)
                  return (
                    <li key={p.id} role="option" aria-selected={highlight === idx}>
                      <button
                        className={`search-option search-option--policy${highlight === idx ? ' is-highlighted' : ''}`}
                        onMouseEnter={() => setHighlight(idx)}
                        onClick={() => choose({ kind: 'policy', item: p })}
                      >
                        <span className="search-policy-title">{p.title}</span>
                        <span className="search-policy-meta">
                          {p.state_name || 'Federal'}
                          {p.bill_number && ` · ${p.bill_number}`}
                        </span>
                        {excerpt && (
                          <span className="search-excerpt">
                            {excerpt.before}
                            <mark>{excerpt.match}</mark>
                            {excerpt.after}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default StateSearch
