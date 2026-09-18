import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

/**
 * Turn the bare [1] / [2] citation markers Claude is instructed to emit into
 * links pointing at the numbered source list rendered beneath the answer.
 *
 * The negative lookahead leaves genuine markdown links -- [label](url) -- alone,
 * and the bounds check means a citation Claude invented beyond the number of
 * retrieved policies stays plain text rather than becoming a dead link.
 */
function linkifyCitations(content, sourceCount) {
  if (!sourceCount) return content
  return content.replace(/\[(\d+)\](?!\()/g, (match, n) => {
    const index = Number(n)
    return index >= 1 && index <= sourceCount ? `[${n}](#cite-${n})` : match
  })
}

function ChatMarkdown({ content, sourceCount = 0, onCitationClick }) {
  const prepared = useMemo(
    () => linkifyCitations(content, sourceCount),
    [content, sourceCount],
  )

  const components = useMemo(() => ({
    a({ href, children, ...props }) {
      if (href?.startsWith('#cite-')) {
        const n = Number(href.slice(6))
        return (
          <button
            type="button"
            className="citation-ref"
            onClick={() => onCitationClick?.(n)}
            aria-label={`Jump to source ${n}`}
          >
            {n}
          </button>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      )
    },
  }), [onCitationClick])

  return (
    <div className="chat-markdown">
      <ReactMarkdown components={components}>{prepared}</ReactMarkdown>
    </div>
  )
}

export default ChatMarkdown
