import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import Spinner from "@/components/ui/Spinner"
import { type Employee } from "@/data/employees"
import { employeeService } from "@/services/employeeService"
import { AlertCircle } from 'lucide-react'
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/components/ui/Toast"

export default function AdminEmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [emp, setEmp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const { user } = useAuth()

  const isSuperAdmin = user?.dbRole === 'SUPER_ADMIN'

  const handleAccessToggle = async () => {
    if (!isSuperAdmin) {
      toast({ message: 'Only Super Admins can toggle system access.', type: 'error' });
      return;
    }
    if (!emp) return;
    const nextActive = !emp.isActive;
    try {
      setToggling(true);
      await employeeService.toggleEmployeeAccess(String(emp.id), nextActive);
      setEmp((prev: any) => ({ ...prev, isActive: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' }));
      toast({ message: `Employee access ${nextActive ? 'enabled' : 'disabled'} successfully`, type: 'success' });
    } catch (err: any) {
      console.error('Error toggling employee access:', err);
      toast({ message: err.message || 'Failed to toggle employee access', type: 'error' });
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    if (!id) return
    employeeService.getEmployeeById(id)
      .then((data) => {
        setEmp(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Employee not found')
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
        <Button variant="outline" onClick={() => navigate('/employees')}>Back to Employees</Button>
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

  if (!emp) return null

  const fullName = `${emp.firstName} ${emp.lastName}`
  const tasksList = (emp.taskAssignments || []).map((ta: any) => ta.task)
  const completedTasks = tasksList.filter((t: any) => t.status === 'COMPLETED').length
  const assignedTasks = tasksList.length

  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wide text-ink-muted">employee details</div>

      <div className="mb-6 rounded-md border border-line bg-gradient-to-r from-amber-50 to-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} src={emp.profilePhotoUrl} size={72} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink">{fullName}</h1>
                <span className="rounded-md bg-line-soft px-2 py-1 text-xs font-semibold text-ink-soft">Code: {emp.employeeCode}</span>
              </div>
              <p className="text-sm text-ink-muted mt-1">{emp.designation || 'Associate'}</p>
              <div className="mt-3">
                <Button variant="primary" onClick={() => navigate(`/employees/${emp.id}/edit`)} style={{ backgroundColor: 'var(--color-amber)', borderColor: 'var(--color-amber)' }}>Edit Details</Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-ink-muted mr-2">Status Toggle</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={emp.isActive ?? (emp.status === 'ACTIVE')} 
                onChange={handleAccessToggle}
                disabled={!isSuperAdmin || toggling}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-emerald-400 peer-focus:ring-2 peer-focus:ring-amber-300 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader title="Personal Information" />
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Full Legal Name</p>
                <p className="text-sm text-ink mt-1">{fullName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email Address</p>
                <p className="text-sm text-ink mt-1">{emp.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Phone Number</p>
                <p className="text-sm text-ink mt-1">{emp.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Date of Birth</p>
                <p className="text-sm text-ink mt-1">—</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Permanent Address</p>
                <p className="text-sm text-ink mt-1">—</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Professional Details" />
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Current Designation</p>
                <p className="text-sm text-ink mt-1">{emp.designation || 'Associate'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Date of Joining</p>
                <p className="text-sm text-ink mt-1">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">System Role</p>
                <p className="text-sm text-ink mt-1">{emp.user?.role || 'EMPLOYEE'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Assigned Department</p>
                <div className="mt-1">
                  <span className="rounded-md bg-line-soft px-2 py-1 text-xs font-semibold text-ink-soft">{emp.department || 'Compliance'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">TASK COMPLETION</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                {(() => {
                  const pct = assignedTasks ? Math.round((completedTasks / assignedTasks) * 100) : 0
                  return <div className="text-4xl font-extrabold text-ink">{pct}%</div>
                })()}
                <div className="text-xs text-success mt-1">Assigned: {assignedTasks} | Completed: {completedTasks}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent Task Assignments" />
        <div className="px-6 pb-6">
          {tasksList.length === 0 ? (
            <div className="text-center text-ink-soft py-6">No tasks assigned to this employee.</div>
          ) : (
            <>
              {/* Mobile cards for recent tasks */}
              <div className="space-y-3 sm:hidden">
                {tasksList.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="text-xs text-ink-muted">Priority: {t.priority}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</div>
                        <div className="text-xs text-ink-muted">{t.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <th className="px-6 py-3">Task ID</th>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Priority</th>
                      <th className="px-6 py-3">Deadline</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksList.slice(0, 5).map((t: any) => (
                      <tr key={t.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted">
                        <td className="px-6 py-4 text-sm font-semibold text-ink">{t.id}</td>
                        <td className="px-6 py-4 text-sm text-ink-soft">{t.title}</td>
                        <td className="px-6 py-4 text-sm text-ink-soft">{t.priority}</td>
                        <td className="px-6 py-4 text-sm text-ink-soft">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span 
                            className="rounded-md px-2 py-1 text-xs font-semibold" 
                            style={{ 
                              backgroundColor: t.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : t.status === 'IN_PROGRESS' ? 'rgba(250,204,21,0.12)' : 'rgba(99,102,241,0.06)', 
                              color: t.status === 'COMPLETED' ? 'var(--color-success)' : t.status === 'IN_PROGRESS' ? 'var(--color-warning)' : 'var(--color-ink)'
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => navigate(`/tasks`)} className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-line-soft">👁️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
