import { usePolicies } from '../../hooks/usePolicies'
import { STATUS_COLORS } from '../../utils/colors'
import PolicyCard from './PolicyCard'

const STATUS_TINTS = {
  enacted: '#2A9D8F15',
  pending: '#E9A82015',
  guidance: '#6C7EC415',
  failed: '#F4B4B415',
  none: '#E8E4DF20',
}

function StateDropdown({ states, selectedCode, onSelect }) {
  const sorted = [...states].sort((a, b) => a.code.localeCompare(b.code))
  return (
    <select
      className="policy-state-dropdown"
      value={selectedCode || ''}
      onChange={(e) => {
        const s = states.find(st => st.code === e.target.value)
        if (s) onSelect(s)
      }}
    >
      <option value="" disabled>State</option>
      {sorted.map(s => (
        <option key={s.code} value={s.code}>{s.code}</option>
      ))}
    </select>
  )
}

function StatePolicyPanel({ state, states = [], onClose, onSelectState, style }) {
  const { policies, loading, error } = usePolicies(state?.code)
  const isEmpty = !loading && !error && policies.length === 0
  const status = state?.policy_status || 'none'

  if (!state) {
    return (
      <div className="policy-panel policy-panel--collapsed" style={style}>
        <div className="policy-panel-header">
          <h3>Policies</h3>
          {states.length > 0 && <StateDropdown states={states} selectedCode={null} onSelect={onSelectState} />}
        </div>
        <div className="policy-panel-body">
          <p className="panel-message">Select a state to view its AI education policies.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`policy-panel${isEmpty ? ' policy-panel--collapsed' : ''}`}
      style={{ backgroundColor: STATUS_TINTS[status] || '#ffffff', ...style }}
    >
      <div className="policy-panel-header" style={{ backgroundColor: STATUS_TINTS[status] || '#ffffff' }}>
        <h3>{state.name}</h3>
        <div className="policy-panel-header-right">
          {states.length > 0 && <StateDropdown states={states} selectedCode={state.code} onSelect={onSelectState} />}
          <button className="panel-close-btn" onClick={onClose}>&times;</button>
        </div>
      </div>
      <div className="policy-panel-body">
        {loading && <p className="panel-message">Loading policies...</p>}
        {error && <p className="panel-message">Error loading policies.</p>}
        {!loading && !error && policies.length === 0 && (
          <p className="panel-message">No AI education policies found for {state.name}.</p>
        )}
        {policies.map(p => (
          <PolicyCard key={p.id} policy={p} />
        ))}
      </div>
    </div>
  )
}

export default StatePolicyPanel
