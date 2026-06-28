import { Avatar } from "@/components/ui/Avatar"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/Button"
import type { Employee } from "@/data/employees"
import { Edit, Eye, UserMinus } from "lucide-react"

import { useEffect, useRef } from "react"

export default function EmployeeQuickPanel({ employee, onClose, onEdit, onView, onDeactivate }: {
  employee: Employee
  onClose: () => void
  onEdit: () => void
  onView: () => void
  onDeactivate: () => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-12 z-50 w-80 rounded-md bg-white shadow-lg border border-line" style={{ paddingRight: 8 }}>
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} src={employee.avatar} size={48} />
          <div>
            <div className="text-sm font-bold text-ink">{employee.name}</div>
            <div className="text-xs text-ink-muted">#{employee.id}</div>
            <div className="mt-2"><StatusBadge status={employee.status} /></div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <Button variant="outline" className="w-full py-2" icon={<Edit className="h-4 w-4" />} onClick={() => { onEdit(); onClose() }}>Edit Records</Button>
          <Button variant="ghost" className="w-full py-2 text-ink" onClick={() => { onView(); onClose() }}>view</Button>
          {employee.status !== 'Inactive' ? (
            <Button variant="ghost" className="w-full py-2 text-danger" icon={<UserMinus className="h-4 w-4" />} onClick={() => { onDeactivate(); onClose() }}>Deactivate Employee</Button>
          ) : (
            <Button variant="ghost" className="w-full py-2 text-success" icon={<UserMinus className="h-4 w-4" />} onClick={() => { /* handle activate via onDeactivate param name reuse */ onDeactivate(); onClose() }}>Activate Employee</Button>
          )}
        </div>
      </div>
    </div>
  )
}
