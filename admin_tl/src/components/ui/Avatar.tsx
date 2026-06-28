import { cn } from "@/lib/utils"
import { initials } from "@/lib/utils"
import { useState } from "react"

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string
  src?: string
  size?: number
  className?: string
}) {
  const [imgError, setImgError] = useState(false)

  // pastel palette for avatar backgrounds (Figma-like hues)
  // exact Figma-like palette (lavender, peach, sky, lilac, soft blue)
  const palette = ['#E9E8FF', '#FFE9D6', '#DFF6F2', '#F3E8FF', '#E8F0FF']
  const textColor = '#111827'
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const bg = palette[hash % palette.length]
  const fontSize = Math.max(12, Math.round(size * 0.42))

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, backgroundColor: bg, color: textColor, fontSize, fontWeight: 800, lineHeight: 1 }}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  )
}
