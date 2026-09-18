/**
 * The snapshot is the single thing every view needs, so its failure is handled
 * once here rather than leaving each view to render convincing-looking zeros.
 *
 * Silent emptiness is the worst outcome: a reader cannot tell "nothing loaded"
 * from "nothing exists", and this tracker's whole point is that distinction.
 */
function DataError({ error, onRetry }) {
  return (
    <div className="data-error" role="alert">
      <div className="data-error-inner">
        <p className="landing-eyebrow">StateScope</p>
        <h1 className="data-error-title">The policy data didn’t load</h1>
        <p className="data-error-text">
          Nothing is shown rather than something wrong — the numbers on this site
          come from a single data file, and it could not be fetched. This is a
          loading problem, not a finding about policy.
        </p>
        {error?.message && <p className="data-error-detail">{error.message}</p>}
        <div className="data-error-actions">
          <button className="onboarding-cta" onClick={onRetry}>Try again</button>
          <a
            className="landing-link"
            href="https://github.com/asiagenawi/statescope/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report this
          </a>
        </div>
      </div>
    </div>
  )
}

export default DataError
