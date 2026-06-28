import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/components/ui/Toast'

export default function Settings() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? 'Vikram Sharma')
  const [email] = useState(user?.email ?? 'vikram.sharma@complianceos.com')
  const [phone, setPhone] = useState('+91 98200 98765')
  const [designation] = useState('GST Compliance Lead')
  const [location, setLocation] = useState('Mumbai HQ')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    toast({ message: 'Profile settings saved successfully!', type: 'success' })
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Settings & Profile"
        subtitle="Manage your profile information, view your role metrics, and configure settings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
        {/* Profile Card Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Profile Information" />
            <form onSubmit={handleSave} style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <Avatar name={name} size={72} />
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>{name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', margin: '4px 0 0 0' }}>{designation} • {location}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)' }}>Official Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 14, background: 'var(--color-line-soft)', color: 'var(--color-ink-muted)', cursor: 'not-allowed', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)' }}>Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)' }}>Designation</label>
                    <input
                      type="text"
                      value={designation}
                      disabled
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 14, background: 'var(--color-line-soft)', color: 'var(--color-ink-muted)', cursor: 'not-allowed', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)' }}>Office Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)' }}>Joining Date</label>
                  <input
                    type="text"
                    value="12 Jan 2022"
                    disabled
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 14, background: 'var(--color-line-soft)', color: 'var(--color-ink-muted)', cursor: 'not-allowed', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--color-amber)', borderColor: 'var(--color-amber)' }}>
                  {saved ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Side Stats Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Role & Performance" />
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderBottom: '1px solid var(--color-line)', paddingBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Role</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4 }}>Team Lead</div>
              </div>

              <div style={{ borderBottom: '1px solid var(--color-line)', paddingBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4 }}>GST Compliance</div>
              </div>

              <div style={{ borderBottom: '1px solid var(--color-line)', paddingBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direct Reports</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4 }}>12 Active Members</div>
              </div>

              <div style={{ borderBottom: '1px solid var(--color-line)', paddingBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Managed Clients</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4 }}>4 Enterprise Accounts</div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Team Compliance Score</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>94.2%</div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-success rounded-full" style={{ width: '94.2%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
