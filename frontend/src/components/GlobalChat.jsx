import { useState, useRef, useEffect, useCallback } from 'react'
import { postJSON } from '../utils/api'
import ChatMarkdown from './ChatMarkdown'

const PLACEHOLDERS = [
  'Which states have AI literacy laws?',
  'Compare California and Texas AI policies',
  'What bills were introduced in 2024?',
  'Which states have pending AI education bills?',
]

const SUGGESTIONS = [
  'Which states require AI literacy?',
  'Compare California and Texas policies',
  "What's the most common policy topic?",
  'Which states have pending legislation?',
]

let nextId = 2

function createConvo(name) {
  return { id: nextId++, name, messages: [] }
}

function GlobalChat() {
  const [convos, setConvos] = useState([{ id: 1, name: 'New chat', messages: [] }])
  const [activeId, setActiveId] = useState(1)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [showList, setShowList] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const messagesEndRef = useRef(null)

  const active = convos.find(c => c.id === activeId)
  const messages = active?.messages || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const updateMessages = useCallback((id, updater) => {
    setConvos(prev => prev.map(c =>
      c.id === id ? { ...c, messages: updater(c.messages) } : c
    ))
  }, [])

  async function sendQuestion(q) {
    if (!q || loading) return

    if (messages.length === 0) {
      setConvos(prev => prev.map(c =>
        c.id === activeId ? { ...c, name: q.length > 30 ? q.slice(0, 30) + '...' : q } : c
      ))
    }

    updateMessages(activeId, prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const data = await postJSON('/ask', { question: q })
      updateMessages(activeId, prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      updateMessages(activeId, prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setInput('')
    sendQuestion(q)
  }

  function handleNew() {
    const c = createConvo('New chat')
    setConvos(prev => [...prev, c])
    setActiveId(c.id)
    setShowList(false)
  }

  function handleDelete(id) {
    const remaining = convos.filter(c => c.id !== id)
    if (remaining.length === 0) {
      const c = createConvo('New chat')
      setConvos([c])
      setActiveId(c.id)
    } else {
      setConvos(remaining)
      if (activeId === id) setActiveId(remaining[remaining.length - 1].id)
    }
  }

  function handleSwitch(id) {
    setActiveId(id)
    setShowList(false)
  }

  return (
    <div className={`global-chat ${mobileOpen ? 'global-chat--mobile-open' : ''}`}>
      <button className="global-chat-mobile-toggle" onClick={() => setMobileOpen(o => !o)}>
        {mobileOpen ? '✕ Close' : (
          <>
            <span className="mobile-toggle-handle"></span>
            <span className="mobile-toggle-label">Let's chat — AI</span>
          </>
        )}
      </button>
      <div className="global-chat-header">
        <button className="global-chat-tab-toggle" onClick={() => setShowList(s => !s)}>
          Continue Previous Conversations
          <span className="global-chat-chevron">{showList ? '▴' : '▾'}</span>
        </button>
        <button className="global-chat-new" onClick={handleNew} title="New conversation">+ New</button>
      </div>

      {showList && (
        <div className="global-chat-list">
          {convos.map(c => (
            <div
              key={c.id}
              className={`global-chat-list-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => handleSwitch(c.id)}
            >
              <span className="global-chat-list-name">{c.name}</span>
              {convos.length > 1 && (
                <button
                  className="global-chat-list-delete"
                  onClick={e => { e.stopPropagation(); handleDelete(c.id) }}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="global-chat-messages">
        {messages.length === 0 && (
          <div className="global-chat-empty">
            <p className="global-chat-empty-text">Ask about AI education policy across all 50 states</p>
            <div className="global-chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="global-chat-suggestion"
                  onClick={() => sendQuestion(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`panel-chat-msg panel-chat-msg--${msg.role}`}>
            {msg.role === 'user' ? msg.content : <ChatMarkdown content={msg.content} />}
          </div>
        ))}
        {loading && (
          <div className="panel-chat-msg panel-chat-msg--assistant panel-chat-typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="global-chat-form" onSubmit={handleSubmit}>
        <div className="global-chat-input-wrap">
          <textarea
            className="global-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            disabled={loading}
            rows={1}
          />
          <button type="submit" className="global-chat-send" disabled={loading || !input.trim()}>
            &rarr;
          </button>
        </div>
      </form>
    </div>
  )
}

export default GlobalChat
