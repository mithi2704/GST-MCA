import { Card } from "@/components/ui/Card"

export default function AdminDocuments() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Document Repository</h1>
        <p className="mt-1 text-sm text-ink-soft">Repository management and file details.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-ink-muted">Categories</h3>
            <div className="mt-4 text-sm text-ink-muted">Folder list and counts.</div>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-ink-muted">Files</h3>
            <div className="mt-4 text-sm text-ink-muted">Table of files and preview pane (visual only).</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
