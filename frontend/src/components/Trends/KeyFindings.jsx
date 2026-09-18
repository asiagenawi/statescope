/**
 * What the charts below actually show.
 *
 * A dashboard that only plots numbers makes every reader derive the conclusion
 * themselves, and most will not. These are computed from the same data, so they
 * cannot disagree with the charts.
 */
function KeyFindings({ findings }) {
  if (!findings.length) return null

  return (
    <section className="findings" aria-label="Key findings">
      <h3 className="chart-title">What the data shows</h3>
      <ol className="findings-list">
        {findings.map((f, i) => (
          <li key={f.id} className="finding">
            <span className="finding-num" aria-hidden="true">{i + 1}</span>
            <div>
              <p className="finding-headline">{f.headline}</p>
              <p className="finding-detail">{f.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default KeyFindings
