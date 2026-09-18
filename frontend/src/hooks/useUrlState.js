import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Keep the view, the selected state, and the Trends filters in the URL.
 *
 * A policy tracker gets cited -- "look at what Texas is doing" should be a link
 * someone can send, and a filtered Trends view should survive a reload. Written
 * with replaceState during interaction so the back button steps out of the app
 * rather than unwinding every click, but popstate is still honoured so a shared
 * link and the browser's own history both behave.
 */
const KEYS = ['view', 'state', 'topic', 'type', 'fstate', 'about']

function read() {
  const params = new URLSearchParams(window.location.search)
  const out = {}
  for (const k of KEYS) {
    const v = params.get(k)
    if (v) out[k] = v
  }
  return out
}

function write(next, { push = false } = {}) {
  const params = new URLSearchParams(window.location.search)
  for (const k of KEYS) {
    if (next[k]) params.set(k, next[k])
    else params.delete(k)
  }
  const qs = params.toString()
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`
  if (url === `${window.location.pathname}${window.location.search}`) return
  window.history[push ? 'pushState' : 'replaceState'](null, '', url)
}

export function useUrlState() {
  const [params, setParams] = useState(read)
  // Guards the popstate listener from echoing our own writes back as input.
  const writing = useRef(false)

  useEffect(() => {
    function onPop() {
      if (writing.current) return
      setParams(read())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const update = useCallback(patch => {
    setParams(prev => {
      const next = { ...prev, ...patch }
      for (const k of Object.keys(next)) {
        if (!next[k]) delete next[k]
      }
      writing.current = true
      write(next)
      writing.current = false
      return next
    })
  }, [])

  return [params, update]
}
