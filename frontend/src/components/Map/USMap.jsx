import { useState, useMemo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useStates } from '../../hooks/useStates'
import { STATUS_COLORS } from '../../utils/colors'
import MapLegend from './MapLegend'
import NortheastInset from './NortheastInset'
import StateTooltip from './StateTooltip'
import StatePolicyPanel from '../PolicyPanel/StatePolicyPanel'

const GEO_URL = `${import.meta.env.BASE_URL}us-states-10m.json`

function USMap() {
  const { states, loading, error } = useStates()
  const [hoveredState, setHoveredState] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [selectedState, setSelectedState] = useState(null)

  const stateByFips = useMemo(() => {
    const map = {}
    for (const s of states) {
      map[s.fips] = s
    }
    return map
  }, [states])

  if (loading) return <p>Loading map data...</p>
  if (error) return <p>Error loading states: {error.message}</p>

  function handleMouseEnter(geo, evt) {
    const state = stateByFips[geo.id]
    if (state) {
      setHoveredState(state)
      setTooltipPos({ x: evt.clientX, y: evt.clientY })
    }
  }

  function handleMouseLeave() {
    setHoveredState(null)
  }

  function handleClick(geo) {
    const state = stateByFips[geo.id]
    if (state) {
      setSelectedState(prev => prev?.code === state.code ? null : state)
    }
  }

  return (
    <div className="map-container">
      <div className="map-wrapper">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={960}
          height={600}
          viewBox="0 0 960 600"
          className="composable-map"
        >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
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
                      onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                      onMouseMove={(evt) => setTooltipPos({ x: evt.clientX, y: evt.clientY })}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(geo)}
                    />
                  )
                })
              }
            </Geographies>
        </ComposableMap>
        <NortheastInset
          stateByFips={stateByFips}
          selectedState={selectedState}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={(evt) => setTooltipPos({ x: evt.clientX, y: evt.clientY })}
          onClick={handleClick}
        />
        <div className="map-overlay-stack">
          <MapLegend />
          <div className="map-description">
            As states race to regulate artificial intelligence in classrooms, keeping track of who's doing what has become a challenge in itself. StateScope makes it simple — explore legislation, trends, and guidance on one interactive dashboard. Click on any state to view its policies, or use the chat to ask questions about AI education policy across the country.
          </div>
        </div>
        {hoveredState && <StateTooltip state={hoveredState} position={tooltipPos} />}
      </div>
      <StatePolicyPanel
        state={selectedState}
        states={states}
        onClose={() => setSelectedState(null)}
        onSelectState={(s) => setSelectedState(s)}
      />
    </div>
  )
}

export default USMap
