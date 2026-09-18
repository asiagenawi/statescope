import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Header from './components/Layout/Header'
import GlobalChat from './components/GlobalChat'
import StatePolicyPanel from './components/PolicyPanel/StatePolicyPanel'
import ResizeHandle from './components/Layout/ResizeHandle'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import AboutPanel from './components/Layout/AboutPanel'
import { useResizablePanel } from './hooks/useResizablePanel'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useSnapshot } from './hooks/useSnapshot'
import { useUrlState } from './hooks/useUrlState'
import { FEDERAL_CODE, buildFederalJurisdiction } from './utils/federal'
import { resolveView, readVisited, markVisited } from './utils/routing'
import { warmBackend } from './utils/api'
import './App.css'

// Trends pulls in recharts, which has no business being in the bundle that
// paints the map.
const TrendsView = lazy(() => import('./components/Trends/TrendsView'))
const CompareView = lazy(() => import('./components/Compare/CompareView'))
const LandingView = lazy(() => import('./components/Landing/LandingView'))
const USMap = lazy(() => import('./components/Map/USMap'))

function App() {
  const isMobile = useMediaQuery('(max-width: 900px)')
  const snapshot = useSnapshot()
  const [urlState, setUrlState] = useUrlState()

  const [chatOpen, setChatOpen] = useState(false)
  // A question handed to the chat from elsewhere in the app.
  const [seedQuestion, setSeedQuestion] = useState(null)

  // The front door shows once; a deep link never gets intercepted.
  const [hasVisited] = useState(readVisited)
  const view = resolveView(urlState, hasVisited)
  const aboutOpen = urlState.about === '1'
  // Resolved from the snapshot rather than held separately, so a shared link
  // like ?state=TX selects Texas as soon as the data lands.
  const selectedState = !urlState.state
    ? null
    : urlState.state === FEDERAL_CODE
      ? buildFederalJurisdiction(snapshot.federalPolicies)
      : snapshot.states.find(s => s.code === urlState.state) || null

  const selectedPolicies = selectedState?.isFederal
    ? snapshot.federalPolicies
    : snapshot.policiesByState[selectedState?.code] || []

  const policyResize = useResizablePanel({
    defaultWidth: 400,
    minWidth: 300,
    maxWidth: 620,
    side: 'right',
    disabled: isMobile,
  })

  const chatResize = useResizablePanel({
    defaultWidth: 420,
    minWidth: 320,
    maxWidth: 650,
    side: 'right',
    disabled: isMobile,
  })

  // The map needs no backend, but /ask does and the free tier sleeps. Wake it
  // now so the dyno is up by the time anyone opens the chat.
  useEffect(() => { warmBackend() }, [])

  // Escape closes whatever is open, innermost first.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      if (aboutOpen) setUrlState({ about: null })
      else if (chatOpen) setChatOpen(false)
      else if (selectedState) setUrlState({ state: null })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aboutOpen, chatOpen, selectedState, setUrlState])

  // Clicking the already-selected state deselects it.
  const handleSelectState = useCallback(state => {
    markVisited()
    setUrlState({
      view: null,
      state: state && state.code !== urlState.state ? state.code : null,
    })
  }, [setUrlState, urlState.state])

  // A policy result opens the state that owns it, with that policy called out.
  const handleSelectPolicy = useCallback(policy => {
    markVisited()
    setUrlState({
      view: null,
      state: policy.state_code || FEDERAL_CODE,
      policy: String(policy.id),
    })
  }, [setUrlState])

  const askAbout = useCallback(question => {
    setSeedQuestion({ text: question, at: Date.now() })
    setChatOpen(true)
  }, [])

  const handleViewChange = useCallback(next => {
    if (next !== 'home') markVisited()
    setUrlState({ view: next === 'map' ? null : next })
  }, [setUrlState])

  // Jumping to Compare from a state keeps that state as the first column.
  const handleCompare = useCallback(code => {
    setUrlState({ view: 'compare', states: code, state: null })
  }, [setUrlState])

  const drawersOpen = Boolean(selectedState) || chatOpen || aboutOpen

  if (view === 'home') {
    return (
      <div className="app app--landing">
        <ErrorBoundary label="home page">
          <Suspense fallback={<div className="view-loading">Loading…</div>}>
            <LandingView
              snapshot={snapshot}
              onNavigate={handleViewChange}
              onOpenChat={() => { markVisited(); handleViewChange('map'); setChatOpen(true) }}
              onOpenAbout={() => { markVisited(); setUrlState({ view: null, about: '1' }) }}
              onSelectPolicy={handleSelectPolicy}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        view={view}
        onViewChange={handleViewChange}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(o => !o)}
        snapshot={snapshot}
        onSelectState={handleSelectState}
        onSelectPolicy={handleSelectPolicy}
        onOpenAbout={() => setUrlState({ about: '1' })}
        onGoHome={() => setUrlState({ view: 'home', state: null, about: null })}
      />

      <div className={`app-body${drawersOpen ? ' app-body--drawers' : ''}`}>
        <main className="stage" id="main-content">
          <ErrorBoundary label="map">
            {view === 'map' ? (
              <Suspense fallback={<div className="view-loading">Loading map…</div>}>
                <USMap
                  snapshot={snapshot}
                  selectedState={selectedState}
                  onSelectState={handleSelectState}
                  onOpenAbout={() => setUrlState({ about: '1' })}
                  onOpenFederal={() => setUrlState({
                    state: urlState.state === FEDERAL_CODE ? null : FEDERAL_CODE,
                  })}
                />
              </Suspense>
            ) : view === 'trends' ? (
              <Suspense fallback={<div className="view-loading">Loading trends…</div>}>
                <TrendsView
                  snapshot={snapshot}
                  urlState={urlState}
                  setUrlState={setUrlState}
                  onSelectState={handleSelectState}
                  onSelectPolicy={handleSelectPolicy}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<div className="view-loading">Loading comparison…</div>}>
                <CompareView
                  snapshot={snapshot}
                  urlState={urlState}
                  setUrlState={setUrlState}
                  onSelectState={handleSelectState}
                />
              </Suspense>
            )}
          </ErrorBoundary>
        </main>

        {selectedState && (
          <>
            {!isMobile && <ResizeHandle onMouseDown={policyResize.handleProps.onMouseDown} />}
            <ErrorBoundary label="policy panel">
              <StatePolicyPanel
                state={selectedState}
                states={snapshot.states}
                policies={selectedPolicies}
                highlightPolicyId={urlState.policy}
                onClose={() => setUrlState({ state: null })}
                onSelectState={s => setUrlState({ state: s.code })}
                onCompare={() => handleCompare(selectedState.code)}
                onAsk={() => askAbout(
                  `What is ${selectedState.name}'s approach to AI in education, and how does it compare with neighbouring states?`,
                )}
                style={policyResize.width != null ? { width: policyResize.width } : undefined}
              />
            </ErrorBoundary>
          </>
        )}

        {aboutOpen && (
          <ErrorBoundary label="about panel">
            <AboutPanel snapshot={snapshot} onClose={() => setUrlState({ about: null })} />
          </ErrorBoundary>
        )}

        {chatOpen && (
          <>
            {!isMobile && <ResizeHandle onMouseDown={chatResize.handleProps.onMouseDown} />}
            <ErrorBoundary label="chat">
              <GlobalChat
                seedQuestion={seedQuestion}
                onClose={() => setChatOpen(false)}
                style={chatResize.width != null ? { width: chatResize.width } : undefined}
              />
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  )
}

export default App
