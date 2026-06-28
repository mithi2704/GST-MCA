import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { clients } from "@/data/clients"
import { employees } from "@/data/employees"
import { Avatar } from "@/components/ui/Avatar"

export default function AdminClientAllocation() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Client Allocation" subtitle="Client Allocation - ComplianceOS" />

      <div className="grid gap-6" style={{ gridTemplateColumns: '320px 1fr 320px' }}>
        {/* Left: Client Pool */}
        <Card>
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-ink-muted">Client Pool</p>
                <p className="text-sm font-bold text-ink">Select from unassigned clients</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-sm">Select All</Button>
                <Button variant="primary" className="text-sm">Bulk Assign</Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto">
              {clients.map((c) => (
                <div key={c.id} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex items-start justify-between">
                    <div>
                              <button onClick={() => navigate(`/clients/${c.id}`)} className="text-sm font-bold text-ink hover:text-gold-dark">{c.company}</button>
                      <div className="text-xs text-ink-muted">{c.serviceType}</div>
                    </div>
                    <div className="text-xs text-ink-muted">{c.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Middle: Allocation Matrix */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Allocation Matrix</h2>
              <p className="text-sm text-ink-muted">Drag clients to assign them to team leads</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-sm">Filter</Button>
              <Button variant="primary" className="text-sm">Save Allocation</Button>
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {employees.slice(0, 3).map((emp) => (
              <Card key={emp.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={emp.name} size={40} />
                  <div>
                    <div className="text-sm font-bold text-ink">{emp.name}</div>
                    <div className="text-xs text-ink-muted">{emp.designation}</div>
                  </div>
                </div>

                <div className="mt-4 min-h-[180px] rounded-lg border border-dashed border-line bg-surface-muted p-3">
                  <p className="text-sm text-ink-muted">Drop client here</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Ownership History */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-bold text-ink">Ownership History</h3>
            <div className="mt-3 space-y-3 text-sm text-ink-muted">
              <div className="rounded-md border border-line p-3 bg-surface">
                <div className="text-xs font-semibold">Relinance Ind. Reassigned</div>
                <div className="text-xs">Assigned to Vikram Sharma — 2 days ago</div>
              </div>
              <div className="rounded-md border border-line p-3 bg-surface">
                <div className="text-xs font-semibold">MCA Filing Completed</div>
                <div className="text-xs">Assigned to Priyanka L. — 1 week ago</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
