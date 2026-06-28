import { cn } from "@/lib/utils"
import type { ReactNode, HTMLAttributes } from "react"

export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("border border-line bg-surface", className)}
      style={{ borderRadius: '12px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)' }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  action,
  extra,
  className,
}: {
  title: string
  action?: ReactNode
  extra?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between", className)} style={{ padding: '20px 24px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>{title}</h2>
      {action || extra}
    </div>
  )
}
