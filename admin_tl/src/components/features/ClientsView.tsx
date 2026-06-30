import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Download, SlidersHorizontal, UserPlus, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { KpiCard } from "@/components/ui/KpiCard"
import { Card } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { StatusBadge } from "@/components/ui/StatusBadge"
import Spinner from "@/components/ui/Spinner"
import { clientStats, type Client, type ServiceType } from "@/data/clients"
import { clientService } from "@/services/clientService"
import RowActionsPopover from "@/components/ui/RowActionsPopover"
import EditClientModal from "@/components/ui/EditClientModal"
import { cn, downloadCsv } from "@/lib/utils"

const serviceTone: Record<ServiceType, string> = {
  "GST + MCA": "bg-info-soft text-info",
  Audit: "bg-amber-soft text-gold-dark",
  "MCA Only": "bg-info-soft text-info",
  GST: "bg-success-soft text-success",
}

export function ClientsView({
  basePath,
}: {
  basePath: string
}) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [editing, setEditing] = useState<Client | null>(null)
  const [popoverFor, setPopoverFor] = useState<string | null>(null)
  const [dataVersion, setDataVersion] = useState(0)
  const kebabRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    clientService.getClients()
      .then((data) => {
        setClientsList(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load clients')
        setLoading(false)
      })
  }, [dataVersion])

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  useEffect(() => {
    function onSearch(e: Event) {
      const d = (e as CustomEvent).detail as string
      setQuery(d || "")
    }
    window.addEventListener('app:search', onSearch as EventListener)
    return () => window.removeEventListener('app:search', onSearch as EventListener)
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setItems(clientsList)
      return
    }
    setItems(clientsList.filter((c) => {
      return (
        c.company.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.assignedTL.toLowerCase().includes(q)
      )
    }))
  }, [query, clientsList])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])

  function exportCsv() {
    const rows = items.map((c) => ({ id: c.id, company: c.company, contact: c.contactPerson, status: c.status }))
    if (rows.length === 0) return
    downloadCsv(rows, 'clients.csv')
  }

  return (
    <div>
      <PageHeader
        title="Client Management"
        subtitle={`Managing ${clientsList.length} active enterprise compliance profiles`}
        actions={
          <>
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => exportCsv()}>
              Export Reports
            </Button>
            <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => navigate(`${basePath}/add`)}>
              Onboard Client
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Clients" value={String(clientsList.length)} meta="↗ 12%" metaTone="success" sub="Active for FY 2025-26" accent="gold" />
            <KpiCard label="Compliance Rate" value={clientStats.complianceRate} meta="Stable" metaTone="success" sub="Target benchmark: 95%" accent="success" />
            <KpiCard label="Pending Filings" value={String(clientStats.pendingFilings)} meta="High" metaTone="danger" sub="Due within 48 hours" accent="warning" />
            <KpiCard label="Audit Pipeline" value={clientStats.auditPipeline} meta="Ongoing" metaTone="neutral" sub="Total portfolio value" accent="info" />
          </div>

          <Card className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <select className="h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft focus:border-amber focus:outline-none">
                  <option>All Services</option>
                  <option>GST + MCA</option>
                  <option>Audit</option>
                  <option>MCA Only</option>
                  <option>GST</option>
                </select>
                <select className="h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft focus:border-amber focus:outline-none">
                  <option>Status: All</option>
                  <option>Active</option>
                  <option>On Hold</option>
                  <option>Overdue</option>
                </select>
                <button className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark">
                  <SlidersHorizontal className="h-4 w-4" /> Advanced Filters
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink-muted">Showing {(items.length === 0) ? 0 : ((page-1)*pageSize+1)}-{Math.min(page*pageSize, items.length)} of {items.length}</span>
                <div className="flex items-center gap-1">
                  <button className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-surface-muted" onClick={() => setPage((p) => Math.max(1, p-1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-surface-muted" onClick={() => setPage((p) => Math.min(totalPages, p+1))}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-ink-soft">
                No clients found.
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden px-4 pb-4 space-y-3">
                  {items.slice((page-1)*pageSize, page*pageSize).map((client) => (
                    <div key={client.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-ink truncate">{client.company}</div>
                          <div className="text-xs text-ink-muted truncate">{client.contactPerson} • {client.contactMobile}</div>
                          <div className="mt-2 text-xs"><span className={cn("rounded-md px-2 py-1 text-xs font-semibold", serviceTone[client.serviceType])}>{client.serviceType}</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{client.assignedTL}</div>
                          <div className="text-xs text-ink-muted">{client.status}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`${basePath}/${client.id}`)} className="px-3 py-1 rounded-md bg-surface text-sm">View</button>
                        <button onClick={() => setPopoverFor((p) => (p === client.id ? null : client.id))} className="px-2 py-1 rounded-md border text-sm">⋮</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        <th className="px-6 py-3 w-10"></th>
                        <th className="px-6 py-3">Company Name</th>
                        <th className="px-6 py-3">Service Type</th>
                        <th className="px-6 py-3">Contact Person</th>
                        <th className="px-6 py-3">Assigned TL</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice((page-1)*pageSize, page*pageSize).map((client) => (
                        <tr key={client.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-muted">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selected.includes(client.id)}
                              onChange={() => toggle(client.id)}
                              className="h-4 w-4 rounded border-line accent-amber"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`${basePath}/${client.id}`)}
                              className="text-left text-sm font-bold text-ink hover:text-gold-dark"
                            >
                              {client.company}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", serviceTone[client.serviceType])}>
                              {client.serviceType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-ink">{client.contactPerson}</p>
                            <p className="text-xs text-ink-muted">{client.contactMobile}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar name={client.assignedTL} size={28} />
                              <span className="text-sm text-ink-soft">{client.assignedTL}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={client.status} dot />
                          </td>
                          <td className="px-6 py-4 relative">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={(e) => {
                                  kebabRef.current = e.currentTarget
                                  setPopoverFor((p) => (p === client.id ? null : client.id))
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-line-soft"
                                aria-label="More"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                              </button>
                              {popoverFor === client.id && (
                                <RowActionsPopover
                                  open={true}
                                  anchorRef={kebabRef}
                                  onClose={() => setPopoverFor(null)}
                                  onEdit={() => setEditing(client)}
                                  onView={() => navigate(`${basePath}/${client.id}`)}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-ink-soft">
                    <span>Rows per page:</span>
                    <select className="h-8 rounded-md border border-line bg-surface px-2 text-sm focus:border-amber focus:outline-none">
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setPage(i+1)} className={cn("flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold", page === i+1 ? "bg-amber text-sidebar" : "text-ink-soft hover:bg-surface-muted")}>
                        {i+1}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {editing && (
        <EditClientModal
          client={editing}
          open={true}
          onClose={() => setEditing(null)}
          onSave={async (updated) => {
            try {
              await clientService.updateClient(updated.id, updated)
              setEditing(null)
              setDataVersion((v) => v + 1)
            } catch (err: any) {
              alert(err.message || 'Failed to update client')
            }
          }}
        />
      )}
    </div>
  )
}
