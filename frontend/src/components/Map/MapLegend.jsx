import { STATUS_COLORS, STATUS_ORDER, STATUS_LABELS } from '../../utils/colors'

// "Failed" and "No policy" sit off the ramp -- one is an outcome, the other an
// absence -- so they read as separate keys rather than steps on the scale.
const RAMP = ['guidance', 'pending', 'enacted']
const OFF_RAMP = STATUS_ORDER.filter(s => !RAMP.includes(s))

/**
 * A connected ramp with the labels beneath it, the way a published choropleth
 * key is drawn -- the escalation from guidance to enacted law is a scale, and
 * detached swatches hid that it was ordered at all.
 *
 * The labels are also the relief for the two lightest fills, which sit below
 * 3:1 against the surface: colour never carries meaning alone here.
 */
function MapLegend({ loading }) {
  return (
    <figure className={`map-legend${loading ? ' map-legend--loading' : ''}`}>
      <figcaption className="legend-title">Most significant action</figcaption>

      <div className="legend-ramp-group">
        <div className="legend-ramp" role="presentation">
          {RAMP.map(status => (
            <span
              key={status}
              className="legend-ramp-step"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
          ))}
        </div>
        <div className="legend-ramp-labels">
          {RAMP.map(status => (
            <span key={status} className="legend-label">{STATUS_LABELS[status]}</span>
          ))}
        </div>
        <span className="legend-ramp-note" aria-hidden="true">
          more binding &rarr;
        </span>
      </div>

      <div className="legend-keys">
        {OFF_RAMP.map(status => (
          <span key={status} className="legend-key">
            <span
              className="legend-swatch"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="legend-label">{STATUS_LABELS[status]}</span>
          </span>
        ))}
      </div>
    </figure>
  )
}

export default MapLegend
