import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Signal, SignalSeverity } from '../types'
import { SEVERITY_COLORS, SEVERITY_LABELS, categoryLabel } from '../utils/signals'

interface Props {
  signals: Signal[]
  height?: number
  initialCenter?: [number, number]
  initialZoom?: number
}

function dotIcon(color: string) {
  return L.divIcon({
    className: 'signal-marker',
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 0 2px rgba(0,0,0,0.45);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function SignalsMap({ signals, height = 420, initialCenter = [10, 10], initialZoom = 2 }: Props) {
  return (
    <div style={{ height, width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={initialCenter} zoom={initialZoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {signals.flatMap((signal) =>
          (signal.mapMarkers ?? []).map((marker) => {
            const severity: SignalSeverity = marker.severity ?? signal.severity
            return (
              <Marker
                key={`${signal.id}-${marker.id}`}
                position={[marker.lat, marker.lng]}
                icon={dotIcon(SEVERITY_COLORS[severity])}
              >
                <Popup>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', minWidth: 220 }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{signal.name}</div>
                    <div style={{ color: '#555', marginBottom: '0.25rem' }}>
                      {categoryLabel(signal.category)} · {SEVERITY_LABELS[severity]}
                    </div>
                    <div style={{ marginBottom: '0.375rem' }}>{marker.label}</div>
                    {marker.description && <div style={{ color: '#555' }}>{marker.description}</div>}
                    <a href={`/signals/${signal.id}`} style={{ color: '#1f6feb', fontWeight: 600, marginTop: '0.375rem', display: 'inline-block' }}>
                      View signal →
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })
        )}
      </MapContainer>
    </div>
  )
}
