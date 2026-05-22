import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Signal, MarkerType } from '../types'
import { MARKER_TYPE_LABELS } from '../types'
import { MARKER_TYPE_COLORS, markerRadius, categoryLabel, intelToneStyle, markerTypeTone } from '../utils/signals'

interface Props {
  signals: Signal[]
  height?: number
  initialCenter?: [number, number]
  initialZoom?: number
  /** Marker types to render. If undefined, all types render. */
  visibleTypes?: Set<MarkerType>
}

const DEFAULT_TYPE: MarkerType = 'outbreak_zone'

/**
 * Dark-mode popup + Leaflet control styling.
 * Scoped via a single style tag inside the map container.
 */
const POPUP_STYLE = `
  .biosec-popup .leaflet-popup-content-wrapper {
    background: #21262D;
    color: #E6EDF3;
    border: 1px solid #30363D;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }
  .biosec-popup .leaflet-popup-tip {
    background: #21262D;
    border: 1px solid #30363D;
  }
  .biosec-popup .leaflet-popup-content {
    margin: 10px 14px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  .biosec-popup a.leaflet-popup-close-button {
    color: #8B949E;
  }
  .leaflet-bar a, .leaflet-bar a:hover {
    background-color: #21262D;
    border-color: #30363D;
    color: #E6EDF3;
  }
  .leaflet-bar a:hover { background-color: #30363D; }
  .leaflet-bar {
    border: 1px solid #30363D !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  .leaflet-control-attribution {
    background: rgba(13,17,23,0.85) !important;
    color: #8B949E !important;
    font-size: 0.625rem;
  }
  .leaflet-control-attribution a { color: #388BFD !important; }
`

export default function SignalsMap({
  signals,
  height = 500,
  initialCenter = [20, 0],
  initialZoom = 2,
  visibleTypes,
}: Props) {
  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        backgroundColor: '#0D1117',
      }}
    >
      <style>{POPUP_STYLE}</style>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', backgroundColor: '#0D1117' }}
        aria-label="Biosecurity signals map"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {signals.flatMap((signal) =>
          (signal.mapMarkers ?? []).map((marker) => {
            const type: MarkerType = marker.type ?? DEFAULT_TYPE
            if (visibleTypes && !visibleTypes.has(type)) return null
            const color = MARKER_TYPE_COLORS[type]
            const radius = markerRadius(type)

            return (
              <CircleMarker
                key={`${signal.id}-${marker.id}`}
                center={[marker.lat, marker.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.28,
                  weight: 2,
                  opacity: 1,
                }}
              >
                <Popup className="biosec-popup">
                  <div style={{ minWidth: 220 }}>
                    <div
                      className="intel-pill is-active"
                      style={{ ...intelToneStyle(markerTypeTone(type)), marginBottom: '0.25rem' }}
                    >
                      {MARKER_TYPE_LABELS[type]}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        color: '#E6EDF3',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {marker.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: '#8B949E',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        marginBottom: '0.5rem',
                      }}
                    >
                      {signal.name} · {categoryLabel(signal.category)}
                    </div>
                    {marker.description && (
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: '#C9D1D9',
                          marginBottom: '0.5rem',
                          lineHeight: 1.5,
                        }}
                      >
                        {marker.description}
                      </div>
                    )}
                    {marker.sources && marker.sources.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {marker.sources.map((s) => (
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
                    )}
                    <a
                      href={`/signals/${signal.id}`}
                      style={{
                        display: 'inline-block',
                        marginTop: '0.25rem',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.6875rem',
                        color: '#388BFD',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      View signal →
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })
        )}
      </MapContainer>
    </div>
  )
}
