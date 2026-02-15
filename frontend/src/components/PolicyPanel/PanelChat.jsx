import { useState, useRef, useEffect } from 'react'
import { postJSON } from '../../utils/api'
import ChatMarkdown from '../ChatMarkdown'

function PanelChat({ stateName }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    setLoading(false)
  }, [stateName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q || loading) return
    setInput('')

    const fullQuestion = `Regarding ${stateName}: ${q}`
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const data = await postJSON('/ask', { question: fullQuestion })
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-chat">
      <div className="panel-chat-header">Let's chat about {stateName}!</div>
      {messages.length > 0 && (
        <div className="panel-chat-messages">
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
      )}
      <form className="panel-chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="panel-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask about ${stateName} policies...`}
          disabled={loading}
        />
        <button type="submit" className="panel-chat-send" disabled={loading || !input.trim()}>
          &rarr;
        </button>
      </form>
    </div>
  )
}

export default PanelChat
