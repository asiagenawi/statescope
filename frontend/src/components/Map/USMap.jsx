import { useState, useCallback, useRef, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import { useGeoData } from '../../hooks/useGeoData'
import { formatMonth } from '../../utils/dates'
import { isArrowKey, nextInDirection, defaultFocus } from '../../utils/mapNavigation'
import { STATUS_DESCRIPTIONS, statusVar, statusInkVar } from '../../utils/colors'
import MapLegend from './MapLegend'
import NortheastInset from './NortheastInset'
import StateTooltip from './StateTooltip'

/**
 * States too small to hold a label at this projection scale. They are covered
 * by the Northeast inset instead, which has the room.
 */
const MAX_ZOOM = 6

/**
 * Stroke width divided by the zoom, so borders stay hairlines as the map scales.
 * Geography resolves `style` as style[default|hover|pressed], so each state has
 * to carry the value -- a plain object here silently applies nothing.
 */
function geographyStyle(isSelected, zoom) {
  const base = { strokeWidth: (isSelected ? 2 : 0.75) / zoom }
  const emphasised = { strokeWidth: (isSelected ? 2 : 1.4) / zoom }
  return { default: base, hover: emphasised, pressed: emphasised }
}

const NO_LABEL_FIPS = new Set([
  '09', '10', '11', '24', '25', '33', '34', '44', '50',
])

function accessibleName(state) {
  if (!state) return 'Unknown area'
  const status = STATUS_DESCRIPTIONS[state.policy_status || 'none']
  const count = state.policy_count || 0
  const policies = count === 1 ? '1 policy' : `${count} policies`
  return `${state.name}. ${status}. ${policies}.`
}

function USMap({ snapshot, selectedState, onSelectState, onOpenAbout, onOpenFederal }) {
  const { geo, error: geoError } = useGeoData()
  const { stateByFips, error: dataError, loading: dataLoading } = snapshot

  const [hoveredState, setHoveredState] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Roving tabindex: exactly one shape is tabbable, arrows move between them.
  const [focusedCode, setFocusedCode] = useState(null)
  // Zoom is held here so the controls, the reset, and the counter-scaling of
  // labels and strokes all read the same value.
  const [position, setPosition] = useState({ coordinates: [-97, 38], zoom: 1 })
  const positionsRef = useRef([])
  const svgRef = useRef(null)
  const pendingFocus = useRef(null)

  // Move real DOM focus after the render that changed which shape is tabbable.
  useEffect(() => {
    if (!pendingFocus.current) return
    const code = pendingFocus.current
    pendingFocus.current = null
    svgRef.current?.querySelector(`[data-state-code="${code}"]`)?.focus()
  }, [focusedCode])

  const handleMouseEnter = useCallback((geoItem, evt) => {
    const state = stateByFips[geoItem.id]
    if (state) {
      setHoveredState(state)
      setTooltipPos({ x: evt.clientX, y: evt.clientY })
    }
  }, [stateByFips])

  const handleMouseMove = useCallback(evt => {
    setTooltipPos({ x: evt.clientX, y: evt.clientY })
  }, [])

  const handleMouseLeave = useCallback(() => setHoveredState(null), [])

  const zoomBy = useCallback(factor => {
    setPosition(p => ({ ...p, zoom: Math.min(MAX_ZOOM, Math.max(1, p.zoom * factor)) }))
  }, [])

  const resetZoom = useCallback(() => {
    setPosition({ coordinates: [-97, 38], zoom: 1 })
  }, [])

  const handleClick = useCallback(geoItem => {
    const state = stateByFips[geoItem.id]
    if (state) onSelectState(state)
  }, [stateByFips, onSelectState])

  const handleKeyDown = useCallback((evt, geoItem) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault()
      handleClick(geoItem)
      return
    }
    if (!isArrowKey(evt.key)) return

    evt.preventDefault()
    const current = stateByFips[geoItem.id]?.code
    const next = nextInDirection(positionsRef.current, current, evt.key)
    if (next) {
      pendingFocus.current = next
      setFocusedCode(next)
    }
  }, [handleClick, stateByFips])

  const error = geoError || dataError
  if (error) {
    return (
      <div className="stage-message">
        <h2>Couldn’t load the map</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="map-stage">
      <div className="map-wrapper">
        {!geo && <div className="map-skeleton" aria-hidden="true" />}

        {geo && (
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 980 }}
            width={960}
            height={640}
            viewBox="0 0 960 640"
            className="composable-map"
            ref={svgRef}
            role="application"
            aria-label="Map of state AI education policy. Use the arrow keys to move between states, Enter to open one."
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              minZoom={1}
              maxZoom={MAX_ZOOM}
              onMoveEnd={setPosition}
            >
            <Geographies geography={geo}>
              {({ geographies, projection }) => {
                const positions = []
                for (const g of geographies) {
                  const st = stateByFips[g.id]
                  if (!st) continue
                  const c = geoCentroid(g)
                  const xy = c && projection(c)
                  if (xy) positions.push({ code: st.code, x: xy[0], y: xy[1] })
                }
                positionsRef.current = positions

                // Whichever state holds the tab stop: the selection, the last
                // arrowed-to state, or a sensible default.
                const tabCode = focusedCode
                  || selectedState?.code
                  || defaultFocus(positions)

                return (
                <>
                  {geographies.map(geoItem => {
                    const state = stateByFips[geoItem.id]
                    const status = state?.policy_status || 'none'
                    const isSelected = selectedState?.code === state?.code
                    return (
                      <Geography
                        key={geoItem.rsmKey}
                        geography={geoItem}
                        className={`state-shape${isSelected ? ' state-shape--selected' : ''}`}
                        fill={statusVar(status)}
                        style={geographyStyle(isSelected, position.zoom)}
                        data-state-code={state?.code}
                        tabIndex={state && state.code === tabCode ? 0 : -1}
                        role={state ? 'button' : undefined}
                        aria-label={state ? accessibleName(state) : undefined}
                        aria-pressed={state ? isSelected : undefined}
                        onMouseEnter={evt => handleMouseEnter(geoItem, evt)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onFocus={evt => {
                          handleMouseEnter(geoItem, evt)
                          if (state) setFocusedCode(state.code)
                        }}
                        onBlur={handleMouseLeave}
                        onKeyDown={evt => handleKeyDown(evt, geoItem)}
                        onClick={() => handleClick(geoItem)}
                      />
                    )
                  })}

                  {/* Postal codes so the map is readable without hovering. */}
                  {geographies.map(geoItem => {
                    const state = stateByFips[geoItem.id]
                    if (!state || NO_LABEL_FIPS.has(geoItem.id)) return null
                    const centroid = geoCentroid(geoItem)
                    if (!centroid || !projection(centroid)) return null
                    return (
                      <Marker key={`label-${geoItem.rsmKey}`} coordinates={centroid}>
                        <text
                          className="state-label"
                          textAnchor="middle"
                          dy="0.33em"
                          style={{ fontSize: `${10 / position.zoom}px` }}
                          fill={statusInkVar(state.policy_status || 'none')}
                        >
                          {state.code}
                        </text>
                      </Marker>
                    )
                  })}
                </>
                )
              }}
            </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        )}

        {geo && (
          <NortheastInset
            geo={geo}
            stateByFips={stateByFips}
            selectedState={selectedState}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />
        )}

        <div className="map-zoom" role="group" aria-label="Zoom the map">
          <button onClick={() => zoomBy(1.6)} disabled={position.zoom >= MAX_ZOOM} aria-label="Zoom in">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button onClick={() => zoomBy(1 / 1.6)} disabled={position.zoom <= 1} aria-label="Zoom out">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button onClick={resetZoom} disabled={position.zoom === 1} className="map-zoom-reset">
            Reset
          </button>
        </div>

        <MapLegend loading={dataLoading} />

        {snapshot.federalPolicies.length > 0 && (
          <button
            className="federal-chip"
            onClick={onOpenFederal}
            aria-pressed={Boolean(selectedState?.isFederal)}
          >
            <span className="federal-chip-label">Federal</span>
            <span className="federal-chip-count">{snapshot.federalPolicies.length}</span>
          </button>
        )}

        {hoveredState && <StateTooltip state={hoveredState} position={tooltipPos} />}

        {snapshot.dataUpdated && (
          <p className="colophon-line">
            Sources: state legislatures, departments of education, Congress.gov ·
            Curated to {formatMonth(snapshot.dataUpdated)} ·{' '}
            <button onClick={onOpenAbout}>Methodology &amp; limitations</button>
          </p>
        )}
      </div>
    </div>
  )
}

export default USMap
