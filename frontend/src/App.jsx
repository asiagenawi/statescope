import Header from './components/Layout/Header'
import USMap from './components/Map/USMap'
import GlobalChat from './components/GlobalChat'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <main className="main-content main-content--noscroll">
          <USMap />
        </main>
        <GlobalChat />
      </div>
    </div>
  )
}

export default App
