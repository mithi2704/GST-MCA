import type { ReactNode } from 'react'

export function DashboardGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>
  )
}

export function ResponsiveFormGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>
  )
}
