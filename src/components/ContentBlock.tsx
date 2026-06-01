// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import type { ReactNode } from 'react'
import type { SectionAttribution } from '../types'
import SourceChip from './SourceChip'

interface Props {
  title: string
  /** Body markdown — paragraphs split on blank lines, preserves line breaks within paragraphs. */
  bodyMarkdown?: string
  /** Primary source for this block. Omit for sections without per-block attribution. */
  attribution?: SectionAttribution
  /** Additional supporting sources beyond the primary attribution. */
  additionalAttributions?: SectionAttribution[]
  /** Optional ISO date or human label indicating when this block was last reviewed. */
  lastReviewed?: string
  /** Optional content rendered between body and attribution footer. */
  children?: ReactNode
}

function LicenseBadge({ license }: { license: string }) {
  return (
    <span
      style={{
        padding: '0.125rem 0.375rem',
        borderRadius: '3px',
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.625rem',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.03em',
      }}
    >
      {license}
    </span>
  )
}

function AttributionRow({ label, source }: { label: string; source: SectionAttribution }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <SourceChip
        authority={source.authority}
        documentTitle={source.documentTitle}
        date={source.date}
        url={source.url}
      />
      {source.license && <LicenseBadge license={source.license} />}
    </div>
  )
}

export default function ContentBlock({
  title,
  bodyMarkdown,
  attribution,
  additionalAttributions,
  lastReviewed,
  children,
}: Props) {
  const paragraphs = bodyMarkdown ? bodyMarkdown.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : []
  const hasAttribution = !!attribution || (additionalAttributions && additionalAttributions.length > 0)

  return (
    <section
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
      }}
    >
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 0.75rem 0',
        }}
      >
        {title}
      </h2>

      {paragraphs.map((para, i) => (
        <p
          key={i}
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.875rem 0',
            whiteSpace: 'pre-wrap',
          }}
        >
          {para}
        </p>
      ))}

      {children}

      {(hasAttribution || lastReviewed) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {attribution && <AttributionRow label="Source:" source={attribution} />}
          {additionalAttributions?.map((s) => (
            <AttributionRow key={s.url} label="Also:" source={s} />
          ))}
          {lastReviewed && (
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.125rem',
              }}
            >
              Last reviewed {lastReviewed}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
