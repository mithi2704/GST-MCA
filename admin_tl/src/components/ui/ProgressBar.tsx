import { cn } from "@/lib/utils"

export function ProgressBar({
  value,
  className,
  tone = "success",
  showLabel = false,
}: {
  value: number
  className?: string
  tone?: "success" | "gold" | "info" | "danger"
  showLabel?: boolean
}) {
  const toneMap = {
    success: "bg-success",
    gold: "bg-amber",
    info: "bg-info",
    danger: "bg-danger",
  }
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}>
        <div
          className={cn("h-full rounded-full transition-all", toneMap[tone])}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && <span className="w-9 text-right text-xs font-semibold text-ink-soft">{value}%</span>}
    </div>
  )
}
