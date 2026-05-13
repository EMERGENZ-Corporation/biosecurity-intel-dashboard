import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { Marker, MarkerSource } from '../types'
import markersData from '../data/markers.json'

const markers = markersData as Marker[]

const TYPE_COLORS: Record<string, string> = {
  ship_route:          '#388BFD',
  case_confirmed:      '#F85149',
  death:               '#FF6B35',  // orange — distinct from yellow monitoring facilities
  monitoring_facility: '#E3B341',  // amber/gold
  us_state_monitoring: '#3FB950',
  flight_tracing:      '#BC8CFF',
  return_destination:  '#8B949E',
}

const LARGE_RADIUS_TYPES = new Set(['case_confirmed', 'death', 'monitoring_facility', 'flight_tracing'])

interface Props {
  visibleTypes: string[]
}

const popupStyle = `
  /* Popup */
  .hantavirus-popup .leaflet-popup-content-wrapper {
    background: #21262D;
    color: #E6EDF3;
    border: 1px solid #30363D;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }
  .hantavirus-popup .leaflet-popup-tip {
    background: #21262D;
  }
  .hantavirus-popup .leaflet-popup-content {
    margin: 10px 14px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  /* Dark mode zoom controls */
  .leaflet-bar a,
  .leaflet-bar a:hover {
    background-color: #21262D;
    border-color: #30363D;
    color: #E6EDF3;
  }
  .leaflet-bar a:hover {
    background-color: #30363D;
  }
  .leaflet-bar {
    border: 1px solid #30363D !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  /* Dark mode attribution */
  .leaflet-control-attribution {
    background: rgba(13,17,23,0.85) !important;
    color: #8B949E !important;
  }
  .leaflet-control-attribution a {
    color: #388BFD !important;
  }
`

export default function GlobalMap({ visibleTypes }: Props) {
  const visible = markers.filter((m) => visibleTypes.includes(m.type))

  return (
    <>
      <style>{popupStyle}</style>
      {/* Screen-reader note — hidden from sighted users */}
      <p
        id="map-description"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Interactive map showing confirmed cases, deaths, monitoring facilities, ship route, and
        flight tracing locations for the 2026 MV Hondius Andes hantavirus outbreak. Use the layer
        toggles above the map to filter marker types. Use plus and minus buttons or pinch-zoom to
        navigate.
      </p>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '500px', width: '100%', borderRadius: '4px' }}
        scrollWheelZoom={false}
        aria-label="Global outbreak map — Andes hantavirus 2026"
        aria-describedby="map-description"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {visible.map((marker) => {
          const color = TYPE_COLORS[marker.type] ?? '#FFFFFF'
          const radius = LARGE_RADIUS_TYPES.has(marker.type) ? 10 : 6
          return (
            <CircleMarker
              key={marker.id}
              center={[marker.lat, marker.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 1.5,
                opacity: 1,
              }}
            >
              <Popup className="hantavirus-popup">
                <div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      color: '#E6EDF3',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {marker.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: color,
                      fontFamily: "'IBM Plex Mono', monospace",
                      marginBottom: '0.375rem',
                    }}
                  >
                    {marker.status}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: '#8B949E',
                      marginBottom: '0.5rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {marker.description}
                  </div>
                  {marker.sources && marker.sources.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {marker.sources.map((s: MarkerSource) => (
                        <a
                          key={s.url}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.6875rem',
                            color: '#388BFD',
                            textDecoration: 'none',
                          }}
                        >
                          {s.label} ↗
                        </a>
                      ))}
                    </div>
                  ) : (
                    <a
                      href={marker.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.6875rem',
                        color: '#388BFD',
                        textDecoration: 'none',
                      }}
                    >
                      {marker.source} ↗
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </>
  )
}
