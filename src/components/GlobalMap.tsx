import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { Marker } from '../types'
import markersData from '../data/markers.json'

const markers = markersData as Marker[]

const TYPE_COLORS: Record<string, string> = {
  ship_route: '#388BFD',
  case_confirmed: '#F85149',
  death: '#D29922',
  monitoring_facility: '#E3B341',
  us_state_monitoring: '#3FB950',
  flight_tracing: '#BC8CFF',
  return_destination: '#8B949E',
}

const LARGE_RADIUS_TYPES = new Set(['case_confirmed', 'death', 'monitoring_facility', 'flight_tracing'])

interface Props {
  visibleTypes: string[]
}

const popupStyle = `
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
`

export default function GlobalMap({ visibleTypes }: Props) {
  const visible = markers.filter((m) => visibleTypes.includes(m.type))

  return (
    <>
      <style>{popupStyle}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '500px', width: '100%', borderRadius: '4px' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </>
  )
}
