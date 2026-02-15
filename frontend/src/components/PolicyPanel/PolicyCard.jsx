const STATUS_BADGE_COLORS = {
  enacted: { bg: '#d4f0ec', text: '#1a6b61', accent: '#2A9D8F' },
  introduced: { bg: '#fdf0cd', text: '#8a6310', accent: '#E9A820' },
  active: { bg: '#dfe3f3', text: '#3d4d8a', accent: '#6C7EC4' },
  failed: { bg: '#fee2e2', text: '#991b1b', accent: '#e05252' },
}

function PolicyCard({ policy }) {
  const badge = STATUS_BADGE_COLORS[policy.status] || STATUS_BADGE_COLORS.active

  return (
    <div className="policy-card" style={{ borderLeftColor: badge.accent }}>
      <div className="policy-card-header">
        <h4 className="policy-card-title">{policy.title}</h4>
        <span
          className="policy-status-badge"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {policy.status}
        </span>
      </div>
      {policy.bill_number && (
        <span className="policy-bill-number">{policy.bill_number}</span>
      )}
      <p className="policy-card-type">
        {policy.policy_type.replace('_', ' ')} &middot; {policy.date_introduced}
      </p>
      {policy.summary_text && (
        <p className="policy-card-summary">{policy.summary_text}</p>
      )}
      {policy.source_url && (
        <a
          className="policy-card-link"
          href={policy.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View source
        </a>
      )}
    </div>
  )
}

export default PolicyCard
