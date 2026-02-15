import { useState, useEffect } from 'react'
import { fetchJSON } from '../utils/api'

export function useStates() {
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJSON('/states')
      .then(setStates)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { states, loading, error }
}
