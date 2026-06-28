import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import { Employee, EmployeeStatus } from "@/data/employees"

export function EditEmployeeModal({
  employee,
  open,
  onClose,
  onSave,
}: {
  employee: Employee
  open: boolean
  onClose: () => void
  onSave: (updated: Employee) => void
}) {
  const [form, setForm] = useState<Employee>(employee)

  useEffect(() => {
    setForm(employee)
  }, [employee])

  if (!open) return null

  function update<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="z-10 w-full max-w-3xl sm:max-w-4xl mx-4">
        <CardHeader title={`Edit ${employee.name}`} />
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-ink-muted">Name</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Email</label>
              <input
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Mobile</label>
              <input
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Team</label>
              <input
                value={form.team}
                onChange={(e) => update('team', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Designation</label>
              <input
                value={form.designation}
                onChange={(e) => update('designation', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Status</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value as EmployeeStatus)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Score</label>
              <input
                type="number"
                value={form.score}
                onChange={(e) => update('score', Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                onSave(form)
                onClose()
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EditEmployeeModal
