import { Bell, HelpCircle, Search, Settings, Menu } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { Avatar } from "@/components/ui/Avatar"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Toasts, { toast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { useNavigate } from "react-router-dom"
import { employees } from '@/data/employees'
import { clients } from '@/data/clients'
import { tasks } from '@/data/tasks'
import { useAuth } from "@/context/AuthContext"

export function Topbar({
  searchPlaceholder = "Search operations, filings, or teams...",
  userName,
  userRole,
  onOpenSidebar,
}: {
  searchPlaceholder?: string
  userName: string
  userRole: string
  onOpenSidebar?: () => void
}) {
  let timeout: number | undefined

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    if (timeout) window.clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('app:search', { detail: v }))
    }, 250)
  }

  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const notifRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const helpRef = useRef<HTMLDivElement | null>(null)
  const supportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (notifOpen && notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false)
      if (profileOpen && profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(t)) setSettingsOpen(false)
      if (helpOpen && helpRef.current && !helpRef.current.contains(t)) setHelpOpen(false)
      if (supportOpen && supportRef.current && !supportRef.current.contains(t)) setSupportOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [notifOpen, profileOpen, settingsOpen, helpOpen, supportOpen])

  const sampleNotifications = [
    { id: 'n1', title: 'GSTR-3B due', desc: 'GSTR-3B filing due for Acme Global', time: '2h', target: { type: 'task', id: 'TSK-5001' }, read: false },
    { id: 'n2', title: 'Employee Onboarded', desc: 'New employee Anita Mishra added', time: '1d', target: { type: 'employee', id: 'EMP-1103' }, read: false },
    { id: 'n3', title: 'Payment Received', desc: 'Invoice #INV-102 paid', time: '3d', target: { type: 'client', id: 'CL-2001' }, read: false },
  ]

  return (
    <>
    <header style={{ height: 'var(--topbar-height)' }} className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-canvas px-4 md:px-10">
        <div className="relative flex-1">
        <button onClick={() => onOpenSidebar && onOpenSidebar()} className="mr-3 md:hidden text-ink-soft">
          <Menu className="h-5 w-5" />
        </button>
        <button onClick={() => inputRef.current?.focus()} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
          <Search className="h-5 w-5" />
        </button>
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => {
            onInput(e)
            const v = e.target.value
            if (!v) {
              setResults([])
              setResultsOpen(false)
              return
            }
            const q = v.trim().toLowerCase()
            const empMatches = employees.filter((x) => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q)).slice(0,4).map((x) => ({ type: 'employee', id: x.id, title: x.name, subtitle: x.designation }))
            const clientMatches = clients.filter((c) => c.company.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)).slice(0,3).map((c) => ({ type: 'client', id: c.id, title: c.company, subtitle: c.contactPerson }))
            const taskMatches = tasks.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)).slice(0,3).map((t) => ({ type: 'task', id: t.id, title: t.name, subtitle: t.client }))
            const pages = [
              { type: 'page', id: 'analytics', title: 'Analytics', route: '/analytics' },
              { type: 'page', id: 'incentives', title: 'Incentives', route: '/incentives' },
              { type: 'page', id: 'tasks', title: 'Tasks', route: '/tasks' },
              { type: 'page', id: 'clients', title: 'Clients', route: '/clients' },
            ]
            const pageMatches = pages.filter(p => p.title.toLowerCase().includes(q)).slice(0,3).map(p => ({ type: 'page', id: p.id, title: p.title, route: p.route }))
            const combined = [...empMatches, ...taskMatches, ...clientMatches]
            const all = [...pageMatches, ...combined]
            setResults(all)
            setResultsOpen(all.length > 0)
          }}
          className="h-11 w-full rounded-lg border border-line bg-surface pl-12 pr-4 text-base text-ink placeholder:text-ink-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
            style={{ paddingTop: 10, paddingBottom: 10, fontSize: 15 }}
          ref={inputRef}
        />
        {resultsOpen && (
          <div className="absolute left-0 right-0 mt-2 z-50">
            <Card>
              <div className="p-2">
                {results.length === 0 ? (
                  <div className="p-2 text-sm text-ink-muted">No results found</div>
                ) : results.map((r) => (
                  <div key={`${r.type}-${r.id}`} className="p-2 rounded-md hover:bg-surface-muted cursor-pointer" onClick={() => {
                    setResultsOpen(false)
                    try { window.dispatchEvent(new CustomEvent('app:search', { detail: '' })) } catch {}
                    const isLead = window.location.pathname.startsWith('/lead') || userRole === 'Team Lead'
                    if (r.type === 'employee') navigate(isLead ? `/lead/employees/${r.id}` : `/employees/${r.id}`)
                    if (r.type === 'client') navigate(isLead ? `/lead/clients/${r.id}` : `/clients/${r.id}`)
                    if (r.type === 'task') navigate(isLead ? `/lead/tasks` : `/tasks/${r.id}`)
                    if (r.type === 'page') navigate(isLead ? `/lead/${r.id}` : r.route)
                    if (r.type === 'incentive') navigate(isLead ? `/lead/incentives` : '/incentives')
                  }}>
                    <div className="text-sm font-bold">{r.title}</div>
                    <div className="text-xs text-ink-muted">{r.subtitle}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <div className="ml-auto hidden md:flex items-center gap-4">
        <div className="relative">
          <button onClick={() => setNotifOpen((s) => !s)} className="text-ink-soft transition-colors hover:text-ink" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          {notifOpen && (
            <div ref={notifRef} className="absolute right-0 mt-2 w-80 z-50">
              <Card>
                <div className="p-3">
                  <div className="text-sm font-semibold">Notifications</div>
                          <div className="mt-2 space-y-2">
                            {sampleNotifications.map((n) => (
                              <div key={n.id} className={`rounded-md p-2 hover:bg-surface-muted flex justify-between ${n.read ? 'opacity-60' : ''}`}>
                                <div onClick={() => {
                                  // navigate based on target
                                  if (n.target) {
                                    if (n.target.type === 'employee') navigate(`/employees/${n.target.id}`)
                                    if (n.target.type === 'client') navigate(`/clients/${n.target.id}`)
                                    if (n.target.type === 'task') navigate(`/tasks/${n.target.id}`)
                                  }
                                  n.read = true
                                  setNotifOpen(false)
                                  toast({ type: 'info', message: 'Opened notification' })
                                }} style={{ cursor: 'pointer' }}>
                                  <div className="text-sm font-bold">{n.title}</div>
                                  <div className="text-xs text-ink-muted">{n.desc}</div>
                                  <div className="text-xs text-ink-soft mt-1">{n.time}</div>
                                </div>
                                {!n.read ? <div className="text-xs text-amber" style={{ marginLeft: 8 }}>●</div> : null}
                              </div>
                            ))}
                          </div>
                  <div className="mt-3 text-right">
                    <Button variant="ghost" onClick={() => setNotifOpen(false)}>Close</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="relative">
          <button className="text-ink-soft cursor-default" aria-label="Settings" style={{ pointerEvents: 'none' }}>
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <button onClick={() => setHelpOpen((s) => !s)} className="text-ink-soft transition-colors hover:text-ink" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </button>
          {helpOpen && (
            <div ref={helpRef} className="absolute right-0 mt-2 w-96 z-50">
              <div className="fixed inset-0 z-40" />
              <Card>
                <div className="p-4">
                  <div className="text-lg font-semibold">Help</div>
                  <div className="mt-2 text-sm text-ink-muted">No help page found. This is a placeholder.</div>
                  <div className="mt-3 text-right"><Button variant="ghost" onClick={() => setHelpOpen(false)}>Close</Button></div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <span className="h-6 w-px bg-line" />
        <div className="relative">
          <button onClick={() => setSupportOpen(true)} className="text-sm font-semibold text-gold-dark">Support</button>
          {supportOpen && (
            <div ref={supportRef} className="absolute right-0 mt-2 w-80 z-50">
              <div className="fixed inset-0 z-40" />
              <Card>
                <div className="p-4">
                  <div className="text-lg font-semibold">Support</div>
                  <div className="mt-2 text-sm">Email: support@complianceos.com</div>
                  <div className="text-sm">Contact: +91 1800 123 456</div>
                  <div className="mt-3 text-right"><Button variant="ghost" onClick={() => setSupportOpen(false)}>Close</Button></div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="relative">
          <div onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-3 pl-1 cursor-pointer">
            <div className="text-right">
              <p className="text-sm font-bold leading-tight text-ink">{userName}</p>
              <p className="text-xs text-ink-muted">{userRole}</p>
            </div>
            <Avatar name={userName} size={38} className="ring-2 ring-amber/40" />
          </div>
          {profileOpen && (
            <div ref={profileRef} className="absolute right-0 mt-2 w-40 z-50">
              <Card>
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 text-sm" onClick={() => { setProfileOpen(false); if (userRole === 'Team Lead') navigate('/lead/settings'); else alert('Profile placeholder') }}>Profile</button>
                  {userRole === 'Team Lead' && (
                    <button className="w-full text-left px-3 py-2 text-sm" onClick={() => { setProfileOpen(false); navigate('/lead/settings') }}>Settings</button>
                  )}
                  <button className="w-full text-left px-3 py-2 text-sm" onClick={() => setConfirmOpen(true)}>Logout</button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </header>
    <Toasts />
    <ConfirmModal
      open={confirmOpen}
      title="Logout"
      message="Are you sure you want to log out?"
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false)
        logout()
        toast({ type: 'success', message: 'You have been logged out' })
        navigate('/login')
      }}
    />
    </>
  )
}
