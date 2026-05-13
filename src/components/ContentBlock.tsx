import SourceChip from './SourceChip'

interface Props {
  title: string
  content: string
  authorityName: string
  documentTitle: string
  publicationDate: string
  sourceUrl: string
  license?: string
  children?: React.ReactNode
}

export default function ContentBlock({
  title,
  content,
  authorityName,
  documentTitle,
  publicationDate,
  sourceUrl,
  license,
  children,
}: Props) {
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
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 0.75rem 0',
        }}
      >
        {title}
      </h2>

      {content && (
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--color-text-primary)',
            margin: '0 0 1rem 0',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
        </p>
      )}

      {children}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginTop: content || children ? '1rem' : 0,
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          SOURCE:
        </span>
        <SourceChip
          authority={authorityName}
          documentTitle={documentTitle}
          date={publicationDate}
          url={sourceUrl}
        />
        {license && (
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
        )}
      </div>
    </section>
  )
}
