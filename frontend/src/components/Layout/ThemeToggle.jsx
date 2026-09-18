import { useTheme } from '../../hooks/useTheme'

const NEXT_LABEL = {
  system: 'Match system appearance. Click for light.',
  light: 'Light appearance. Click for dark.',
  dark: 'Dark appearance. Click to match system.',
}

const Sun = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
    <circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1M12.9 12.9l-1.1-1.1M4.2 4.2 3.1 3.1"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

const Moon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
    <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z"
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

const Auto = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
    <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 2.4a5.6 5.6 0 0 1 0 11.2Z" fill="currentColor" />
  </svg>
)

/**
 * Cycles system -> light -> dark. "System" is an explicit state rather than a
 * hidden default, so someone who has never chosen keeps following their OS.
 */
function ThemeToggle() {
  const { preference, cycle } = useTheme()
  const Icon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Auto

  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      title={NEXT_LABEL[preference]}
      aria-label={NEXT_LABEL[preference]}
    >
      <Icon />
    </button>
  )
}

export default ThemeToggle
