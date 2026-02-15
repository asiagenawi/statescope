import { useState, useEffect } from 'react'
import { fetchJSON } from '../../utils/api'

function FilterBar({ filters, onFilterChange }) {
  const [states, setStates] = useState([])
  const [topics, setTopics] = useState([])

  useEffect(() => {
    fetchJSON('/states').then(data => {
      const withPolicies = data.filter(s => s.policy_count > 0)
      setStates(withPolicies)
    })
    fetchJSON('/topics').then(setTopics)
  }, [])

  function handleChange(key, value) {
    onFilterChange({ ...filters, [key]: value || '' })
  }

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="filter-state">State</label>
        <select
          id="filter-state"
          value={filters.state || ''}
          onChange={e => handleChange('state', e.target.value)}
        >
          <option value="">All states</option>
          {states.map(s => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-topic">Topic</label>
        <select
          id="filter-topic"
          value={filters.topic_id || ''}
          onChange={e => handleChange('topic_id', e.target.value)}
        >
          <option value="">All topics</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-type">Type</label>
        <select
          id="filter-type"
          value={filters.policy_type || ''}
          onChange={e => handleChange('policy_type', e.target.value)}
        >
          <option value="">All types</option>
          <option value="bill">Bill</option>
          <option value="guidance">Guidance</option>
          <option value="executive_order">Executive Order</option>
        </select>
      </div>
    </div>
  )
}

export default FilterBar
