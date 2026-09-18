import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { statusVar } from '../../utils/colors'

// The inset has its own fixed scale, so its strokes need no zoom compensation.
const INSET_STROKE = {
  default: { strokeWidth: 0.75 },
  hover: { strokeWidth: 1.4 },
  pressed: { strokeWidth: 1.4 },
}

const NORTHEAST_FIPS = new Set([
  '09', // CT
  '10', // DE
  '11', // DC
  '24', // MD
  '25', // MA
  '23', // ME
  '33', // NH
  '34', // NJ
  '36', // NY
  '42', // PA
  '44', // RI
  '50', // VT
])

/**
 * Magnified Northeast. Receives the already-parsed topojson from USMap -- when
 * this passed a URL instead, react-simple-maps fetched and parsed the same
 * 114KB file a second time.
 */
function NortheastInset({
  geo,
  stateByFips,
  selectedState,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onClick,
}) {
  return (
    <div className="northeast-inset">
      <div className="northeast-inset-label" aria-hidden="true">Northeast, enlarged</div>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-73.7, 42.6], scale: 780 }}
        width={200}
        height={170}
        viewBox="0 0 200 170"
        className="northeast-inset-map"
        aria-hidden="true"
      >
        <Geographies geography={geo}>
          {({ geographies }) =>
            geographies
              .filter(geoItem => NORTHEAST_FIPS.has(geoItem.id))
              .map(geoItem => {
                const state = stateByFips[geoItem.id]
                const status = state?.policy_status || 'none'
                const isSelected = selectedState?.code === state?.code
                return (
                  <Geography
                    key={geoItem.rsmKey}
                    geography={geoItem}
                    className={`state-shape${isSelected ? ' state-shape--selected' : ''}`}
                    fill={statusVar(status)}
                    style={INSET_STROKE}
                    tabIndex={-1}
                    onMouseEnter={evt => onMouseEnter(geoItem, evt)}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    onClick={() => onClick(geoItem)}
                  />
                )
              })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}

export default NortheastInset
