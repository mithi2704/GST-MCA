import { cn } from "@/lib/utils"

type Tone = "success" | "danger" | "warning" | "info" | "neutral" | "gold"

const toneMap: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  neutral: "bg-line-soft text-ink-soft",
  gold: "bg-amber-soft text-gold-dark",
}

const statusTone: Record<string, Tone> = {
  Active: "success",
  Completed: "success",
  "On Hold": "warning",
  "Waiting For Client": "warning",
  "In Progress": "info",
  Overdue: "danger",
  Inactive: "neutral",
  "Not Started": "neutral",
  ELITE: "success",
}

export function StatusBadge({
  status,
  tone,
  dot,
  className,
}: {
  status: string
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  const resolved = tone ?? statusTone[status] ?? "neutral"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        toneMap[resolved],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {status}
    </span>
  )
}
