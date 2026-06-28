import { Button } from './Button'
import { Card, CardHeader } from './Card'

export default function ConfirmModal({ open, title, message, onCancel, onConfirm }: { open: boolean; title: string; message?: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <Card className="z-10 w-full max-w-md">
        <CardHeader title={title} />
        <div className="px-6 pb-6">
          {message ? <div className="mb-4 text-sm text-ink-muted">{message}</div> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm}>Confirm</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
