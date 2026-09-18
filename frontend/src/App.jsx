import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Header from './components/Layout/Header'
import USMap from './components/Map/USMap'
import GlobalChat from './components/GlobalChat'
import StatePolicyPanel from './components/PolicyPanel/StatePolicyPanel'
import ResizeHandle from './components/Layout/ResizeHandle'
import OnboardingCard from './components/Layout/OnboardingCard'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import AboutPanel from './components/Layout/AboutPanel'
import { useResizablePanel } from './hooks/useResizablePanel'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useSnapshot } from './hooks/useSnapshot'
import { useUrlState } from './hooks/useUrlState'
import { warmBackend } from './utils/api'
import './App.css'

// Trends pulls in recharts, which has no business being in the bundle that
// paints the map.
const TrendsView = lazy(() => import('./components/Trends/TrendsView'))

function App() {
  const isMobile = useMediaQuery('(max-width: 900px)')
  const snapshot = useSnapshot()
  const [urlState, setUrlState] = useUrlState()

  const [chatOpen, setChatOpen] = useState(false)

  const view = urlState.view === 'trends' ? 'trends' : 'map'
  const aboutOpen = urlState.about === '1'
  // Resolved from the snapshot rather than held separately, so a shared link
  // like ?state=TX selects Texas as soon as the data lands.
  const selectedState = urlState.state
    ? snapshot.states.find(s => s.code === urlState.state) || null
    : null

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
    setUrlState({
      view: null,
      state: state && state.code !== urlState.state ? state.code : null,
    })
  }, [setUrlState, urlState.state])

  const handleViewChange = useCallback(next => {
    setUrlState({ view: next === 'trends' ? 'trends' : null })
  }, [setUrlState])

  const drawersOpen = Boolean(selectedState) || chatOpen || aboutOpen

  return (
    <div className="app">
      <Header
        view={view}
        onViewChange={handleViewChange}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(o => !o)}
        snapshot={snapshot}
        onSelectState={handleSelectState}
        onOpenAbout={() => setUrlState({ about: '1' })}
      />

      <div className={`app-body${drawersOpen ? ' app-body--drawers' : ''}`}>
        <main className="stage" id="main-content">
          <ErrorBoundary label="map">
            {view === 'map' ? (
              <>
                <USMap
                  snapshot={snapshot}
                  selectedState={selectedState}
                  onSelectState={handleSelectState}
                  onOpenAbout={() => setUrlState({ about: '1' })}
                />
                {/* Hidden while a drawer is open so it can't sit on the legend. */}
                {!drawersOpen && <OnboardingCard />}
              </>
            ) : (
              <Suspense fallback={<div className="view-loading">Loading trends…</div>}>
                <TrendsView
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
                policies={snapshot.policiesByState[selectedState.code] || []}
                onClose={() => setUrlState({ state: null })}
                onSelectState={s => setUrlState({ state: s.code })}
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
