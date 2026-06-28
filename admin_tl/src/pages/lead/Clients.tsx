import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { StatusBadge } from "@/components/ui/StatusBadge"
import Spinner from "@/components/ui/Spinner"
import { type Client, type ServiceType } from "@/data/clients"
import { type Employee } from "@/data/employees"
import { type Task } from "@/data/tasks"
import { clientService } from "@/services/clientService"
import { employeeService } from "@/services/employeeService"
import { taskService } from "@/services/taskService"
import RowActionsPopover from "@/components/ui/RowActionsPopover"
import EditClientModal from "@/components/ui/EditClientModal"
import { Plus, Download, SlidersHorizontal, AlertCircle } from "lucide-react"
import { downloadCsv, cn } from "@/lib/utils"
import { toast } from "@/components/ui/Toast"

const serviceTone: Record<ServiceType, string> = {
  "GST + MCA": "bg-info-soft text-info",
  Audit: "bg-amber-soft text-gold-dark",
  "MCA Only": "bg-info-soft text-info",
  GST: "bg-success-soft text-success",
}

export default function LeadClients() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [tasksList, setTasksList] = useState<Task[]>([])
  const [items, setItems] = useState<Client[]>([])
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
  
  const [serviceFilter, setServiceFilter] = useState<string>('All Services')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const kebabRef = useRef<HTMLButtonElement | null>(null)

  // Edit modal state
  const [editing, setEditing] = useState<Client | null>(null)

  // Task Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [taskPriority, setTaskPriority] = useState('Standard')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      clientService.getClients(),
      employeeService.getEmployees(),
      taskService.getTasks()
    ])
      .then(([clis, emps, ts]) => {
        setClientsList(clis)
        setEmployeesList(emps)
        setTasksList(ts)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load clients data')
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
    window.addEventListener('clients:changed', onChanged as EventListener)
    return () => window.removeEventListener('clients:changed', onChanged as EventListener)
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    let filtered = clientsList.slice()

    if (serviceFilter && serviceFilter !== 'All Services') {
      filtered = filtered.filter((c) => c.serviceType === serviceFilter)
    }

    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    if (advancedFilters) {
      if (advancedFilters.assignedTL) {
        filtered = filtered.filter((c) => c.assignedTL.toLowerCase().includes(advancedFilters.assignedTL.toLowerCase()))
      }
      if (advancedFilters.gstin) {
        filtered = filtered.filter((c) => c.gstin.toLowerCase().includes(advancedFilters.gstin.toLowerCase()))
      }
    }

    if (q) {
      filtered = filtered.filter((cli) => {
        return (
          cli.company.toLowerCase().includes(q) ||
          cli.contactPerson.toLowerCase().includes(q) ||
          cli.contactEmail.toLowerCase().includes(q) ||
          cli.assignedTL.toLowerCase().includes(q) ||
          (cli.id || '').toLowerCase().includes(q)
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
  }, [query, serviceFilter, statusFilter, sortKey, sortDir, advancedFilters, clientsList])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [items, page, totalPages])

  const clientStats = useMemo(() => {
    const total = clientsList.length
    const active = clientsList.filter(c => c.status === 'Active').length
    const complianceRate = total > 0 ? `${Math.round((active / total) * 100)}%` : '100%'
    const pendingFilings = tasksList.filter(t => t.status !== 'Completed').length
    const auditPipeline = clientsList.filter(c => c.serviceType === 'Audit').length
    return { total, complianceRate, pendingFilings, auditPipeline }
  }, [clientsList, tasksList])

  const handleExport = () => {
    const rows = items.map((c) => ({
      ID: c.id,
      Company: c.company,
      'Service Type': c.serviceType,
      'Contact Person': c.contactPerson,
      'Contact Mobile': c.contactMobile,
      'Contact Email': c.contactEmail,
      GSTIN: c.gstin,
      PAN: c.pan,
      'Assigned TL': c.assignedTL,
      Status: c.status,
    }))
    downloadCsv(rows, 'clients_list.csv')
    toast({ message: "Clients list exported successfully", type: "success" })
  }

  // Find upcoming task deadlines (not completed, sorted by due date)
  const upcomingDeadlines = useMemo(() => {
    return tasksList
      .filter((t) => t.status !== 'Completed')
      .map((t) => {
        const due = new Date(t.dueDate)
        const diffTime = due.getTime() - Date.now()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        let dueLabel = t.dueDate
        if (diffDays < 0) {
          dueLabel = `Overdue by ${Math.abs(diffDays)} days`
        } else if (diffDays === 0) {
          dueLabel = `Due today`
        } else if (diffDays === 1) {
          dueLabel = `Due tomorrow`
        } else if (diffDays <= 7) {
          dueLabel = `Due in ${diffDays} days`
        }

        return {
          ...t,
          dueLabel,
          isOverdue: diffDays < 0
        }
      })
      .slice(0, 4)
  }, [tasksList])

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
        title="Client Management"
        subtitle="Manage client service delivery, check filing requirements, and track compliance status."
        titleStyle={{ fontSize: '32px', lineHeight: '40px', fontWeight: 800 }}
        subtitleStyle={{ fontSize: '14px', marginTop: '6px' }}
        actions={
          <>
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export List
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAssignModal(true)} style={{ backgroundColor: 'var(--color-amber)', borderColor: 'var(--color-amber)' }}>
              Add New Task
            </Button>
          </>
        }
      />

      {/* Client Management KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Total Clients</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{clientStats.total}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 8 }}>↗ 12% increase this month</div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Compliance Rate</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{clientStats.complianceRate}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 8 }}>✓ Exceeds team SLA target</div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Pending Filings</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{clientStats.pendingFilings}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 8 }}>⚠ Active workflows</div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>Audit Pipeline</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', marginTop: 8 }}>{clientStats.auditPipeline}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 8 }}>Clients under audit</div>
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
                    onClick={(e) => { e.stopPropagation(); setShowServiceDropdown((s) => !s); setShowStatusDropdown(false); }}
                    className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink flex items-center gap-2"
                  >
                    Service: <strong>{serviceFilter}</strong>
                  </button>
                  {showServiceDropdown && (
                    <div className="absolute mt-2 w-48 rounded-md border bg-white shadow p-2 z-40">
                      <button className="w-full text-left px-2 py-2 text-sm" onClick={() => { setServiceFilter('All Services'); setShowServiceDropdown(false); setPage(1) }}>All Services</button>
                      {['GST + MCA', 'Audit', 'MCA Only', 'GST'].map((s) => (
                        <button key={s} className="w-full text-left px-2 py-2 text-sm" onClick={() => { setServiceFilter(s); setShowServiceDropdown(false); setPage(1) }}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowStatusDropdown((s) => !s); setShowServiceDropdown(false); }}
                    className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink flex items-center gap-2"
                  >
                    Status: <strong>{statusFilter}</strong>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute mt-2 w-48 rounded-md border bg-white shadow p-2 z-40">
                      <button className="w-full text-left px-2 py-2 text-sm" onClick={() => { setStatusFilter('All'); setShowStatusDropdown(false); setPage(1) }}>All</button>
                      {['Active', 'On Hold', 'Overdue'].map((s) => (
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
                    <label className="text-xs font-semibold text-ink-muted">Assigned Team Lead</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Sharma"
                      value={advancedFilters.assignedTL || ''}
                      onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, assignedTL: e.target.value || undefined }))}
                      className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">GSTIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAACG..."
                      value={advancedFilters.gstin || ''}
                      onChange={(e) => setAdvancedFilters((a: any) => ({ ...a, gstin: e.target.value || undefined }))}
                      className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <button onClick={() => { setAdvancedFilters({}); setPage(1) }} className="px-3 py-1.5 rounded-md border text-sm">Reset</button>
                  <button onClick={() => { setShowAdvancedFilters(false); setPage(1) }} className="px-3 py-1.5 rounded-md bg-amber text-white text-sm" style={{ backgroundColor: 'var(--color-amber)' }}>Apply Filters</button>
                </div>
              </div>
            )}

            {/* Clients Table */}
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="border-y border-line text-left text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-line-soft)', color: 'var(--color-ink-soft)' }}>
                    <th onClick={() => { setSortKey('company'); setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="px-6 py-4 cursor-pointer">Company Name</th>
                    <th className="px-6 py-4">Service Type</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Assigned TL</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((client) => (
                    <tr key={client.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted cursor-pointer" onClick={() => navigate(`/lead/clients/${client.id}`)}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-bold text-ink leading-tight">{client.company}</div>
                          <div className="text-xs text-ink-muted mt-0.5">{client.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", serviceTone[client.serviceType])}>
                          {client.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-ink leading-tight">{client.contactPerson}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{client.contactEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={client.assignedTL} size={28} />
                          <span className="text-sm text-ink-soft">{client.assignedTL}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={client.status} dot />
                      </td>
                      <td className="px-6 py-4 relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            ref={kebabRef}
                            onClick={() => setPopoverOpenFor((p) => (p === client.id ? null : client.id))}
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
                const client = clientsList.find((c) => c.id === popoverOpenFor)
                if (!client) return null
                return (
                  <RowActionsPopover
                    open={true}
                    anchorRef={kebabRef}
                    onClose={() => setPopoverOpenFor(null)}
                    onEdit={() => { setPopoverOpenFor(null); setEditing(client) }}
                    onView={() => navigate(`/lead/clients/${client.id}`)}
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
          {/* Regional concentration */}
          <Card className="p-4">
            <h4 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Client Concentration Map</h4>
            <div className="space-y-3">
              {[
                { name: "West (Maharashtra)", percent: 45, color: "var(--color-amber)" },
                { name: "South (Karnataka/TS)", percent: 30, color: "#3d7cf0" },
                { name: "North (Delhi NCR)", percent: 15, color: "#16a34a" },
                { name: "East / Others", percent: 10, color: "#8b5cf6" },
              ].map((reg) => (
                <div key={reg.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-ink-soft">
                    <span>{reg.name}</span>
                    <span className="text-ink font-bold">{reg.percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${reg.percent}%`, backgroundColor: reg.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Task Deadlines */}
          <Card className="p-4">
            <h4 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Upcoming Deadlines</h4>
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => (
                <div key={task.id} className="p-3 border border-line-soft rounded-lg bg-surface hover:bg-surface-muted transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-ink truncate" title={task.name}>{task.name}</div>
                      <div className="text-[10px] text-ink-muted truncate mt-0.5">{task.client}</div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
                      task.priority === "Critical" ? "bg-red-50 text-red-600" :
                      task.priority === "High" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[10px] text-ink-soft font-semibold">
                      Assignee: {task.employee || 'Unassigned'}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      task.isOverdue ? "text-red-500" : "text-amber-600"
                    )}>
                      {task.dueLabel}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="text-xs text-ink-muted text-center py-4">No upcoming filing deadlines found.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Client Modal */}
      {editing && (
        <EditClientModal
          client={editing}
          open={true}
          onClose={() => setEditing(null)}
          onSave={async (updated) => {
            try {
              await clientService.updateClient(updated.id, updated)
              setDataVersion((v) => v + 1)
              toast({ message: "Client profile updated successfully", type: "success" })
              setEditing(null)
            } catch (err: any) {
              toast({ message: err.message || "Failed to update client", type: "error" })
            }
          }}
        />
      )}

      {/* Task Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAssignModal(false)} />
          <div className="z-10 w-full max-w-md bg-white rounded-xl shadow-lg border p-6">
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 16 }}>Assign New Task</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Task Name</label>
                <input
                  type="text"
                  placeholder="e.g. GST Filing May"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Assignee (Employee)</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                >
                  <option value="">Choose an employee...</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Select Client</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Choose a client...</option>
                  {clientsList.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.company}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', textTransform: 'uppercase' }}>Priority</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e7e9f1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Standard">Standard</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="px-4 py-2 border rounded-lg text-sm hover:bg-neutral-50"
                onClick={() => {
                  setShowAssignModal(false)
                  setTaskName('')
                  setSelectedEmpId('')
                  setSelectedClientId('')
                  setTaskPriority('Standard')
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-amber rounded-lg text-white font-semibold text-sm hover:bg-amber-600"
                style={{ backgroundColor: 'var(--color-amber)' }}
                onClick={async () => {
                  if (!taskName.trim()) {
                    toast({ message: 'Task name is required', type: 'error' })
                    return
                  }
                  if (!selectedEmpId) {
                    toast({ message: 'Please select an employee', type: 'error' })
                    return
                  }
                  if (!selectedClientId) {
                    toast({ message: 'Please select a client', type: 'error' })
                    return
                  }
                  
                  try {
                    await taskService.createTask({
                      title: taskName,
                      clientId: Number(selectedClientId),
                      assignedEmployeeId: Number(selectedEmpId),
                      priority: taskPriority.toUpperCase() as any,
                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                      description: 'Task auto-assigned from Team Lead Console'
                    } as any)
                    
                    toast({ message: `Task "${taskName}" successfully created and assigned!`, type: 'success' })
                    setDataVersion((v) => v + 1)
                    setShowAssignModal(false)
                    setTaskName('')
                    setSelectedEmpId('')
                    setSelectedClientId('')
                    setTaskPriority('Standard')
                  } catch (err: any) {
                    toast({ message: err.message || 'Failed to create task', type: 'error' })
                  }
                }}
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
