import { useState } from 'react'
import { postJSON } from '../utils/api'

export function useAsk() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function ask(question) {
    setLoading(true)
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: question }])

    try {
      const data = await postJSON('/ask', { question })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }])
    } catch (err) {
      setError(err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([])
    setError(null)
  }

  return { messages, loading, error, ask, clearChat }
}
