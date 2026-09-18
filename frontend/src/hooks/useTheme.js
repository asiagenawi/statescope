import { useState, useEffect, useCallback } from 'react'
import { THEMES } from '../utils/colors'

const STORAGE_KEY = 'statescope.theme'

/**
 * Theme resolution: an explicit choice wins, otherwise follow the OS.
 *
 * "system" is a real third state rather than a hidden default -- someone who has
 * never touched the control should track their OS when it changes, and someone
 * who has chosen should not have that overridden at dusk.
 */
export function readPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Blocked storage just means falling back to the system setting.
  }
  return 'system'
}

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [preference, setPreference] = useState(readPreference)
  const [system, setSystem] = useState(systemTheme)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = e => setSystem(e.matches ? 'dark' : 'light')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const theme = preference === 'system' ? system : preference

  useEffect(() => {
    // An explicit choice is stamped on the root; "system" removes the stamp so
    // the media query in the stylesheet takes over again.
    const root = document.documentElement
    if (preference === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', preference)

    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // Not persisting is survivable; the session still honours the choice.
    }
  }, [preference])

  const cycle = useCallback(() => {
    setPreference(p => (p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system'))
  }, [])

  return { theme, preference, setPreference, cycle, palette: THEMES[theme] }
}
