import StatStrip from './StatStrip'
import StateSearch from '../Map/StateSearch'

const VIEWS = [
  { id: 'map', label: 'Map' },
  { id: 'trends', label: 'Trends' },
]

function Header({ view, onViewChange, chatOpen, onToggleChat, snapshot, onSelectState, onOpenAbout }) {
  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <rect x="2" y="13" width="4.5" height="8" rx="1.25" fill="#86b6ef" />
            <rect x="9.75" y="8" width="4.5" height="13" rx="1.25" fill="#3987e5" />
            <rect x="17.5" y="3" width="4.5" height="18" rx="1.25" fill="#184f95" />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-name">StateScope</span>
          <span className="brand-tagline">AI in education policy, tracked</span>
        </span>
      </div>

      <nav className="view-nav" aria-label="Views">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`view-tab${view === v.id ? ' view-tab--active' : ''}`}
            onClick={() => onViewChange(v.id)}
            aria-current={view === v.id ? 'page' : undefined}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <StatStrip snapshot={snapshot} />

      <div className="header-actions">
        <StateSearch states={snapshot.states} onSelectState={onSelectState} />
        <button className="about-btn" onClick={onOpenAbout}>
          Methodology
        </button>
        <button
          className={`ask-btn${chatOpen ? ' ask-btn--active' : ''}`}
          onClick={onToggleChat}
          aria-expanded={chatOpen}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M8 1.5c3.6 0 6.5 2.4 6.5 5.4S11.6 12.3 8 12.3c-.5 0-1-.05-1.5-.14L3 14l.7-2.6C2.35 10.4 1.5 9 1.5 6.9 1.5 3.9 4.4 1.5 8 1.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          {chatOpen ? 'Close' : 'Ask'}
        </button>
      </div>
    </header>
  )
}

export default Header
