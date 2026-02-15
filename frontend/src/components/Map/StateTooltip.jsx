import { STATUS_COLORS } from '../../utils/colors'

const STATUS_LABELS = {
  enacted: 'Enacted legislation',
  pending: 'Pending bills',
  guidance: 'Guidance only',
  failed: 'Failed legislation',
  none: 'No policy yet',
}

function StateTooltip({ state, position }) {
  const status = state.policy_status || 'none'
  return (
    <div
      className="state-tooltip"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      <strong>{state.name}</strong>
      <span className="tooltip-status">
        <span
          className="tooltip-status-dot"
          style={{ backgroundColor: STATUS_COLORS[status] }}
        />
        {STATUS_LABELS[status]}
      </span>
      {state.policy_count > 0 && (
        <span className="tooltip-count">
          {state.policy_count} {state.policy_count === 1 ? 'policy' : 'policies'} — click to view
        </span>
      )}
    </div>
  )
}

export default StateTooltip
