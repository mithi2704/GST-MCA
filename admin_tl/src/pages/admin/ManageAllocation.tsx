import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/components/ui/Toast'
import { clients, getClient } from '@/data/clients'
import { employees } from '@/data/employees'
import { DonutChart } from '@/components/ui/DonutChart'

export default function ManageAllocation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = id ? getClient(id) : undefined

  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [assignedMap, setAssignedMap] = useState<Record<string, string[]>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ lead: string; clientId: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // build assigned map from clients data grouped by team lead
    const map: Record<string, string[]> = {}
    clients.forEach((c) => {
      const lead = c.assignedTL || 'Unassigned'
      map[lead] = map[lead] || []
      map[lead].push(c.id)
    })
    setAssignedMap(map)
  }, [id])

  if (!client) {
    return (
      <div className="text-center text-ink-soft">
        <p className="text-lg font-semibold">Client not found</p>
        <p className="mt-2">The client you are looking for does not exist.</p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/clients')}>Back to Clients</Button>
        </div>
      </div>
    )
  }

  const leads = Array.from(new Set(clients.map((c) => c.assignedTL))).filter(Boolean)
  const pool = clients.filter((c) => c.id !== client.id)

  function toggleSelectClient(cid: string) {
    setSelectedClients((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]))
  }

  function confirmRemoveAllocation(lead: string, cid: string) {
    setRemoveTarget({ lead, clientId: cid })
    setConfirmOpen(true)
  }

  function doRemove() {
    if (!removeTarget) return
    const { lead, clientId } = removeTarget
    setAssignedMap((m) => ({ ...m, [lead]: (m[lead] || []).filter((x) => x !== clientId) }))
    setRemoveTarget(null)
    setConfirmOpen(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      // persist assignedMap to clients mock
      const copy = clients.map((c) => ({ ...c }))
      for (const lead of Object.keys(assignedMap)) {
        for (const cid of assignedMap[lead]) {
          const idx = copy.findIndex((x) => x.id === cid)
          if (idx !== -1) copy[idx].assignedTL = lead
        }
      }
      // apply updates in-place
      copy.forEach((c) => {
        const idx = clients.findIndex((x) => x.id === c.id)
        if (idx !== -1) clients[idx] = c
      })
      toast({ type: 'success', message: 'Allocation saved' })
    } catch {
      toast({ type: 'error', message: 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const efficiency = Math.round((employees.reduce((s, e) => s + e.score, 0) / (employees.length || 1)))

  // Small presentational components kept in-file for simplicity and reuse
  const LeadCard = ({ lead, clientsForLead }: { lead: string; clientsForLead: string[] }) => (
    <div className="rounded-lg bg-surface border border-line p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={lead} size={44} />
          <div>
            <div className="text-sm font-semibold text-ink">{lead}</div>
            <div className="text-xs text-ink-soft tracking-wide">TEAM LEAD</div>
          </div>
        </div>
        <div className="w-24 text-right">
          <div className="text-xs text-amber-900 font-semibold">LOAD</div>
          <div className="h-2 mt-2 rounded-full bg-line-soft overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (clientsForLead.length / 6) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {clientsForLead.map((cid) => {
          const c = clients.find((x) => x.id === cid)
          if (!c) return null
          return (
            <div key={cid} className="flex items-center justify-between p-3 bg-white border border-line rounded-md">
              <div>
                <div className="text-sm font-medium text-ink">{c.company}</div>
                <div className="text-xs text-ink-soft">{c.serviceType}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs px-2 py-1 rounded-full bg-line-soft text-ink-soft">{c.pendingTasks ?? 0} tasks</div>
                <Button variant="ghost" size="sm" onClick={() => confirmRemoveAllocation(lead, cid)}>Remove</Button>
              </div>
            </div>
          )
        })}
        <div className="p-2 text-center text-xs text-ink-soft border border-dashed rounded-md">Drop Client Here</div>
      </div>
    </div>
  )

  const PoolItem = ({ c }: { c: typeof clients[number] }) => (
    <div className="flex items-center gap-3 p-3 rounded-md hover:shadow-sm border border-line bg-white">
      <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleSelectClient(c.id)} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">{c.company}</div>
            <div className="text-xs text-ink-soft">{c.serviceType}</div>
          </div>
          <div className="text-xs text-ink-muted">{c.id}</div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="text-xs rounded-md bg-line-soft px-2 py-1">Priority</div>
          <div className="text-xs text-ink-soft">Due in {Math.max(1, c.pendingTasks || 0)}d</div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Client Allocation</h1>
          <p className="mt-1 text-ink-soft">Assign clients to team leads and monitor ownership history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/clients/${client.id}`)}>Back</Button>
          <Button variant="primary" loading={saving} loadingText="Saving..." onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Card>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">Client Pool</div>
                <div className="text-xs text-ink-soft">{pool.length} clients</div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={(e) => { if (!e.target.checked) setSelectedClients([]); else setSelectedClients(pool.map(p => p.id)) }} /> Select All</label>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm">Bulk Assign</Button>
                </div>
              </div>
            </div>
            <div className="px-4 pb-6">
              <div className="space-y-3">
                {pool.map((c) => (
                  <PoolItem key={c.id} c={c} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">Allocation Matrix</div>
                <div className="text-xs text-ink-soft">Organize clients by team leads</div>
              </div>
              <div className="text-xs text-ink-soft">Drag & drop or use actions</div>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {leads.map((lead) => (
                  <LeadCard key={lead} lead={lead} clientsForLead={assignedMap[lead] || []} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">Ownership History</div>
                <div className="text-xs text-ink-soft">REAL-TIME</div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {employees.slice(0, 6).map((e, i) => (
                  <div key={e.id ?? i} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-line-soft flex items-center justify-center text-sm font-semibold text-ink">{(e.name || '').split(' ').map(s => s[0]).slice(0,2).join('')}</div>
                    <div>
                      <div className="text-sm font-medium text-ink">{e.name}</div>
                      <div className="text-xs text-ink-soft">{e.designation} — {e.team}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-soft">Total Efficiency</div>
                  <div className="text-lg font-semibold text-ink">{efficiency}%</div>
                </div>
                <DonutChart percent={efficiency} size={84} stroke={12} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} title="Remove allocation" message={`Remove ${removeTarget?.clientId} from ${removeTarget?.lead}?`} onCancel={() => setConfirmOpen(false)} onConfirm={doRemove} />
    </div>
  )
}
