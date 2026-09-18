import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { linkifyCitations } from '../utils/citations'

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
