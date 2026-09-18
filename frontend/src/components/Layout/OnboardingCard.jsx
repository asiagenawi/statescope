import { useState } from 'react'

const STORAGE_KEY = 'statescope.onboarded'

/**
 * The orientation copy that used to sit permanently in the middle of the map.
 * It helps once; after that it is clutter, so it dismisses and stays dismissed.
 */
function OnboardingCard() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      // Private mode or blocked storage -- showing the card is the safe default.
      return false
    }
  })

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Not being able to remember the dismissal shouldn't break dismissing it.
    }
  }

  return (
    <div className="onboarding-card" role="note">
      <button className="icon-btn onboarding-close" onClick={dismiss} aria-label="Dismiss introduction">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <h2 className="onboarding-title">Who’s regulating AI in the classroom?</h2>
      <p className="onboarding-text">
        States are moving fast and in different directions. Darker states have
        stronger policy in force. <strong>Click any state</strong> to read its
        legislation and guidance, or <strong>ask the chat</strong> to compare
        states and find trends.
      </p>
      <button className="onboarding-cta" onClick={dismiss}>Explore the map</button>
    </div>
  )
}

export default OnboardingCard
