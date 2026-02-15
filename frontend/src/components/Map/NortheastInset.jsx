import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { STATUS_COLORS } from '../../utils/colors'

const GEO_URL = `${import.meta.env.BASE_URL}us-states-10m.json`

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

function NortheastInset({ stateByFips, selectedState, onMouseEnter, onMouseLeave, onMouseMove, onClick }) {
  return (
    <div className="northeast-inset">
      <div className="northeast-inset-label">Northeast</div>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-73.5, 42], scale: 2200 }}
        width={220}
        height={200}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter(geo => NORTHEAST_FIPS.has(geo.id))
              .map(geo => {
                const state = stateByFips[geo.id]
                const status = state?.policy_status || 'none'
                const isSelected = selectedState?.code === state?.code
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={STATUS_COLORS[status]}
                    stroke={isSelected ? '#1a1a2e' : '#b0b0b8'}
                    strokeWidth={isSelected ? 2 : 0.75}
                    style={{
                      default: { outline: 'none', transition: 'filter 0.15s' },
                      hover: { fill: STATUS_COLORS[status], filter: 'brightness(0.88)', cursor: 'pointer', outline: 'none' },
                      pressed: { fill: STATUS_COLORS[status], filter: 'brightness(0.8)', outline: 'none' },
                    }}
                    onMouseEnter={(evt) => onMouseEnter(geo, evt)}
                    onMouseMove={(evt) => onMouseMove(evt)}
                    onMouseLeave={onMouseLeave}
                    onClick={() => onClick(geo)}
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
