import { useEffect, useRef } from "react"
import { Edit, Eye } from "lucide-react"

export function RowActionsPopover({
  open,
  anchorRef,
  onClose,
  onEdit,
  onView,
}: {
  open: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  onEdit: () => void
  onView: () => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return
      if (ref.current && !ref.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, anchorRef, onClose])

  if (!open) return null

  return (
    <div ref={ref} className="absolute right-0 z-50 mt-2 w-40 rounded-md border border-line bg-surface shadow"> 
      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-muted" onClick={() => { onView(); onClose() }}>
        <Eye className="h-4 w-4" /> View
      </button>
      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-muted" onClick={() => { onEdit(); onClose() }}>
        <Edit className="h-4 w-4" /> Edit
      </button>
    </div>
  )
}

export default RowActionsPopover
