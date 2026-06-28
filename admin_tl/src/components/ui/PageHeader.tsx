import type { ReactNode, CSSProperties } from "react"

export function PageHeader({
  title,
  subtitle,
  actions,
  titleStyle,
  subtitleStyle,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  titleStyle?: CSSProperties
  subtitleStyle?: CSSProperties
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 
          style={{ fontSize: 44, lineHeight: '52px', fontWeight: 900, ...titleStyle }} 
          className="tracking-tight text-ink text-balance"
        >
          {title}
        </h1>
        {subtitle && (
          <p 
            style={{ marginTop: 8, fontSize: '16px', color: 'var(--color-ink-soft)', ...subtitleStyle }} 
            className="text-ink-muted"
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
