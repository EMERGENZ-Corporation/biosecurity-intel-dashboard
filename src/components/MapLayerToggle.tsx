const LAYERS: { type: string; label: string; color: string }[] = [
  { type: 'ship_route', label: 'Ship Route', color: '#388BFD' },
  { type: 'case_confirmed', label: 'Confirmed Cases', color: '#F85149' },
  { type: 'death', label: 'Deaths', color: '#FF6B35' },
  { type: 'monitoring_facility', label: 'Monitoring Facilities', color: '#E3B341' },
  { type: 'us_state_monitoring', label: 'U.S. State Monitoring', color: '#3FB950' },
  { type: 'flight_tracing', label: 'Flight Tracing', color: '#BC8CFF' },
  { type: 'return_destination', label: 'Return Destination', color: '#8B949E' },
]

interface Props {
  visibleTypes: string[]
  onToggle: (type: string) => void
}

export default function MapLayerToggle({ visibleTypes, onToggle }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.625rem 0.75rem',
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        marginBottom: '0.5rem',
      }}
    >
      {LAYERS.map(({ type, label, color }) => {
        const checked = visibleTypes.includes(type)
        return (
          <label
            key={type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              cursor: 'pointer',
              userSelect: 'none',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              color: checked ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              transition: 'color 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(type)}
              style={{ display: 'none' }}
            />
            {/* colored dot */}
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: checked ? color : 'var(--color-text-muted)',
                border: `2px solid ${checked ? color : 'var(--color-border)'}`,
                flexShrink: 0,
                transition: 'background-color 0.15s, border-color 0.15s',
              }}
            />
            {label}
          </label>
        )
      })}
    </div>
  )
}
