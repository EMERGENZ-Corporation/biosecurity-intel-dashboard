// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { Link } from 'react-router-dom'

export default function DisclaimerBanner() {
  return (
    <div
      role="note"
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.5rem 1rem',
      }}
    >
      <p
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}
      >
        This dashboard aggregates publicly available information from authoritative sources for
        informational purposes only. It does not constitute medical advice or official public health
        guidance. EMS providers must follow their agency protocols and medical director directives.{' '}
        <Link
          to="/about"
          style={{
            color: 'var(--color-accent-blue)',
            textDecoration: 'underline',
          }}
        >
          View full disclaimer.
        </Link>
      </p>
    </div>
  )
}
