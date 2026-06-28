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
import { Plus, AlertCircle } from "lucide-react"

export default function AdminEmployees() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [items, setItems] = useState<Employee[]>([])
  const [popoverOpenFor, setPopoverOpenFor] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<any>({})
  const [dataVersion, setDataVersion] = useState(0)

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

  function computeKpi(currentItems: Employee[]) {
    const total = employeesList.length
    const active = employeesList.filter((e) => e.status === 'Active').length
    const inactive = employeesList.filter((e) => e.status === 'Inactive').length
    const avgScore = Math.round((currentItems.reduce((s, e) => s + (e.score || 0), 0) / Math.max(1, currentItems.length)) * 10) / 10
    return { total, active, inactive, avgScore }
  }

  const [kpi, setKpi] = useState({ total: 0, active: 0, inactive: 0, avgScore: 0 })
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const kebabRef = useRef<HTMLButtonElement | null>(null)

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

    // apply status filter
    if (statusFilter && statusFilter !== 'All') filtered = filtered.filter((e) => e.status === statusFilter)

    // apply advanced filters
    if (advancedFilters) {
      if (advancedFilters.department) filtered = filtered.filter((e) => e.team === advancedFilters.department)
      if (advancedFilters.designation) filtered = filtered.filter((e) => e.designation === advancedFilters.designation)
      if (advancedFilters.scoreMin !== undefined) filtered = filtered.filter((e) => (e.score || 0) >= Number(advancedFilters.scoreMin))
      if (advancedFilters.scoreMax !== undefined) filtered = filtered.filter((e) => (e.score || 0) <= Number(advancedFilters.scoreMax))
      if (advancedFilters.joinFrom) {
        const from = new Date(advancedFilters.joinFrom).getTime()
        if (!isNaN(from)) filtered = filtered.filter((e) => { const d = new Date(e.joiningDate).getTime(); return !isNaN(d) ? d >= from : true })
      }
      if (advancedFilters.joinTo) {
        const to = new Date(advancedFilters.joinTo).getTime()
        if (!isNaN(to)) filtered = filtered.filter((e) => { const d = new Date(e.joiningDate).getTime(); return !isNaN(d) ? d <= to : true })
      }
      if (advancedFilters.status) filtered = filtered.filter((e) => e.status === advancedFilters.status)
    }

    // apply text search
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

    // sorting
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

  useEffect(() => {
    const max = Math.max(1, Math.ceil(items.length / pageSize))
    if (page > max) setPage(max)
    setKpi(computeKpi(items))
  }, [items, page, pageSize, employeesList])

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        subtitle="Manage personnel records and compliance performance across all departments."
        actions={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/employees/add')}>Add Employee</Button>}
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="mt-2">
              <div className="relative">
                <div className="mb-4 flex items-center justify-between gap-4 px-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setShowStatusDropdown((s) => !s) }} className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink flex items-center gap-2">Status: <strong className="ml-2">{statusFilter === 'All' ? 'All' : statusFilter}</strong></button>
                      {showStatusDropdown && (
                        <div className="absolute mt-2 w-48 rounded-md border bg-white shadow p-2 z-40">
                          <button className="w-full text-left px-2 py-2 text-sm" onClick={() => { setStatusFilter('All'); setShowStatusDropdown(false); setPage(1) }}>All</button>
                          {['Active','Inactive','On Leave', ...Array.from(new Set(employeesList.map((e) => e.status)))].filter(Boolean).map((s) => (
                            <button key={s} className="w-full text-left px-2 py-2 text-sm" onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); setPage(1) }}>{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setShowAdvancedFilters((v) => !v)} className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink">Advanced Filters</button>
                  </div>
                </div>
                {showAdvancedFilters && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Department</label>
                        <select value={advancedFilters.department || ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, department: e.target.value || undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                          <option value="">Any</option>
                          {[...new Set(employeesList.map(e => e.team))].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Designation</label>
                        <select value={advancedFilters.designation || ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, designation: e.target.value || undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                          <option value="">Any</option>
                          {[...new Set(employeesList.map(e => e.designation))].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Status</label>
                        <select value={advancedFilters.status || ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, status: e.target.value || undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                          <option value="">Any</option>
                          {['Active','Inactive','On Leave', ...Array.from(new Set(employeesList.map((e) => e.status)))].filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Joining From</label>
                        <input type="date" value={advancedFilters.joinFrom || ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, joinFrom: e.target.value || undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Joining To</label>
                        <input type="date" value={advancedFilters.joinTo || ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, joinTo: e.target.value || undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Score Min</label>
                        <input type="number" value={advancedFilters.scoreMin ?? ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, scoreMin: e.target.value ? Number(e.target.value) : undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Score Max</label>
                        <input type="number" value={advancedFilters.scoreMax ?? ''} onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, scoreMax: e.target.value ? Number(e.target.value) : undefined }))} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => { setAdvancedFilters({}); setPage(1) }} className="px-3 py-2 rounded-md border border-line bg-white">Reset</button>
                      <button onClick={() => { setShowAdvancedFilters(false); setPage(1) }} className="px-3 py-2 rounded-md bg-amber text-white" style={{ backgroundColor: 'var(--color-amber)' }}>Apply Filters</button>
                    </div>
                  </div>
                )}

                <div className="px-6 pb-6">
                  {items.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-ink-soft">
                      No employees found.
                    </div>
                  ) : (
                    <>
                      {/* Mobile: cards */}
                      <div className="space-y-3 sm:hidden">
                        {pagedItems.map((emp) => (
                          <div key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="p-4 border border-line rounded-lg bg-white/80">
                            <div className="flex items-center gap-3">
                              <Avatar name={emp.name} src={emp.avatar} size={48} />
                              <div className="flex-1 min-w-0">
                                <div className="text-base font-extrabold text-ink truncate">{emp.name}</div>
                                <div className="text-xs text-ink-muted truncate">{emp.email}</div>
                                <div className="text-xs text-ink-soft mt-1">{emp.designation} • {emp.team}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">{emp.score}</div>
                                <div className="text-xs text-ink-muted">Score</div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setPopoverOpenFor((p) => (p === emp.id ? null : emp.id)) }} className="px-2 py-1 rounded-md border text-sm">⋮</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop/tablet: show table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: '42%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '9%' }} />
                          </colgroup>
                          <thead>
                            <tr className="border-y border-line text-left text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-line-soft)', color: 'var(--color-ink-soft)', boxShadow: 'inset 0 -1px 0 rgba(16,24,40,0.02)' }}>
                              <th onClick={() => { setSortKey('name'); setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="px-6 py-4 first:rounded-tl-md cursor-pointer">Employee Name</th>
                              <th className="px-6 py-4">ID</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Status</th>
                              <th onClick={() => { setSortKey('score'); setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="px-6 py-4 cursor-pointer">Score</th>
                              <th className="px-6 py-4 text-right last:rounded-tr-md">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedItems.map((emp) => (
                              <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={emp.name} src={emp.avatar} size={48} />
                                    <div>
                                      <div className="text-base font-extrabold text-ink" style={{ letterSpacing: '0.2px', lineHeight: '1.15' }}>{emp.name}</div>
                                      <div className="text-xs text-ink-muted" style={{ marginTop: 3 }}>{emp.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6 text-sm text-ink-soft">{`#${emp.id}`}</td>
                                <td className="px-6 py-6 text-sm text-ink-soft">{emp.designation}</td>
                                <td className="px-6 py-6">
                                  <StatusBadge status={emp.status} />
                                </td>
                                <td className="px-6 py-6">
                                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-3" style={{ borderColor: emp.score > 80 ? 'rgba(22,163,74,0.22)' : emp.score > 60 ? 'rgba(200,130,10,0.22)' : 'rgba(220,38,38,0.22)', backgroundColor: 'white' }}>
                                    <div className="text-base font-semibold text-ink" style={{ transform: 'translateY(-1px)' }}>{emp.score}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-6 relative">
                                  <div className="flex items-center justify-end">
                                    <button
                                      ref={kebabRef}
                                      onClick={(e) => { e.stopPropagation(); setPopoverOpenFor((p) => (p === emp.id ? null : emp.id)) }}
                                      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-line-soft"
                                      aria-label="More"
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
                    </>
                  )}
                </div>
              </div>
              {popoverOpenFor && (
                (() => {
                  const emp = employeesList.find((e) => e.id === popoverOpenFor)
                  if (!emp) return null
                  return (
                    <EmployeeQuickPanel
                      employee={emp}
                      onClose={() => setPopoverOpenFor(null)}
                      onEdit={() => { setPopoverOpenFor(null); navigate(`/employees/${emp.id}/edit`) }}
                      onView={() => navigate(`/employees/${emp.id}`)}
                      onDeactivate={async () => {
                        const newStatus = emp.status === 'Inactive' ? 'Active' : 'Inactive'
                        if (confirm(`${newStatus === 'Inactive' ? 'Deactivate' : 'Activate'} ${emp.name}?`)) {
                          try {
                            await employeeService.updateEmployee(emp.id, { status: newStatus as any })
                            setPopoverOpenFor(null)
                            setDataVersion((v) => v + 1)
                          } catch (err: any) {
                            alert(err.message || 'Failed to update status')
                          }
                        }
                      }}
                    />
                  )
                })()
              )}
              {items.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-ink-muted">Showing {(items.length === 0) ? 0 : ((page - 1) * pageSize + 1)} to {Math.min(page * pageSize, items.length)} of {items.length} entries</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded-md bg-surface text-ink-soft border border-line">Previous</button>
                      {(() => {
                        const max = Math.max(1, Math.ceil(items.length / pageSize))
                        const pages = []
                        for (let i = 1; i <= max; i++) pages.push(i)
                        return pages.map((p) => (
                          <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-md ${p === page ? 'bg-amber text-white' : 'bg-surface text-ink-soft'} border border-line`} style={{ backgroundColor: p === page ? 'var(--color-amber)' : undefined }}>{p}</button>
                        ))
                      })()}
                      <button onClick={() => { const max = Math.max(1, Math.ceil(items.length / pageSize)); setPage((p) => Math.min(max, p + 1)) }} className="px-3 py-1 rounded-md bg-surface text-ink-soft border border-line">Next</button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="mt-2 space-y-4">
              <div className="rounded-lg" style={{ backgroundColor: 'var(--color-amber)', padding: '16px', borderRadius: 'var(--radius)' }}>
                <div className="text-xs uppercase tracking-wide text-amber-900">Total Strength</div>
                <div className="mt-2" style={{ fontSize: 40, fontWeight: 800, color: 'white' }}>{kpi.total}</div>
                <div className="mt-2 text-xs text-amber-900">Active: {kpi.active} • Inactive: {kpi.inactive} • Avg: {kpi.avgScore}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
