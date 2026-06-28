import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Copy, Shield } from 'lucide-react'
import copy from 'copy-to-clipboard'

// Role selection removed from this flow per request

export default function EmployeeAccess() {
  const { register, handleSubmit } = useForm<{ email: string }>(
    { defaultValues: { email: '' } }
  )

  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // generation is manual via the Generate button; auto-generation disabled
  }, [])

  function generatePasswordFromDob(dateStr?: string) {
    // If DOB provided (YYYY-MM-DD), use it; otherwise generate a strong random password
    if (dateStr) {
      const [y, m, d] = dateStr.split('-')
      const dobPart = `${d}${m}${y}` // DDMMYYYY
      const specials = ['@', '#', '$', '%', '&', '*', '!']
      const special = specials[Math.floor(Math.random() * specials.length)]
      const upper = String.fromCharCode(65 + Math.floor(Math.random() * 26))
      const num = Math.floor(10 + Math.random() * 90).toString() // two-digit
      let pwd = `${dobPart}${special}${upper}${num}`
      if (pwd.length < 10) pwd += Math.random().toString(36).slice(2, 10 - pwd.length + 2).toUpperCase()
      return pwd
    }

    // fallback random generator
    const specials = ['@', '#', '$', '%', '&', '*', '!']
    const special = specials[Math.floor(Math.random() * specials.length)]
    const upper = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const num = Math.floor(100 + Math.random() * 900) // three-digit
    const base = Math.random().toString(36).slice(2, 8).toUpperCase()
    let pwd = `${base}${special}${upper}${num}`
    if (pwd.length < 10) pwd += 'A1!'
    return pwd
  }

  function onGenerate() {
    const p = generatePasswordFromDob()
    setGenerated(p)
  }

  function onCopy() {
    if (!generated) return
    copy(generated)
    toast({ type: 'success', message: 'Password copied to clipboard' })
  }

  function passwordStrength(pass: string) {
    if (!pass) return { label: 'Empty', color: 'bg-gray-200', score: 0 }
    let score = 0
    if (pass.length >= 10) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    if (score <= 1) return { label: 'Weak', color: 'bg-red-200', score }
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-200', score }
    return { label: 'Strong', color: 'bg-green-200', score }
  }

  async function onSave(data: any) {
    if (!data.email) { toast({ type: 'error', message: 'Please provide an email' }); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    toast({ type: 'success', message: 'Employee added successfully' })
    // reset or navigate as needed
  }

  const strength = useMemo(() => passwordStrength(generated), [generated])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">System Access & Roles</h1>

        {/* RBAC removed per request - page focuses on email and password generation */}

        <div className="mt-6">
          <Card>
            <CardHeader title="Password Generation" />
            <div className="px-6 pb-6">
              <p className="text-sm text-ink-muted mb-4">Provide the employee email, then generate a permanent password. The password will not be temporary.</p>
              <form onSubmit={handleSubmit(onSave)}>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Employee Email</label>
                    <input {...register('email')} placeholder="john.doe@company.com" className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button type="button" variant="outline" onClick={onGenerate}>Generate Password</Button>
                    <Button type="button" variant="ghost" onClick={onCopy} disabled={!generated}>
                      <Copy className="h-4 w-4" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-ink-muted">Generated Password (Permanent)</label>
                  <div className="mt-1 flex gap-2 items-center">
                    <input readOnly value={generated} placeholder="No password generated" className="flex-1 h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                    <div className="w-40 text-right text-xs font-semibold">{strength.label}</div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-line bg-surface-muted p-4 text-sm text-ink">
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-ink-muted" /> <strong>Security Information</strong></div>
                  <ul className="mt-2 ml-4 list-disc text-ink-muted">
                    <li>Password does not expire automatically</li>
                    <li>Employee may be required to change password upon first login (policy-based)</li>
                    <li>Password is encrypted before storage</li>
                  </ul>
                </div>
              </form>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost">Cancel Onboarding</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit(onSave)}>Save & Add Employee</Button>
        </div>
      </div>
    </div>
  )
}
