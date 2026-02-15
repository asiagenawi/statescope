import { useState, useRef, useEffect } from 'react'
import { postJSON } from '../../utils/api'
import ChatMarkdown from '../ChatMarkdown'

function TrendsChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q || loading) return
    setInput('')

    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const data = await postJSON('/ask', { question: q })
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="trends-chat">
      <div className="trends-chat-header">Ask about trends</div>
      <div className="trends-chat-messages">
        {messages.length === 0 && (
          <p className="trends-chat-empty">Ask questions about policy trends, comparisons, or data insights.</p>
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
      <form className="panel-chat-form" onSubmit={handleSubmit} style={{ padding: '0.6rem 0.75rem 1rem' }}>
        <input
          type="text"
          className="panel-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about trends..."
          disabled={loading}
        />
        <button type="submit" className="panel-chat-send" disabled={loading || !input.trim()}>
          &rarr;
        </button>
      </form>
    </div>
  )
}

export default TrendsChat
