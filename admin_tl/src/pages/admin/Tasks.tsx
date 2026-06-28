import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import { Calendar, Search, AlertCircle } from "lucide-react"
import Spinner from "@/components/ui/Spinner"
import { type Task } from "@/data/tasks"
import { taskService } from "@/services/taskService"
import { downloadCsv } from '@/lib/utils'
import TaskModal from "@/components/ui/TaskModal"
import { toast } from "@/components/ui/Toast"

export default function AdminTasks() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState(q)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const [tasksList, setTasksList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataVersion, setDataVersion] = useState(0)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    taskService.getTasks()
      .then((data) => {
        setTasksList(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load tasks')
        setLoading(false)
      })
  }, [dataVersion])

  function openTask(t: Task) {
    setSelectedTask(t)
    setModalOpen(true)
  }

  async function saveTask(updated: Task) {
    try {
      await taskService.updateTask(updated.id, updated)
      setDataVersion((v) => v + 1)
      toast({ type: 'success', message: 'Task updated successfully' })
    } catch (err: any) {
      alert(err.message || 'Failed to update task')
    }
  }

  async function deleteTask(id: string) {
    // Delete task endpoint is a placeholder in taskService. For backend prep we trigger update/removal.
    toast({ type: 'success', message: 'Task delete requested' })
  }

  // listen for external task changes
  useEffect(() => {
    function onChanged() { setDataVersion((v) => v + 1) }
    window.addEventListener('tasks:changed', onChanged as any)
    return () => window.removeEventListener('tasks:changed', onChanged as any)
  }, [])

  // debounce q -> debouncedQ
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 250)
    return () => window.clearTimeout(id)
  }, [q])

  const filteredTasks = useMemo(() => {
    const qq = (debouncedQ || '').toLowerCase()
    return (tasksList || []).filter(t => {
      if (qq) {
        const hay = `${t?.name} ${t?.client} ${t?.id} ${t?.employee || ''} ${t?.status || ''} ${t?.priority || ''}`.toLowerCase()
        if (!hay.includes(qq)) return false
      }
      if (filterStatus && t?.status !== filterStatus) return false
      if (filterPriority && t?.priority !== filterPriority) return false
      return true
    })
  }, [debouncedQ, filterStatus, filterPriority, tasksList])

  const notStartedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'Not Started'), [filteredTasks])
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'In Progress'), [filteredTasks])
  const waitingForClientTasks = useMemo(() => filteredTasks.filter(t => t.status === 'Waiting For Client'), [filteredTasks])
  const reviewTasks = useMemo(() => filteredTasks.filter(t => t.status === 'Review'), [filteredTasks])

  return (
    <div>
      <PageHeader title="Operational Task Board" subtitle="Manage GST filings and MCA compliance workflows" />

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="mt-6 px-3 md:px-6">
          <div className="flex items-center justify-end mb-6 flex-col md:flex-row md:items-center">
            <div className="flex items-center gap-3 mr-auto w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-ink-muted" />
                <input value={q} onChange={(e) => { setQ(e.target.value) }} placeholder="Search tasks, clients, or filings..." className="pl-10 pr-3 h-10 rounded-lg border border-line bg-white w-full md:w-96" />
              </div>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value) }} className="h-10 rounded-lg border border-line bg-surface px-3 text-sm w-full md:w-auto">
                <option value="">All Statuses</option>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Waiting For Client</option>
                <option>Completed</option>
                <option>Overdue</option>
              </select>
              <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value) }} className="h-10 rounded-lg border border-line bg-surface px-3 text-sm w-full md:w-auto">
                <option value="">All Priorities</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
              <Button className="w-full md:w-auto" variant="outline" size="sm" onClick={() => { const rows = (tasksList || []).map(t => ({ id: t.id, name: t.name, client: t.client, status: t.status })); downloadCsv(rows, 'tasks.csv'); toast({ type: 'success', message: 'Exported tasks' }) }}>Export</Button>
            </div>
            <Button variant="primary" className="px-6 py-3 text-sm mt-3 md:mt-0" onClick={() => navigate('/tasks/create')}>+ Create Task</Button>
          </div>

          {/* Top Not Started container */}
          <div className="rounded-xl bg-surface p-6 mb-8 border border-line">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-ink-muted inline-block"></span>
                <div className="text-sm font-semibold uppercase text-ink-muted">NOT STARTED</div>
                <div className="ml-2 text-xs bg-white px-2 py-1 rounded text-ink">{notStartedTasks.length}</div>
              </div>
              <div className="text-sm text-ink-muted">...</div>
            </div>

            <div className="flex items-stretch gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-line/55 scrollbar-track-transparent" style={{ scrollBehavior: 'smooth' }}>
              {notStartedTasks.map((t) => (
                <div key={t.id} className="w-[320px] md:w-[400px] flex-shrink-0">
                  <Card className="p-6 cursor-pointer h-full hover:border-amber transition-colors flex flex-col justify-between" onClick={() => openTask(t)}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-amber/10 text-amber-700">GST GSTR-1</div>
                        <div className="text-lg font-bold text-ink mt-3 leading-snug">{t.name}</div>
                        <div className="text-sm text-ink-muted mt-2">Client: {t.client}</div>
                      </div>
                      <div className="text-sm text-ink-muted text-right flex-shrink-0">
                        <div className="text-xs text-amber-700 font-semibold">{t.priority}</div>
                        <div className="mt-6 text-sm flex items-center gap-1 justify-end"><Calendar className="h-4 w-4 text-ink-muted" /> {t.dueDate}</div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-end">
                      <div className="flex items-center gap-2">
                        <Avatar name={t.employee || t.client} size={28} />
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
              {notStartedTasks.length === 0 && (
                <div className="w-full py-8 text-center text-sm text-ink-muted bg-white/30 rounded-lg border border-dashed border-line">
                  No Not Started tasks found.
                </div>
              )}
            </div>
          </div>

          {/* Lower columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-semibold uppercase text-ink-muted mb-3 flex items-center justify-between"><span>IN PROGRESS</span><span className="text-xs bg-white px-2 py-1 rounded text-ink">{inProgressTasks.length}</span></div>
              <div className="space-y-4">
                {inProgressTasks.map(t => (
                  <Card key={t.id} className="p-4 cursor-pointer hover:border-amber transition-colors" onClick={() => openTask(t)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-ink">{t.name}</div>
                        <div className="text-xs text-ink-muted mt-1">Client: {t.client}</div>
                      </div>
                      <div className="text-xs text-ink-muted text-right">
                        <div className="text-xs font-semibold text-amber-700">{t.priority}</div>
                        <div className="mt-2 text-xs flex items-center gap-1 justify-end"><Calendar className="h-3 w-3 text-ink-muted" /> {t.dueDate}</div>
                      </div>
                    </div>
                  </Card>
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-xs text-ink-muted text-center py-4 border border-dashed border-line rounded">No tasks in progress.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase text-ink-muted mb-3 flex items-center justify-between"><span>WAITING FOR CLIENT</span><span className="text-xs bg-white px-2 py-1 rounded text-ink">{waitingForClientTasks.length}</span></div>
              <div className="space-y-4">
                {waitingForClientTasks.map(t => (
                  <Card key={t.id} className="p-4 cursor-pointer hover:border-amber transition-colors" onClick={() => openTask(t)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-ink">{t.name}</div>
                        <div className="text-xs text-ink-muted mt-1">Client: {t.client}</div>
                      </div>
                      <div className="text-xs text-ink-muted flex items-center gap-1"><Calendar className="h-3 w-3 text-ink-muted" /> {t.dueDate}</div>
                    </div>
                  </Card>
                ))}
                {waitingForClientTasks.length === 0 && (
                  <div className="text-xs text-ink-muted text-center py-4 border border-dashed border-line rounded">No tasks waiting for client.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase text-ink-muted mb-3 flex items-center justify-between"><span>REVIEW</span><span className="text-xs bg-white px-2 py-1 rounded text-ink">{reviewTasks.length}</span></div>
              <div className="space-y-4">
                {reviewTasks.map(t => (
                  <Card key={t.id} className="p-4 cursor-pointer hover:border-amber transition-colors" onClick={() => openTask(t)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-ink">{t.name}</div>
                        <div className="text-xs text-ink-muted mt-1">Client: {t.client}</div>
                      </div>
                      <div className="text-xs text-ink-muted flex items-center gap-1"><Calendar className="h-3 w-3 text-ink-muted" /> {t.dueDate}</div>
                    </div>
                  </Card>
                ))}
                {reviewTasks.length === 0 && (
                  <div className="text-xs text-ink-muted text-center py-4 border border-dashed border-line rounded">No tasks in review.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <TaskModal task={selectedTask} open={modalOpen} onClose={() => setModalOpen(false)} onSave={(t) => { saveTask(t); setModalOpen(false) }} onDelete={(id) => { deleteTask(id); setModalOpen(false) }} />
    </div>
  )
}
