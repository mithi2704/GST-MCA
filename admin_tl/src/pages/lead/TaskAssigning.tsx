import { useEffect, useState, useMemo } from 'react'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { taskService } from '@/services/taskService'
import { employeeService } from '@/services/employeeService'
import Spinner from '@/components/ui/Spinner'
import { AlertCircle } from 'lucide-react'

export default function TaskAssigning() {
  const [tasksList, setTasksList] = useState<any[]>([])
  const [availList, setAvailList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activityLogs, setActivityLogs] = useState<any[]>([
    { id: 1, text: 'System tracking initialized', time: 'Just now' }
  ])
  const [showAllAssignees, setShowAllAssignees] = useState(false)
  const [assigningTask, setAssigningTask] = useState<any | null>(null)
  const [dataVersion, setDataVersion] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      taskService.getTasks(),
      employeeService.getEmployees()
    ])
      .then(([allTasks, emps]) => {
        // Filter tasks that are unassigned (or don't have an assigned employee)
        const unassigned = allTasks.filter((t: any) => !t.employee)
        setTasksList(unassigned)
        
        // Map employees to workload load indicator
        const mappedEmps = emps.map((e: any) => {
          const load = Math.min(100, Math.max(10, Math.floor(Math.random() * 40 + 20))) // mock variation
          let color = '#2bb673'
          if (load > 80) color = '#e2566b'
          else if (load > 40) color = '#e0941a'
          
          return {
            id: e.id,
            name: e.name,
            avatar: e.name.split(' ').map((s: any) => s[0]).join('').slice(0, 2).toUpperCase(),
            load,
            color
          }
        })
        setAvailList(mappedEmps)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load task allocation data')
        setLoading(false)
      })
  }, [dataVersion])

  const handleExportProgress = () => {
    const rows = tasksList.map((t) => ({
      ID: t.id,
      Title: t.name,
      Client: t.client,
      Priority: t.priority,
      'Estimated Time': '4 Hours',
    }))
    downloadCsv(rows, 'task_progress_report.csv')
  }

  const getPriorityWeight = (priority: string) => {
    const p = (priority || '').toUpperCase()
    if (p.includes('CRITICAL')) return 4
    if (p.includes('HIGH')) return 3
    if (p.includes('STANDARD') || p.includes('MEDIUM')) return 2
    if (p.includes('LOW')) return 1
    return 0
  }

  const handlePrioritySort = () => {
    setTasksList((prev) => {
      const sorted = [...prev]
      sorted.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
      return sorted
    })
    toast({ message: 'Sorted by priority (Critical > High > Standard > Low)', type: 'success' })
  }

  const handleAssignClick = (task: any) => {
    setAssigningTask(task)
  }

  const selectEmployeeForTask = async (empId: string, empName: string) => {
    if (!assigningTask) return

    try {
      await taskService.updateTask(assigningTask.id, {
        ...assigningTask,
        employeeId: empId
      })

      // Log Activity locally
      setActivityLogs((prev) => [
        {
          id: Date.now(),
          text: `Assigned task "${assigningTask.name}" to ${empName}`,
          time: 'Just now',
        },
        ...prev,
      ])

      toast({ message: `Successfully assigned "${assigningTask.name}" to ${empName}!`, type: 'success' })
      setDataVersion((v) => v + 1)
      setAssigningTask(null)
    } catch (err: any) {
      toast({ message: err.message || 'Failed to assign task', type: 'error' })
    }
  }

  const displayedAvailability = showAllAssignees ? availList : availList.slice(0, 3)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="task-page" style={{ padding: 24 }}>
      <div className="task-header-row" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="task-page-title" style={{ fontSize: 28, fontWeight: 800 }}>Task Management</h2>
          <p className="task-page-subtitle" style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginTop: 4 }}>Assign workflows and monitor delivery efficiency across teams.</p>
        </div>
        <div className="task-header-actions" style={{ display: 'flex', gap: 12 }}>
          <button className="task-btn-outline" onClick={handleExportProgress} style={{ padding: '8px 16px', border: '1px solid #e7e9f1', borderRadius: 8, fontSize: 13, background: 'white', display: 'flex', items: 'center', gap: 6, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Progress
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="task-stats-row mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'UNASSIGNED TASKS', value: String(tasksList.length), iconBg: '#fdf3e1', iconColor: '#b89047', badge: <span className="task-trend-up">Live</span> },
          { label: 'PENDING WORKLOAD', value: '12', iconBg: '#e8f0fe', iconColor: '#3d7cf0', badge: <span className="task-stat-desc">Current Load</span> },
          { label: 'COMPLETED TODAY', value: '8', iconBg: '#e7f7ed', iconColor: '#2bb673', badge: <span className="task-stat-target-met">✓ Target Met</span> },
          { label: 'DELAYED DELIVERIES', value: '0', iconBg: '#fcebec', iconColor: '#e2566b', badge: <span className="task-stat-critical">Critical</span> },
        ].map((card) => (
          <Card className="p-4 flex flex-col justify-between" key={card.label}>
            <div className="task-stat-header flex items-center justify-between">
              <div className="task-stat-icon-box" style={{ background: card.iconBg, color: card.iconColor, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              </div>
              {card.badge}
            </div>
            <div className="task-stat-label text-xs font-semibold text-ink-soft uppercase mt-4">{card.label}</div>
            <div className="task-stat-value text-2xl font-extrabold text-ink mt-1">{card.value}</div>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="task-main-grid grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="task-queue-card lg:col-span-2">
          <Card className="p-6">
            <div className="task-card-header-row flex justify-between items-center mb-6">
              <h3 className="task-card-title text-lg font-bold text-ink">Unassigned Queue</h3>
              <button className="task-link-btn text-sm text-amber-900 underline" onClick={handlePrioritySort}>Priority Sort</button>
            </div>
            <div className="task-queue-list space-y-4">
              {tasksList.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--color-ink-soft)', fontSize: '13.5px' }}>
                  All tasks assigned! The queue is empty.
                </div>
              ) : (
                tasksList.map((t) => (
                  <div className="task-queue-item flex items-center justify-between p-4 border border-line-soft rounded-lg bg-surface hover:bg-surface-muted transition-colors" key={t.id}>
                    <div className="task-queue-content">
                      <div className="task-queue-title font-bold text-sm text-ink">{t.name}</div>
                      <div className="task-queue-meta text-xs text-ink-muted mt-1">{t.client} • Due {t.dueDate}</div>
                    </div>
                    <div className="task-queue-details flex items-center gap-3">
                      <span className={`task-badge text-xs font-semibold px-2 py-0.5 rounded uppercase ${t.priority === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{t.priority}</span>
                      <button className="task-assign-btn px-3 py-1.5 bg-amber text-white text-xs font-bold rounded-md" style={{ backgroundColor: 'var(--color-amber)' }} onClick={() => handleAssignClick(t)}>Assign</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="task-side-col space-y-6">
          <Card className="p-6">
            <div className="task-card-header-row mb-4">
              <h3 className="task-card-title text-base font-bold text-ink">Employee Availability</h3>
            </div>
            <div className="task-availability-list space-y-4">
              {displayedAvailability.map((emp) => (
                <div className="task-avail-item flex items-center justify-between" key={emp.name}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-line-soft text-sm font-semibold">{emp.avatar}</div>
                    <div>
                      <span className="task-avail-name text-sm font-bold text-ink">{emp.name}</span>
                      <div className="task-avail-bar-wrap flex items-center gap-2 mt-1">
                        <div className="task-avail-bar-bg h-1.5 w-24 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="task-avail-bar-fill h-full" style={{ width: `${emp.load}%`, background: emp.color }} />
                        </div>
                        <span className="task-avail-load text-[10px] text-ink-muted">{emp.load}% Load</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-avail-dot h-2 w-2 rounded-full" style={{ background: emp.color }} />
                </div>
              ))}
            </div>
            <button className="task-view-all-btn mt-4 text-xs font-bold text-amber-900 underline w-full text-center" onClick={() => setShowAllAssignees(!showAllAssignees)}>
              {showAllAssignees ? 'View Less' : 'View All Assignees'}
            </button>
          </Card>

          <Card className="p-6">
            <div className="task-card-header-row mb-4">
              <h3 className="task-card-title text-base font-bold text-ink">Live Activity</h3>
            </div>
            <div className="task-activity-list space-y-4">
              {activityLogs.map((act) => (
                <div className="task-activity-item flex gap-3" key={act.id}>
                  <div className="task-activity-dot mt-1 h-2 w-2 rounded-full bg-amber shrink-0 mt-2" style={{ backgroundColor: 'var(--color-amber)' }} />
                  <div className="task-activity-content">
                    <div className="task-activity-text text-xs text-ink">{act.text}</div>
                    <div className="task-activity-time text-[10px] text-ink-muted mt-1">{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {assigningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAssigningTask(null)} />
          <div className="z-10 w-full max-w-md bg-white rounded-xl shadow-lg border p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink mb-2">Select Assignee</h3>
            <p className="text-xs text-ink-soft mb-4">
              Assigning: <strong>{assigningTask.name}</strong>
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {availList.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => selectEmployeeForTask(emp.id, emp.name)}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-amber hover:bg-amber-soft transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold">
                      {emp.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink">{emp.name}</div>
                      <div className="text-[10px] text-ink-muted">Current Load: {emp.load}%</div>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full" style={{ background: emp.color }} />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setAssigningTask(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
