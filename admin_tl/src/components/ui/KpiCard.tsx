import { cn } from "@/lib/utils"

type Accent = "gold" | "info" | "warning" | "success"

const accentBorder: Record<Accent, string> = {
  gold: "border-l-amber",
  info: "border-l-info",
  warning: "border-l-warning",
  success: "border-l-success",
}

export function KpiCard({
  label,
  value,
  meta,
  metaTone = "neutral",
  sub,
  accent = "gold",
  className,
}: {
  label: string
  value: string
  meta?: string
  metaTone?: "success" | "danger" | "neutral"
  sub?: string
  accent?: Accent
  className?: string
}) {
  const metaColor =
    metaTone === "success" ? "text-success" : metaTone === "danger" ? "text-danger" : "text-ink-muted"
  const leftColor = accent === 'gold' ? 'var(--color-amber)' : accent === 'info' ? 'var(--color-info)' : accent === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'
  return (
    <div
      className={cn(
        "border border-line bg-surface p-5",
        accentBorder[accent],
        className,
      )}
      style={{
        borderRadius: 'var(--radius)',
        borderLeftWidth: '6px',
        borderLeftColor: leftColor,
        padding: '20px',
        minHeight: '96px',
        boxShadow: '0 6px 18px rgba(16,24,40,0.06)'
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-extrabold tracking-tight text-ink" style={{ fontSize: 28, lineHeight: 1 }}>{value}</span>
        {meta && <span className={cn("text-xs font-semibold", metaColor)}>{meta}</span>}
      </div>
      {sub && <p className="mt-2 text-xs text-ink-muted">{sub}</p>}
    </div>
  )
}
