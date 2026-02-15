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

function StatePolicyPanel({ state, onClose }) {
  const { policies, loading, error } = usePolicies(state.code)
  const isEmpty = !loading && !error && policies.length === 0
  const status = state.policy_status || 'none'

  return (
    <div
      className={`policy-panel${isEmpty ? ' policy-panel--collapsed' : ''}`}
      style={{ backgroundColor: STATUS_TINTS[status] || '#ffffff' }}
    >
      <div className="policy-panel-header" style={{ backgroundColor: STATUS_TINTS[status] || '#ffffff' }}>
        <h3>{state.name}</h3>
        <button className="panel-close-btn" onClick={onClose}>&times;</button>
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
