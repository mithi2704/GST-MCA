import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import Spinner from "@/components/ui/Spinner"
import { taskService } from "@/services/taskService"

export default function AdminTaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    taskService.getTaskById(id)
      .then((data) => {
        setTask(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Task not found')
        setLoading(false)
      })
  }, [id])

  if (error) {
    return (
      <div className="text-center text-ink-soft py-12">
        <div className="flex items-center justify-center gap-2 text-rose-600 mb-4">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/tasks')}>Back to Tasks</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (!task) return null

  const assignedName = task.assignedEmployee 
    ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}` 
    : 'Unassigned'

  // Aggregate work update progress or attachments
  const latestUpdate = task.workUpdates?.[0]
  const progress = latestUpdate?.progress ?? 0
  const attachments = latestUpdate?.attachments || []

  return (
    <div>
      <button onClick={() => navigate('/tasks')} className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Tasks
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{task.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{task.description || 'No description provided'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled>Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Task Details" />
          <div className="px-6 pb-6 space-y-3">
            <p className="text-sm text-ink-muted">Client: <span className="font-semibold text-ink">{task.client?.companyName}</span></p>
            <p className="mt-2 text-sm text-ink-muted">Assigned to: <span className="font-semibold text-ink">{assignedName}</span></p>
            <p className="mt-2 text-sm text-ink-muted">Priority: <span className="font-semibold text-ink">{task.priority}</span></p>
            <p className="mt-2 text-sm text-ink-muted">Due Date: <span className="font-semibold text-ink">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span></p>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Latest Attachments</p>
              <div className="mt-2 space-y-2">
                {attachments.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gold-dark" />
                    <a href={a.filePath} target="_blank" rel="noreferrer" className="text-sm text-amber-600 hover:underline">
                      {a.fileName} ({a.fileType})
                    </a>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <div className="text-sm text-ink-soft">No attachments uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Progress" />
          <div className="px-6 pb-6">
            <div className="text-2xl font-extrabold text-ink">{progress}%</div>
            <div className="mt-3 h-3 w-full rounded-full bg-line-soft">
              <div className="h-3 rounded-full bg-amber" style={{ width: `${progress}%` }} />
            </div>
            {latestUpdate && (
              <div className="mt-4 border-t pt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Latest Update</div>
                <div className="text-sm font-bold text-ink mt-1">{latestUpdate.title}</div>
                <div className="text-xs text-ink-muted mt-1">{latestUpdate.description}</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
