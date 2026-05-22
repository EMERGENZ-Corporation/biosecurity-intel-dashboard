import { useEffect, useState } from 'react'

export interface TocEntry {
  id: string
  label: string
}

interface Props {
  entries: TocEntry[]
}

/**
 * Sticky table-of-contents for the signal detail page. Solves the
 * 60-viewport-scroll problem documented in UX-GAP-ANALYSIS §0 by
 * giving the user a clickable jump list of all sections.
 *
 * Implements scroll-spy via IntersectionObserver — the entry whose
 * section is currently in the viewport is highlighted.
 *
 * Hidden on small viewports (< 1080px) — there isn't enough horizontal
 * room for a side rail. Could be made into a top-anchored chip row
 * on mobile in a future pass.
 */
export default function SignalDetailToc({ entries }: Props) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActiveId(visible.target.id)
      },
      {
        // Tighter rootMargin so we activate just before the section's heading is at the top.
        rootMargin: '-20% 0px -70% 0px',
        threshold: [0, 0.25, 0.5, 1],
      }
    )

    for (const { id } of entries) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [entries])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id)
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      // Update URL hash without re-triggering smooth scroll
      history.replaceState(null, '', `#${id}`)
    }
  }

  return (
    <nav
      className="signal-detail-toc"
      aria-label="Signal detail sections"
      style={{
        position: 'sticky',
        top: '1rem',
        alignSelf: 'flex-start',
        width: '200px',
        flexShrink: 0,
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '0.75rem 0.625rem',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 0.5rem 0',
          paddingLeft: '0.5rem',
        }}
      >
        On this page
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
        }}
      >
        {entries.map(({ id, label }) => {
          const active = id === activeId
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                style={{
                  display: 'block',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.75rem',
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: active ? 600 : 400,
                  textDecoration: 'none',
                  padding: '0.3rem 0.5rem',
                  borderLeft: active
                    ? '2px solid var(--color-accent-blue)'
                    : '2px solid transparent',
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  borderRadius: '0 3px 3px 0',
                  lineHeight: 1.35,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
