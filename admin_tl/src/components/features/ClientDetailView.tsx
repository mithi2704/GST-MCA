import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Download,
  Pencil,
  Users,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { StatusBadge } from "@/components/ui/StatusBadge"
import Spinner from "@/components/ui/Spinner"
import { type Client } from "@/data/clients"
import { clientService } from "@/services/clientService"
import { taskService } from "@/services/taskService"
import { downloadCsv } from '@/lib/utils'
import EditClientModal from "@/components/ui/EditClientModal"
import { toast } from "@/components/ui/Toast"

export function ClientDetailView({ basePath }: { basePath: string }) {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [tasksList, setTasksList] = useState<any[]>([])
  const [dataVersion, setDataVersion] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      clientService.getClientById(id),
      taskService.getTasks()
    ])
      .then(([clientData, allTasks]) => {
        setClient(clientData)
        // Filter tasks related to this client
        const relatedTasks = allTasks.filter((t: any) => t.client === clientData.company)
        setTasksList(relatedTasks)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Client not found')
        setLoading(false)
      })
  }, [id, dataVersion])

  function exportHistory() {
    if (tasksList.length === 0) return alert('No history to export')
    const rows = tasksList.map((f) => ({ id: f.id, name: f.name, dueDate: f.dueDate, status: f.status }))
    downloadCsv(rows, `${client?.company.replace(/\s+/g,'_')}_history.csv`)
  }

  if (error) {
    return (
      <div className="text-center text-ink-soft py-12">
        <div className="flex items-center justify-center gap-2 text-rose-600 mb-4">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
        <Button variant="outline" onClick={() => navigate(basePath)}>
          Back to Clients
        </Button>
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

  if (!client) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button onClick={() => navigate(basePath)} className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 hover:text-amber-800">
            <ArrowLeft className="h-4 w-4" /> Back to Client List
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{client.company}</h1>
            <StatusBadge status={client.status} />
            <span className="rounded-md bg-line-soft px-2 py-1 text-xs font-semibold text-ink-soft">#{client.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(client)}>Edit Client</Button>
          <Button variant="outline" icon={<Users className="h-4 w-4" />} onClick={() => navigate(`/clients/${client.id}/manage-allocation`)}>Manage Allocation</Button>
          <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={() => exportHistory()}>Export History</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between px-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold text-ink">Client Profile</h3>
              </div>
              <div className="text-sm text-amber-900">View Master Data</div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 px-6 pb-6 sm:grid-cols-2">
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Legal Company Name</p>
                <p className="text-sm text-ink mt-1 font-semibold">{client.company}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Incorporation Date</p>
                <p className="text-sm text-ink mt-1">—</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Registered Address</p>
                <p className="text-sm text-ink mt-1">{client.address || '—'}</p>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">GSTIN</p>
                <p className="text-sm text-ink mt-1">{client.gstin || '—'}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">PAN</p>
                <p className="text-sm text-ink mt-1">{client.pan || '—'}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Primary Contact Person</p>
                <p className="text-sm text-ink mt-1 font-semibold">{client.contactPerson || '—'}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Contact Mobile</p>
                <p className="text-sm text-ink mt-1">{client.contactMobile || '—'}</p>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Contact Email</p>
                <p className="text-sm text-ink mt-1">{client.contactEmail || '—'}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Entity Type</p>
                <p className="text-sm text-ink mt-1">{client.serviceType}</p>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Filing History" />
            <div className="px-6 pb-6">
              {/* Mobile: filings as cards */}
              <div className="space-y-3 sm:hidden">
                {(showFullHistory ? tasksList : tasksList.slice(0, 4)).map((f) => (
                  <div key={f.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{f.name}</div>
                        <div className="text-xs text-ink-muted">Due: {f.dueDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{f.status}</div>
                        <div className="text-xs text-ink-muted">{f.id}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {tasksList.length === 0 && (
                  <div className="text-sm text-ink-soft py-4 text-center">No filing history found.</div>
                )}
              </div>

              {/* Desktop/table: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <th className="px-6 py-3">Filing Type</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showFullHistory ? tasksList : tasksList.slice(0, 4)).map((f) => (
                      <tr key={f.id} className="border-b border-line-soft transition-colors last:border-0">
                        <td className="px-6 py-4 text-sm font-semibold text-ink">{f.name}</td>
                        <td className="px-6 py-4 text-sm text-ink-soft">{f.dueDate}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className="rounded-md px-2 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor:
                                f.status === "Completed"
                                  ? "rgba(16,185,129,0.12)"
                                  : f.status === "In Progress"
                                  ? "rgba(250,204,21,0.12)"
                                  : "rgba(239,68,68,0.06)",
                              color:
                                f.status === "Completed"
                                  ? "var(--color-success)"
                                  : f.status === "In Progress"
                                  ? "var(--color-warning)"
                                  : "var(--color-danger)",
                            }}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-amber-900 cursor-pointer" onClick={() => navigate('/tasks')}>{f.status === "Completed" ? "Receipt" : f.status === "In Progress" ? "Upload" : "View"}</td>
                      </tr>
                    ))}
                    {tasksList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-sm text-ink-soft py-4 text-center">No filing history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {tasksList.length > 4 && (
                <div className="px-6 pb-4 text-right text-sm text-amber-900 mt-2">
                  {!showFullHistory ? (
                    <button onClick={() => setShowFullHistory(true)} className="underline">View Full History ›</button>
                  ) : (
                    <button onClick={() => setShowFullHistory(false)} className="underline">Show Less</button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Assigned Team" />
            <div className="px-6 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Team Lead</p>
              <div className="mt-2 flex items-center gap-3">
                <Avatar name={client.assignedTL} size={36} />
                <div>
                  <div className="text-sm font-bold text-ink">{client.assignedTL}</div>
                  <div className="text-xs text-ink-muted">Lead Administrator</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {editing && (
        <EditClientModal
          client={editing}
          open={true}
          onClose={() => setEditing(null)}
          onSave={async (updated) => {
            try {
              await clientService.updateClient(updated.id, updated)
              toast({ type: 'success', message: 'Client details saved successfully' })
              setEditing(null)
              setDataVersion((v) => v + 1)
            } catch (err: any) {
              toast({ type: 'error', message: err.message || 'Failed to update client' })
            }
          }}
        />
      )}
    </div>
  )
}
