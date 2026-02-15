import { useState, useRef, useEffect } from 'react'
import { useAsk } from '../../hooks/useAsk'
import MessageBubble from './MessageBubble'
import SuggestedQuestions from './SuggestedQuestions'

function QAChat() {
  const { messages, loading, ask, clearChat } = useAsk()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    ask(q)
  }

  function handleSuggestion(q) {
    if (loading) return
    ask(q)
  }

  return (
    <div className="qa-container">
      <div className="qa-header">
        <h2>Ask about AI Education Policy</h2>
        {messages.length > 0 && (
          <button className="qa-clear-btn" onClick={clearChat}>Clear chat</button>
        )}
      </div>

      <div className="qa-messages">
        {messages.length === 0 && (
          <SuggestedQuestions onSelect={handleSuggestion} disabled={loading} />
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-bubble typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="qa-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="qa-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about AI education policy..."
          disabled={loading}
        />
        <button type="submit" className="qa-submit-btn" disabled={loading || !input.trim()}>
          Ask
        </button>
      </form>
    </div>
  )
}

export default QAChat
