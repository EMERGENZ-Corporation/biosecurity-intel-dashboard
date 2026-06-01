// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
interface Props {
  authority: string
  documentTitle: string
  date: string
  url: string
}

export default function SourceChip({ authority, documentTitle, date, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${documentTitle} — ${date}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.1875rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        textDecoration: 'none',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.6875rem',
        color: 'var(--color-accent-blue)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{authority}</span>
      <span style={{ color: 'var(--color-text-muted)', margin: '0 0.125rem' }}>·</span>
      <span
        style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '220px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {documentTitle}
      </span>
      <span style={{ color: 'var(--color-text-muted)', margin: '0 0.125rem' }}>·</span>
      <span style={{ color: 'var(--color-text-muted)' }}>{date}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, marginLeft: '0.125rem', color: 'var(--color-text-muted)' }}
      >
        <path
          d="M5.5 1H9V4.5M9 1L4 6M2 2H1V9H8V7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}
