import Header from './components/Layout/Header'
import USMap from './components/Map/USMap'
import GlobalChat from './components/GlobalChat'
import ResizeHandle from './components/Layout/ResizeHandle'
import { useResizablePanel } from './hooks/useResizablePanel'
import { useMediaQuery } from './hooks/useMediaQuery'
import './App.css'

function App() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const chatResize = useResizablePanel({
    defaultWidth: 420,
    minWidth: 280,
    maxWidth: 650,
    side: 'right',
    disabled: isMobile,
  })

  return (
    <div className="app">
      <Header />
      <div className={`app-body${chatResize.isResizing ? ' app-body--resizing' : ''}`}>
        <main className="main-content main-content--noscroll">
          <USMap isMobile={isMobile} />
        </main>
        <ResizeHandle onMouseDown={chatResize.handleProps.onMouseDown} />
        <GlobalChat style={chatResize.width != null ? { width: chatResize.width } : undefined} />
      </div>
    </div>
  )
}

export default App
