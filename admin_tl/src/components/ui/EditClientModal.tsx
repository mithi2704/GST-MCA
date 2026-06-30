import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import { Client, ClientStatus } from "@/data/clients"

export function EditClientModal({
  client,
  open,
  onClose,
  onSave,
}: {
  client: Client
  open: boolean
  onClose: () => void
  onSave: (updated: Client) => void
}) {
  const [form, setForm] = useState<Client>(client)

  useEffect(() => setForm(client), [client])

  if (!open) return null

  function update<K extends keyof Client>(k: K, v: Client[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="z-10 w-full max-w-2xl">
        <CardHeader title={`Edit ${client.company}`} />
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-ink-muted">Company</label>
              <input value={form.company} onChange={(e) => update('company', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Contact Email</label>
              <input value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Contact Mobile</label>
              <input
                value={form.contactMobile}
                onChange={(e) => update('contactMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Assigned TL</label>
              <input value={form.assignedTL} onChange={(e) => update('assignedTL', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value as ClientStatus)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                <option>Active</option>
                <option>On Hold</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!form.contactEmail || !emailRegex.test(form.contactEmail)) {
                  alert("Please enter a valid email address")
                  return
                }
                if (!form.contactMobile || !/^\d{10}$/.test(form.contactMobile)) {
                  alert("Phone number must be exactly 10 digits")
                  return
                }
                onSave(form)
                onClose()
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EditClientModal
