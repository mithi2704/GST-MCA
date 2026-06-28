import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { StatusBadge } from "@/components/ui/StatusBadge"
import Spinner from "@/components/ui/Spinner"
import { type Employee } from "@/data/employees"
import { employeeService } from "@/services/employeeService"
import EmployeeQuickPanel from "@/components/ui/EmployeeQuickPanel"
import { Plus, Download, SlidersHorizontal, AlertCircle } from "lucide-react"
import { downloadCsv } from "@/lib/utils"
import { toast } from "@/components/ui/Toast"

export default function LeadEmployees() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [items, setItems] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [popoverOpenFor, setPopoverOpenFor] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<any>({})
  const [dataVersion, setDataVersion] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const kebabRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    employeeService.getEmployees()
      .then((data) => {
        setEmployeesList(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load employees')
        setLoading(false)
      })
  }, [dataVersion])

  useEffect(() => {
    function onSearch(e: Event) {
      const d = (e as CustomEvent).detail as string
      setQuery(d || "")
    }
    window.addEventListener('app:search', onSearch as EventListener)
    return () => window.removeEventListener('app:search', onSearch as EventListener)
  }, [])

  useEffect(() => {
    function onChanged() {
      setDataVersion((v) => v + 1)
    }
    window.addEventListener('employees:changed', onChanged as EventListener)
    return () => window.removeEventListener('employees:changed', onChanged as EventListener)
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    let filtered = employeesList.slice()

    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter((e) => e.status === statusFilter)
    }

    if (advancedFilters) {
      if (advancedFilters.department) filtered = filtered.filter((e) => e.team === advancedFilters.department)
      if (advancedFilters.designation) filtered = filtered.filter((e) => e.designation === advancedFilters.designation)
      if (advancedFilters.scoreMin !== undefined) filtered = filtered.filter((e) => (e.score || 0) >= Number(advancedFilters.scoreMin))
      if (advancedFilters.scoreMax !== undefined) filtered = filtered.filter((e) => (e.score || 0) <= Number(advancedFilters.scoreMax))
    }

    if (q) {
      filtered = filtered.filter((emp) => {
        return (
          emp.name.toLowerCase().includes(q) ||
          (emp.id || '').toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.team.toLowerCase().includes(q)
        )
      })
    }

    if (sortKey) {
      filtered.sort((a, b) => {
        const av = (a as any)[sortKey]
        const bv = (b as any)[sortKey]
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    }

    setItems(filtered)
  }, [query, statusFilter, sortKey, sortDir, advancedFilters, employeesList])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [items, page, totalPages])

  const stats = useMemo(() => {
    const active = employeesList.filter((e) => e.status === 'Active').length
    const total = employeesList.length
    const avgScore = total > 0 ? Math.round((employeesList.reduce((acc, e) => acc + (e.score || 0), 0) / total) * 10) / 10 : 0
    const totalTasks = employeesList.reduce((acc, e) => acc + (e.completedTasks || 0), 0)
    return { active, total, avgScore, totalTasks }
  }, [employeesList])

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    employeesList.forEach((e) => {
      if (e.status === 'Active' && e.team) {
        counts[e.team] = (counts[e.team] || 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [employeesList])

  const handleExport = () => {
    const rows = items.map((emp) => ({
      ID: emp.id,
      Name: emp.name,
      Email: emp.email,
      Designation: emp.designation,
      Team: emp.team,
      Status: emp.status,
      Score: emp.score,
    }))
    downloadCsv(rows, 'team_members_list.csv')
    toast({ message: "Employee list exported successfully", type: "success" })
  }

  const trainingPrograms = [
    { name: "GST Compliance Training", progress: 85 },
    { name: "MCA Filing Regulations", progress: 92 },
    { name: "Client Audit Protocols", progress: 60 },
  ]

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
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Team Management"
        subtitle="Monitor compliance, review scores, and manage your team’s operational capacity."
        titleStyle={{ fontSize: '32px', lineHeight: '40px', fontWeight: 800 }}
        subtitleStyle={{ fontSize: '14px', marginTop: '6px' }}
        actions={
          <>
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export List
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/lead/employees/add')} style={{ backgroundColor: 'var(--color-amber)', borderColor: 'var(--color-amber)' }}>
              Onboard New
            </Button>
          </>
        }
      />

      {/* Team Management KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Active Members</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{stats.active} / {stats.total}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 8 }}>↗ 12% increase this month</div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Avg Performance</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{stats.avgScore}%</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 8 }}>✓ Exceeds team SLA target</div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Tasks Completed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{stats.totalTasks}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 8 }}>Cumulative team output</div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Training Rate</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>75.5%</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-info)', marginTop: 8 }}>3 Programs in progress</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-4">
        {/* Table & Actions */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowStatusDropdown((s) => !s) }}
                    className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink flex items-center gap-2"
                  >
                    Status: <strong>{statusFilter}</strong>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute mt-2 w-48 rounded-md border bg-white shadow p-2 z-40">
                      <button className="w-full text-left px-2 py-2 text-sm" onClick={() => { setStatusFilter('All'); setShowStatusDropdown(false); setPage(1) }}>All</button>
                      {['Active', 'Inactive', 'On Leave'].map((s) => (
                        <button key={s} className="w-full text-left px-2 py-2 text-sm" onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); setPage(1) }}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                  className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Advanced Filters
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="px-6 pb-4 border-b border-line">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Designation</label>
                    <select
                      value={advancedFilters.designation || ''}
                      onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, designation: e.target.value || undefined }))}
                      className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                    >
                      <option value="">Any</option>
                      {[...new Set(employeesList.map(e => e.designation))].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Department</label>
                    <select
                      value={advancedFilters.department || ''}
                      onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, department: e.target.value || undefined }))}
                      className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                    >
                      <option value="">Any</option>
                      {[...new Set(employeesList.map(e => e.team).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <button onClick={() => { setAdvancedFilters({}); setPage(1) }} className="px-3 py-1.5 rounded-md border text-sm">Reset</button>
                  <button onClick={() => { setShowAdvancedFilters(false); setPage(1) }} className="px-3 py-1.5 rounded-md bg-amber text-white text-sm" style={{ backgroundColor: 'var(--color-amber)' }}>Apply Filters</button>
                </div>
              </div>
            )}

            {/* Employee Table */}
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '42%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="border-y border-line text-left text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-line-soft)', color: 'var(--color-ink-soft)' }}>
                    <th onClick={() => { setSortKey('name'); setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="px-6 py-4 cursor-pointer">Employee Name</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th onClick={() => { setSortKey('score'); setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="px-6 py-4 cursor-pointer">Score</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((emp) => (
                    <tr key={emp.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted cursor-pointer" onClick={() => navigate(`/lead/employees/${emp.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} src={emp.avatar} size={40} />
                          <div>
                            <div className="text-sm font-bold text-ink leading-tight">{emp.name}</div>
                            <div className="text-xs text-ink-muted mt-0.5">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-soft">{emp.id}</td>
                      <td className="px-6 py-4 text-sm text-ink-soft">{emp.designation}</td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ borderColor: emp.score > 80 ? 'rgba(22,163,74,0.22)' : emp.score > 60 ? 'rgba(200,130,10,0.22)' : 'rgba(220,38,38,0.22)' }}>
                          {emp.score}
                        </div>
                      </td>
                      <td className="px-6 py-4 relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            ref={kebabRef}
                            onClick={() => setPopoverOpenFor((p) => (p === emp.id ? null : emp.id))}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-line-soft"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {popoverOpenFor && (
              (() => {
                const emp = employeesList.find((e) => e.id === popoverOpenFor)
                if (!emp) return null
                return (
                  <EmployeeQuickPanel
                    employee={emp}
                    onClose={() => setPopoverOpenFor(null)}
                    onEdit={() => { setPopoverOpenFor(null); navigate(`/lead/employees/${emp.id}/edit`) }}
                    onView={() => navigate(`/lead/employees/${emp.id}`)}
                    onDeactivate={async () => {
                      const newStatus = emp.status === 'Inactive' ? 'Active' : 'Inactive'
                      if (confirm(`${newStatus === 'Inactive' ? 'Deactivate' : 'Activate'} ${emp.name}?`)) {
                        try {
                          await employeeService.updateEmployee(emp.id, { status: newStatus as any })
                          setPopoverOpenFor(null)
                          setDataVersion((v) => v + 1)
                        } catch (err: any) {
                          alert(err.message || 'Failed to update employee status')
                        }
                      }
                    }}
                  />
                )
              })()
            )}

            {/* Pagination */}
            <div className="px-6 pb-6 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-ink-muted">
                  Showing {items.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, items.length)} of {items.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 py-1.5 rounded-md text-sm border ${page === i + 1 ? 'bg-amber text-white font-bold' : 'bg-surface'}`}
                      style={page === i + 1 ? { backgroundColor: 'var(--color-amber)' } : undefined}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-4">
          {/* Department Distribution */}
          <Card className="p-4">
            <h4 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Department Distribution</h4>
            <div className="space-y-3">
              {departmentCounts.map(([name, count]) => {
                const maxCount = Math.max(...departmentCounts.map((d) => d[1]), 1)
                const percent = (count / maxCount) * 100
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-ink-soft">
                      <span>{name}</span>
                      <span className="text-ink font-bold">{count} active</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber rounded-full" style={{ width: `${percent}%`, backgroundColor: 'var(--color-amber)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Internal Training Program Widget */}
          <Card className="p-4">
            <h4 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Internal Training</h4>
            <div className="space-y-4">
              {trainingPrograms.map((prog) => (
                <div key={prog.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-ink-soft">
                    <span>{prog.name}</span>
                    <span className="font-bold text-ink">{prog.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${prog.progress}%`, backgroundColor: '#3d7cf0' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
