import { useEffect, useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Task } from '@/data/tasks'
import { employeeService } from '@/services/employeeService'
import { toast } from '@/components/ui/Toast'

export function TaskModal({ task, open, onClose, onSave, onDelete }: {
  task: Task | null
  open: boolean
  onClose: () => void
  onSave: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState<any>(task)
  const [loading, setLoading] = useState(false)
  const [employeesList, setEmployeesList] = useState<any[]>([])

  useEffect(() => {
    setForm(task)
  }, [task])

  useEffect(() => {
    if (open) {
      employeeService.getEmployees().then(setEmployeesList).catch(console.error)
    }
  }, [open])

  if (!open || !form) return null

  function update<K extends string>(k: K, v: any) {
    setForm((f: any) => f ? ({ ...f, [k]: v }) : f)
  }

  const mappedStatus = form.status

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="z-10 w-full max-w-3xl">
        <CardHeader title={`${form.id} — ${form.name}`} />
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-ink-muted">Name</label>
              <input className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Client</label>
              <input className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" value={form.client} readOnly />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Status</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" value={mappedStatus} onChange={(e) => update('status', e.target.value as any)}>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Waiting For Client</option>
                <option>Completed</option>
                <option>Overdue</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Assigned To</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" value={form.employeeId || ''} onChange={(e) => update('employeeId', e.target.value || null)}>
                <option value="">Unassigned</option>
                {employeesList.map((em) => <option key={em.id} value={em.id}>{em.name} — {em.designation}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Priority</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" value={form.priority} onChange={(e) => update('priority', e.target.value as any)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">Due Date</label>
              <input type="date" value={form.dueDate ? new Date(form.dueDate).toISOString().slice(0,10) : ''} onChange={(e) => update('dueDate', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-ink-muted">Notes</label>
              <textarea
                value={form.shortNote}
                onChange={(e) => update('shortNote', e.target.value)}
                placeholder="Add notes, task context, or updates here..."
                className="mt-1 w-full min-h-[150px] max-h-[300px] resize-none overflow-y-auto rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/30 leading-relaxed"
                style={{ scrollBehavior: 'smooth' }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button variant="outline" onClick={() => { if (form) { setLoading(true); onDelete(form.id); setLoading(false); onClose() } }} loading={loading}>Delete</Button>
            <Button variant="primary" loading={loading} onClick={() => { if (form) { setLoading(true); onSave(form); setLoading(false); onClose() } }}>Save</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TaskModal
