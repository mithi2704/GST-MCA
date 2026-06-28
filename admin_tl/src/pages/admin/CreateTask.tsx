import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { clientService } from '@/services/clientService'
import { employeeService } from '@/services/employeeService'
import { taskService } from '@/services/taskService'
import { toast } from '@/components/ui/Toast'

export default function CreateTask() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'Low'|'Medium'|'High'|'Critical'>('Low')
  const [dueDate, setDueDate] = useState('')
  const [client, setClient] = useState('')
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('')

  const [clientsList, setClientsList] = useState<any[]>([])
  const [employeesList, setEmployeesList] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => {
    clientService.getClients().then(setClientsList).catch(console.error)
    employeeService.getEmployees().then(setEmployeesList).catch(console.error)
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function validate() {
    const err: Record<string,string> = {}
    if (!name.trim()) err.name = 'Task title is required'
    if (!client) err.client = 'Select a client'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  async function handleCreate() {
    if (!validate()) return
    setLoading(true)
    try {
      const dbPriority = priority.toUpperCase() === 'CRITICAL' ? 'URGENT' : priority.toUpperCase()
      const payload = {
        title: name,
        description: description,
        priority: dbPriority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        clientId: parseInt(client),
        assignedEmployeeId: assignedEmployeeId ? parseInt(assignedEmployeeId) : undefined
      }

      await taskService.createTask(payload as any)
      setDirty(false)
      toast({ type: 'success', message: 'Task created successfully' })
      try { window.dispatchEvent(new CustomEvent('tasks:changed')) } catch {}
      navigate('/tasks')
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed to create task' })
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    if (dirty && !confirm('You have unsaved changes. Discard and leave?')) return
    navigate('/tasks')
  }

  return (
    <div>
      <PageHeader title="Create New Compliance Task" subtitle="Initiate a systematic filing workflow for GST or MCA requirements." />
      <div className="mt-6 grid grid-cols-12 gap-6 px-6">
        <div className="col-span-8">
          <Card>
            <CardHeader title="Task Details" />
            <div className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Task Title</label>
                  <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true) }} placeholder="e.g., Q3 GST Filing for Zenith Tech" className="mt-1 h-12 w-full rounded-lg border border-line px-3 bg-white text-sm" />
                  {errors.name && <div className="text-rose-600 text-sm mt-1">{errors.name}</div>}
                </div>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-ink-muted">Task Type</label>
                    <select className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm" defaultValue="GST GSTR-1" onChange={() => setDirty(true)}>
                      <option>GST GSTR-1</option>
                      <option>GST GSTR-3B</option>
                      <option>ROC Filing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Priority</label>
                    <div className="mt-1 flex gap-2">
                      {(['Low','Medium','High','Critical'] as const).map(p => (
                        <button key={p} type="button" onClick={() => { setPriority(p); setDirty(true) }} className={`px-3 py-2 rounded-lg text-sm ${priority===p? 'bg-amber-500 text-white' : 'bg-surface'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Description</label>
                  <textarea value={description} onChange={(e) => { setDescription(e.target.value); setDirty(true) }} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm" rows={4} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Client & Compliance" />
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Select Client</label>
                  <select value={client} onChange={(e) => { setClient(e.target.value); setDirty(true) }} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm">
                    <option value="">Select a client...</option>
                    {clientsList.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                  {errors.client && <div className="text-rose-600 text-sm mt-1">{errors.client}</div>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Filing Month / Period</label>
                  <input className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="mm/yyyy" onChange={() => setDirty(true)} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader title="Assignment" />
            <div className="px-6 pb-6">
              <div>
                <label className="text-xs font-semibold text-ink-muted">Assign Employee</label>
                <select value={assignedEmployeeId} onChange={(e) => { setAssignedEmployeeId(e.target.value); setDirty(true) }} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm">
                  <option value="">Select Employee...</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Scheduling" />
            <div className="px-6 pb-6 space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-muted">Task Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setDirty(true) }} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm" />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" loading={loading} onClick={handleCreate}>Create Task</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
