import { useEffect, useRef } from 'react'

/**
 * Move focus into a drawer when it opens and hand it back when it closes.
 *
 * Without this a keyboard user who opens the policy panel is still parked on the
 * map behind it, and closing the panel drops focus to the top of the document.
 */
export function useDrawerFocus() {
  const ref = useRef(null)

  useEffect(() => {
    const returnTo = document.activeElement
    ref.current?.focus({ preventScroll: true })

    return () => {
      // Only restore if the trigger is still in the document and nothing else
      // has deliberately taken focus in the meantime.
      if (returnTo instanceof HTMLElement && document.contains(returnTo)) {
        returnTo.focus({ preventScroll: true })
      }
    }
  }, [])

  return ref
}
