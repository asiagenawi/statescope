import { useState, useEffect } from 'react'
import { fetchJSON } from '../utils/api'

export function useTrends(type = 'timeline', filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.state) params.set('state', filters.state)
    if (filters.topic_id) params.set('topic_id', filters.topic_id)
    if (filters.policy_type) params.set('policy_type', filters.policy_type)
    const qs = params.toString()
    const url = `/trends/${type}${qs ? '?' + qs : ''}`

    fetchJSON(url)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [type, filterKey])

  return { data, loading, error }
}
