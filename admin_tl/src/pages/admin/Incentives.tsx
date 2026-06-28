import { Card, CardHeader } from "@/components/ui/Card"
import { KpiCard } from "@/components/ui/KpiCard"
import { Button } from "@/components/ui/Button"
import { Download, ChevronLeft, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useMemo, useState, useEffect } from "react"
import { employees as employeeData } from "@/data/employees"

export default function AdminIncentives() {
  const navigate = useNavigate()
  const [frozen, setFrozen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 5
  const [tick, setTick] = useState(0)

  useEffect(() => {
    function onChanged() { setTick((t) => t + 1) }
    window.addEventListener('employees:changed', onChanged as any)
    return () => window.removeEventListener('employees:changed', onChanged as any)
  }, [])

  // Helpers: calculations are derived from `src/data/employees`
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
    } catch {
      return `₹${value}`
    }
  }

  const kpis = useMemo(() => {
    // Reference tick to trigger recalculation on state change
    const _ = tick
    const active = employeeData.filter((e) => e.status === "Active")
    const totalMonthlyPayout = active.reduce((s, e) => s + (e.incentiveEarned || 0), 0)
    const avgScore = active.length ? active.reduce((s, e) => s + (e.score || 0), 0) / active.length : 0

    // Bonus criteria: derived threshold of score >= 90 (Grade A and above).
    // No explicit bonus rule exists in the data; using >=90 as documented below.
    const bonusThreshold = 90
    const calculatedBonuses = active.filter((e) => (e.score || 0) >= bonusThreshold).length

    // Payout rules: derived from UI grade cards (Grade A, B, C)
    const payoutRules = 3

    return {
      totalMonthlyPayout,
      avgScore,
      calculatedBonuses,
      payoutRules,
      bonusThreshold,
    }
  }, [tick])

  const displayedEmployees = useMemo(() => {
    // Reference tick to trigger recalculation on state change
    const _ = tick
    // Use the same source of truth as KPIs: Active employees only
    const active = employeeData.filter((e) => e.status === "Active")
    // Default sort: highest incentive first
    return active.slice().sort((a, b) => (b.incentiveEarned || 0) - (a.incentiveEarned || 0))
  }, [tick])
  const totalPages = Math.max(1, Math.ceil(displayedEmployees.length / pageSize))
  const pageItems = displayedEmployees.slice((page-1)*pageSize, page*pageSize)
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 800 }} className="tracking-tight text-ink">Incentive Management</h1>
          <p style={{ fontSize: 'var(--font-body)' }} className="mt-1 text-ink-soft">Monthly performance-based payouts and rules.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            style={{ height: 36, padding: '6px 12px', borderRadius: 8 }}
            onClick={() => navigate('/audit-log')}
          >
            <ShieldCheck size={16} /> Audit Log
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            style={{ height: 36, padding: '6px 12px', borderRadius: 8 }}
            onClick={() => {}}
            disabled={frozen}
          >
            <Download size={16} /> Export to PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <KpiCard label="Total Monthly Payout" value={formatCurrency(kpis.totalMonthlyPayout)} sub={`Active month: ${new Date().toLocaleString('en-US', { month: 'short' })} ${new Date().getFullYear()}`} className="lg:col-span-1" />
        <KpiCard label="Avg. Performance Score" value={`${kpis.avgScore.toFixed(1)}%`} sub="Consistent across teams" accent="info" className="lg:col-span-1" />
        <KpiCard label="Calculated Bonuses" value={`${kpis.calculatedBonuses}`} sub={`Score ≥ ${kpis.bonusThreshold}`} accent="warning" className="lg:col-span-1" />
        <KpiCard label="Payout Rules" value={`${kpis.payoutRules} rules`} sub="Grade-based thresholds" className="lg:col-span-1" />
      </div>

      <div className="mt-6">
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Employee Payout Details" action={null} />
                <div className="p-6">
                  <table className="w-full text-sm" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '36%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: '#F6F6F7', borderBottom: '1px solid #E8E8EA' }}>
                        <th style={{ padding: '16px 24px', textTransform: 'uppercase', color: '#8B8B8F', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Employee</th>
                        <th style={{ padding: '16px 24px', textTransform: 'uppercase', color: '#8B8B8F', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Employee ID</th>
                        <th style={{ padding: '16px 24px', textTransform: 'uppercase', color: '#8B8B8F', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Department</th>
                        <th style={{ padding: '16px 24px', textTransform: 'uppercase', color: '#8B8B8F', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Score</th>
                        <th style={{ padding: '16px 24px', textTransform: 'uppercase', color: '#8B8B8F', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>Incentive Earned</th>
                        <th style={{ padding: '16px 24px', textTransform: 'uppercase', color: '#8B8B8F', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: '#8B8B8F' }}>No employee payout records available.</td>
                        </tr>
                      ) : (
                        pageItems.map((e) => (
                          <tr key={e.id} style={{ borderBottom: '1px solid #ECECED' }}>
                            <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 9999, background: '#BDBDBD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, marginRight: 12, fontSize: 13 }}>{(e.name || '').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{e.name}</div>
                                  <div style={{ fontSize: 12, color: '#8B8B8F', marginTop: 4 }}>{e.designation || e.team || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', verticalAlign: 'middle', fontSize: 13, fontWeight: 600, color: '#6B6B6F' }}>{e.id}</td>
                            <td style={{ padding: '16px 24px', verticalAlign: 'middle', fontSize: 13, fontWeight: 600, color: '#6B6B6F' }}>{e.team || e.designation || '-'}</td>
                            <td style={{ padding: '16px 24px', verticalAlign: 'middle', fontSize: 14, fontWeight: 700, color: '#111827' }}>{typeof e.score === 'number' ? `${e.score}%` : '-'}</td>
                            <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(e.incentiveEarned || 0)}</td>
                            <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <div style={{ padding: '6px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600, display: 'inline-block', background: e.status === 'Active' ? '#E7FFF3' : '#FFF4E6', color: e.status === 'Active' ? '#087F5B' : '#B45309' }}>{e.status}</div>
                            </td>
                          </tr>
                        ))
                      )}
                      

                      <tr>
                        <td colSpan={6} style={{ padding: '12px 24px', borderTop: '1px solid #ECECED', background: 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ color: '#8B8B8F', fontSize: 13 }}>{`Showing ${pageItems.length} of ${displayedEmployees.length} records`}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E9E9EB', background: '#fff' }}><ChevronLeft size={16} /></button>
                              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))} style={{ padding: '6px 12px', borderRadius: 8, background: '#F5A623', color: '#111827', fontWeight: 700 }}>Next</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 6px 18px rgba(16,24,40,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Grade A</div>
                    <div style={{ fontSize: 12, color: '#8B8B8F' }}>Score 90 - 95</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#C8860D' }}>₹10,000</div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 6px 18px rgba(16,24,40,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Grade B</div>
                  <div style={{ fontSize: 12, color: '#8B8B8F' }}>Score 80 - 89</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#C8860D' }}>₹5,000</div>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 6px 18px rgba(16,24,40,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Grade C</div>
                  <div style={{ fontSize: 12, color: '#8B8B8F' }}>Score &lt; 80</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#6B6B6B' }}>₹0</div>
              </div>

              <div style={{ background: '#FEF6E7', borderLeft: '4px solid #F5A623', padding: 12, borderRadius: 8, color: '#5B4A2B' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="#5B4A2B" strokeWidth="1.2"/></svg>
                  Automation Logic
                </div>
                <div style={{ fontSize: 13 }}>The calculation is synced with the MCA Filing module and Task Completion rates. All scores are finalized on the 3rd of every month.</div>
              </div>

              <div style={{ background: '#111827', color: '#fff', borderRadius: 12, padding: 20, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>Payout Deadline</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#F5A623', marginTop: 8 }}>{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 3).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div>
                    {frozen ? (
                      <div style={{ background: '#3B0D0D', color: '#FFD1D1', padding: '6px 10px', borderRadius: 8, fontWeight: 700 }}>Records Frozen</div>
                    ) : null}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setFrozen((s) => !s)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #F5A623', background: frozen ? '#F5A623' : 'transparent', color: frozen ? '#111827' : '#F5A623', fontWeight: 700 }}>{frozen ? 'Unfreeze Records' : 'Freeze Records'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
