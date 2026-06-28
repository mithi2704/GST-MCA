import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "outline" | "dark" | "ghost"
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: "border border-transparent",
  outline: "bg-surface text-ink border border-line hover:bg-surface-muted",
  dark: "bg-sidebar text-white hover:bg-sidebar/90 border border-transparent",
  ghost: "bg-transparent text-ink-soft hover:bg-line-soft border border-transparent",
}

export function Button({
  children,
  variant = "primary",
  icon,
  className,
  disabled,
  loading,
  loadingText,
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: ReactNode
  loading?: boolean
  loadingText?: string
  size?: Size
}) {
  const isLoading = !!loading
  const loadText = loadingText

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2.5',
        variants[variant],
        className,
      )}
      style={{
        borderRadius: 12,
        backgroundColor: variant === 'primary' ? 'var(--color-amber)' : undefined,
        color: variant === 'primary' ? '#fff' : undefined,
        boxShadow: variant === 'primary' ? '0 10px 30px rgba(200,120,10,0.14)' : undefined,
        paddingTop: variant === 'primary' ? 12 : undefined,
        paddingBottom: variant === 'primary' ? 12 : undefined,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {loadText || 'Processing...'}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}
