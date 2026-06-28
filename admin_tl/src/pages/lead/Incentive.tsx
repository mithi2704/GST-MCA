import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'

interface LeaderboardRow {
  rank: number
  name: string
  avatar: string
  attainment: number
  trend: 'up' | 'neutral'
  estimated: string
}

const leaderboardData: LeaderboardRow[] = [
  { rank: 1, name: 'Sarah Jenkins', avatar: 'SJ', attainment: 112, trend: 'up', estimated: '$12,450.00' },
  { rank: 2, name: 'David Chen', avatar: 'DC', attainment: 105, trend: 'up', estimated: '$10,800.00' },
  { rank: 3, name: 'Marcus Thorne', avatar: 'MT', attainment: 98, trend: 'neutral', estimated: '$9,200.00' },
]

interface Validation {
  id: string
  type: string
  claimedBy: string
  amount: string
  color: string
}

const pendingValidations: Validation[] = [
  { id: '#6821', type: 'Direct Sales Commission', claimedBy: 'Emily Watson', amount: '$450.00', color: '#e0941a' },
  { id: '#8845', type: 'Upsell Multiplier', claimedBy: 'Jordan Lee', amount: '$1,200.00', color: '#3d7cf0' },
  { id: '#8790', type: 'Annual Retention', claimedBy: 'Sarah Jenkins', amount: '$3,500.00', color: '#2bb673' },
]

interface BarData { month: string; base: number; highlight: boolean }

const barChartData: BarData[] = [
  { month: 'May', base: 55, highlight: false },
  { month: 'Jun', base: 70, highlight: false },
  { month: 'Jul', base: 60, highlight: false },
  { month: 'Aug', base: 75, highlight: false },
  { month: 'Sep', base: 65, highlight: false },
  { month: 'Oct', base: 88, highlight: true },
]

const poolAllocations = [
  { label: 'Direct Sales', percent: 55 },
  { label: 'Upsell Actions', percent: 30 },
  { label: 'Retention Bonus', percent: 15 },
]

export default function Incentive() {
  const navigate = useNavigate()
  const [approvedIds, setApprovedIds] = useState<string[]>([])

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id])
    toast({ message: `Payout validation ${id} approved successfully`, type: 'success' })
  }

  const handleExport = () => {
    const rows = leaderboardData.map((row) => ({
      Rank: row.rank,
      Name: row.name,
      Attainment: `${row.attainment}%`,
      'Estimated Payout': row.estimated,
    }))
    downloadCsv(rows, 'incentive_performance_report.csv')
  }

  return (
    <div className="incentive-page">
      <div className="incentive-page-header">
        <div>
          <h2 className="incentive-page-title">Team Incentive Performance</h2>
          <p className="incentive-page-subtitle">Real-time tracking of quarterly payouts and individual performance metrics.</p>
        </div>
        <div className="incentive-header-actions">
          <button className="btn-outline-dark" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="incentive-stats-row">
        <div className="incentive-stat-card">
          <div className="incentive-stat-card-header">
            <span className="incentive-stat-label">TOTAL INCENTIVE POOL</span>
            <span className="incentive-stat-icon incentive-stat-icon-gold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></svg>
            </span>
          </div>
          <div className="incentive-stat-value">$142,500.00</div>
          <div className="incentive-stat-change incentive-stat-up">↑ 12.5% vs Last Month</div>
        </div>

        <div className="incentive-stat-card">
          <div className="incentive-stat-card-header">
            <span className="incentive-stat-label">PAYOUT READINESS</span>
            <span className="incentive-stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </span>
          </div>
          <div className="incentive-stat-value">88.4%</div>
          <div className="incentive-payout-bar-track">
            <div className="incentive-payout-bar-fill" style={{ width: '88.4%' }} />
          </div>
        </div>

        <div className="incentive-stat-card">
          <div className="incentive-stat-card-header">
            <span className="incentive-stat-label">NEXT PAYOUT DATE</span>
            <span className="incentive-stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </span>
          </div>
          <div className="incentive-stat-value incentive-stat-value-sm">Oct 30, 2023</div>
          <div className="incentive-stat-sublabel">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            12 Days Remaining
          </div>
        </div>
      </div>

      {/* Chart & Pool Allocation */}
      <div className="incentive-mid-grid">
        <div className="incentive-chart-card">
          <div className="incentive-chart-header">
            <h3 className="incentive-card-title">Monthly Incentive Distribution</h3>
            <span className="incentive-chart-period">Last 6 Months ▼</span>
          </div>
          <div className="incentive-bar-chart">
            {barChartData.map((bar) => (
              <div className="incentive-bar-col" key={bar.month}>
                <div className="incentive-bar-wrapper">
                  <div className={`incentive-bar ${bar.highlight ? 'incentive-bar-highlighted' : ''}`} style={{ height: `${bar.base}%` }} />
                </div>
                <span className="incentive-bar-label">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="incentive-pool-card">
          <h3 className="incentive-card-title incentive-pool-title">Pool Allocation</h3>
          <div className="incentive-pool-bars">
            {poolAllocations.map((item) => (
              <div className="incentive-pool-row" key={item.label}>
                <div className="incentive-pool-row-header">
                  <span className="incentive-pool-label">{item.label}</span>
                  <span className="incentive-pool-percent">{item.percent}%</span>
                </div>
                <div className="incentive-pool-track">
                  <div className="incentive-pool-fill" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="incentive-pool-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
            Allocations are adjusted based on Q4 priority goals for retainers.
          </div>
        </div>
      </div>

      {/* Leaderboard & Pending Validations */}
      <div className="incentive-bottom-grid">
        <div className="incentive-leaderboard-card">
          <div className="incentive-card-header-row">
            <h3 className="incentive-card-title">Team Incentive Leaderboard</h3>
            <button className="incentive-link-btn" onClick={() => navigate('/lead/incentives')}>View Full Rank</button>
          </div>
          <table className="incentive-leader-table">
            <thead>
              <tr><th>RANK</th><th>MEMBER</th><th>ATTAINMENT</th><th>ESTIMATED INCENTIVE</th></tr>
            </thead>
            <tbody>
              {leaderboardData.map((row) => (
                <tr key={row.rank}>
                  <td><span className={`incentive-rank-badge incentive-rank-${row.rank}`}>{row.rank}</span></td>
                  <td>
                    <div className="incentive-member-cell">
                      <div className="incentive-member-avatar">{row.avatar}</div>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="incentive-attainment">
                      {row.attainment}%
                      {row.trend === 'up' && <span className="incentive-trend-up"> ↑</span>}
                      {row.trend === 'neutral' && <span className="incentive-trend-neutral"> →</span>}
                    </span>
                  </td>
                  <td className="incentive-estimate">{row.estimated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="incentive-validations-card">
          <div className="incentive-card-header-row">
            <h3 className="incentive-card-title">Pending Payout Validations</h3>
            <span className="incentive-required-badge">4 Required</span>
          </div>
          <div className="incentive-validation-list">
            {pendingValidations.map((v) => (
              <div className="incentive-validation-item" key={v.id}>
                <div className="incentive-validation-header">
                  <span className="incentive-validation-type">{v.type} – ID {v.id}</span>
                  <span className="incentive-validation-amount">{v.amount}</span>
                </div>
                <div className="incentive-validation-claimer">Claimed by: {v.claimedBy}</div>
                <div className="incentive-validation-actions">
                  <button
                    className={`incentive-approve-btn ${approvedIds.includes(v.id) ? 'approved' : ''}`}
                    onClick={() => handleApprove(v.id)}
                    disabled={approvedIds.includes(v.id)}
                  >
                    {approvedIds.includes(v.id) ? 'Approved ✓' : 'Approve'}
                  </button>
                  <button className="incentive-review-btn">Review</button>
                </div>
              </div>
            ))}
          </div>
          <button className="incentive-view-all-btn">View All Pending Claims</button>
        </div>
      </div>
    </div>
  )
}
