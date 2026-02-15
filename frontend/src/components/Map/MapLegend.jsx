import { STATUS_COLORS } from '../../utils/colors'

const LEGEND_ITEMS = [
  { status: 'none', label: 'No policy' },
  { status: 'guidance', label: 'Guidance only' },
  { status: 'pending', label: 'Pending' },
  { status: 'enacted', label: 'Enacted' },
]

function MapLegend() {
  return (
    <div className="map-legend">
      {LEGEND_ITEMS.map(item => (
        <div key={item.status} className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: STATUS_COLORS[item.status] }}
          />
          <span className="legend-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default MapLegend
