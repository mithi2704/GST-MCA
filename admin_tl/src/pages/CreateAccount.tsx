import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function CreateAccount() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Card className="w-full max-w-xl p-10">
        <h1 className="text-2xl font-extrabold text-ink">Create Account</h1>
        <p className="mt-2 text-sm text-ink-muted">Create an account to access the Admin Console.</p>

        <div className="mt-6 space-y-4">
          <input className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="Full name" />
          <input className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="Work email" />
          <input className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm" placeholder="Password" />
          <Button variant="primary" className="w-full">Create Account →</Button>
        </div>
      </Card>
    </div>
  )
}
