/**
 * Which view someone lands on.
 *
 * A front door helps the first time and becomes a toll booth every time after,
 * so it is shown once. Anyone arriving at a deep link is already pointed
 * somewhere specific and should never be intercepted.
 */
export const VISITED_KEY = 'statescope.visited'

export const VIEWS = ['home', 'map', 'trends', 'compare']

/** Params that mean "I already know where I'm going". */
const INTENT_KEYS = ['state', 'about', 'states', 'policy', 'fstate', 'topic', 'type']

export function hasDeepLinkIntent(urlState = {}) {
  return INTENT_KEYS.some(k => urlState[k])
}

/**
 * @param urlState   parsed query params
 * @param hasVisited whether this browser has entered the app before
 */
export function resolveView(urlState = {}, hasVisited = false) {
  // An explicit view always wins, including an explicit return to home.
  if (VIEWS.includes(urlState.view)) return urlState.view

  // A deep link is an intent; don't interrupt it.
  if (hasDeepLinkIntent(urlState)) return 'map'

  return hasVisited ? 'map' : 'home'
}

export function readVisited() {
  try {
    return localStorage.getItem(VISITED_KEY) === '1'
  } catch {
    // Blocked storage just means the front door shows again; harmless.
    return false
  }
}

export function markVisited() {
  try {
    localStorage.setItem(VISITED_KEY, '1')
  } catch {
    // Not remembering is survivable.
  }
}
