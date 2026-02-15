import { useState, useEffect } from 'react'
import { fetchJSON } from '../utils/api'

export function usePolicies(stateCode) {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!stateCode) return
    setLoading(true)
    fetchJSON(`/states/${stateCode}/policies`)
      .then(setPolicies)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [stateCode])

  return { policies, loading, error }
}
