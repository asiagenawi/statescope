import { useState, useEffect, useRef } from 'react'
import Caret from './Layout/Caret'

const STATUS_LABELS = {
  enacted: 'Enacted',
  introduced: 'Pending',
  active: 'In effect',
  failed: 'Failed',
}

/**
 * The policies an answer was grounded in, numbered to match its [1] / [2]
 * citations. Without this the "check linked sources" disclaimer was a promise
 * the UI never kept -- the backend sent these and the client dropped them.
 */
function ChatSources({ sources, highlighted, onDismissHighlight }) {
  const [open, setOpen] = useState(false)
  const listRef = useRef(null)

  // Bring the cited entry into view once the list has expanded to contain it.
  useEffect(() => {
    if (highlighted == null) return
    const el = listRef.current?.querySelector(`[data-cite="${highlighted}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [highlighted])

  if (!sources?.length) return null

  // A citation click should reveal the list, not silently scroll a closed one.
  const isOpen = open || highlighted != null

  return (
    <div className="chat-sources">
      <button
        className="chat-sources-toggle"
        onClick={() => {
          setOpen(o => !o)
          onDismissHighlight?.()
        }}
        aria-expanded={isOpen}
      >
        {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        <Caret open={isOpen} />
      </button>

      {isOpen && (
        <ol className="chat-sources-list" ref={listRef}>
          {sources.map((s, i) => {
            const n = i + 1
            const Wrapper = s.url ? 'a' : 'div'
            const linkProps = s.url
              ? { href: s.url, target: '_blank', rel: 'noopener noreferrer' }
              : {}
            return (
              <li
                key={`${s.id}-${n}`}
                data-cite={n}
                className={`chat-source${highlighted === n ? ' is-highlighted' : ''}`}
              >
                <span className="chat-source-num" aria-hidden="true">{n}</span>
                <Wrapper className="chat-source-body" {...linkProps}>
                  <span className="chat-source-title">{s.title}</span>
                  <span className="chat-source-meta">
                    {s.state}
                    {s.status && ` · ${STATUS_LABELS[s.status] || s.status}`}
                  </span>
                </Wrapper>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default ChatSources
