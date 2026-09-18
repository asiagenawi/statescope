import { Component } from 'react'

/**
 * A render error in one panel shouldn't blank the whole page. Each region gets
 * its own boundary so the rest of the app keeps working, and the user gets a
 * way back rather than a white screen.
 */
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(`[StateScope] ${this.props.label || 'component'} crashed`, error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="stage-message" role="alert">
        <h2>Something went wrong</h2>
        <p>
          The {this.props.label || 'view'} ran into an unexpected error. Reloading
          usually clears it.
        </p>
        <button className="onboarding-cta" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
