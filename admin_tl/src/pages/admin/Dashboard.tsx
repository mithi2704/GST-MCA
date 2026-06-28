import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, UserRoundPlus, ListPlus, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { KpiCard } from "@/components/ui/KpiCard"
import { DashboardGrid } from '@/components/ui/ResponsiveGrid'
import { Card, CardHeader } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { DonutChart } from "@/components/ui/DonutChart"
import Spinner from "@/components/ui/Spinner"
import { type Employee } from "@/data/employees"
import { type Client } from "@/data/clients"
import { type Task } from "@/data/tasks"
import { employeeService } from "@/services/employeeService"
import { clientService } from "@/services/clientService"
import { taskService } from "@/services/taskService"

export default function Dashboard() {
  const navigate = useNavigate()
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [tasksList, setTasksList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      employeeService.getEmployees(),
      clientService.getClients(),
      taskService.getTasks()
    ])
      .then(([emps, clis, tsks]) => {
        setEmployeesList(emps)
        setClientsList(clis)
        setTasksList(tsks)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard metrics')
        setLoading(false)
      })
  }, [])

  const ranking = employeesList.filter((e) => e.score >= 90).sort((a, b) => a.rank - b.rank)
  const totalClients = clientsList.length
  const activeStaff = employeesList.filter((e) => e.status === 'Active').length
  const openTasks = tasksList.filter((t) => t.status !== 'Completed').length

  const completedTasksCount = tasksList.filter((t) => t.status === 'Completed').length
  const inProgressTasksCount = tasksList.filter((t) => t.status === 'In Progress').length
  
  const completionRate = tasksList.length > 0 
    ? Math.round((completedTasksCount / tasksList.length) * 100) 
    : 0

  return (
    <div>
      <PageHeader
        title="System Performance"
        actions={
          <>
            <Button variant="outline" icon={<UserPlus className="h-4 w-4" />} onClick={() => navigate("/clients/add")}>
              Add Client
            </Button>
            <Button variant="outline" icon={<UserRoundPlus className="h-4 w-4" />} onClick={() => navigate("/employees/add")}>
              Add Employee
            </Button>
            <Button variant="primary" icon={<ListPlus className="h-4 w-4" />} onClick={() => navigate("/tasks/create")}>
              Assign Task
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          <DashboardGrid>
            <KpiCard label="Total Clients" value={String(totalClients)} meta="↗ 12%" metaTone="success" sub="Active across jurisdictions" accent="gold" />
            <KpiCard label="Active Staff" value={String(activeStaff)} meta="Stable" metaTone="neutral" sub="Active field experts" accent="info" />
            <KpiCard label="Open Tasks" value={String(openTasks)} meta="Active" metaTone="danger" sub="Awaiting review or in progress" accent="warning" />
          </DashboardGrid>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Employee Ranking (Efficiency)"
                action={
                  <button onClick={() => navigate("/employees")} className="text-sm font-semibold text-gold-dark hover:underline">
                    View Full Table
                  </button>
                }
              />
              <div className="overflow-x-auto">
                {ranking.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-ink-soft">
                    No high efficiency employees found.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        <th className="px-6 py-3">Rank</th>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Team</th>
                        <th className="px-6 py-3">Tasks Closed</th>
                        <th className="px-6 py-3">Efficiency</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((emp, index) => (
                        <tr
                          key={emp.id}
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted"
                        >
                          <td className="px-6 py-3.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-soft text-xs font-bold text-gold-dark">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={emp.name} src={emp.avatar} size={34} />
                              <span className="text-sm font-bold text-ink">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-ink-soft">{emp.team}</td>
                          <td className="px-6 py-3.5 text-sm font-bold text-ink">{emp.tasksClosed}</td>
                          <td className="px-6 py-3.5">
                            <div className="w-28">
                              <ProgressBar value={emp.score} />
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status="ELITE" tone="success" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Task Completion" />
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-amber-tint p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">In Progress</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">
                      {inProgressTasksCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-tint p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Completed</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">
                      {completedTasksCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <DonutChart percent={completionRate} label="Closed" />
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Completed
                    </span>
                    <span className="text-sm font-bold text-ink">{completedTasksCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-line" /> In Progress
                    </span>
                    <span className="text-sm font-bold text-ink">{inProgressTasksCount}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
