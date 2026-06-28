import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'

interface TopEmployee {
  rank: number
  name: string
  avatar: string
  designation: string
  tasks: number
  efficiency: string
  trend: 'up' | 'down' | 'neutral'
}

const topEmployees: TopEmployee[] = [
  { rank: 1, name: 'Jane Doe', avatar: 'JD', designation: 'Senior Developer', tasks: 142, efficiency: '98%', trend: 'up' },
  { rank: 2, name: 'Michael Smith', avatar: 'MS', designation: 'UX Designer', tasks: 120, efficiency: '95%', trend: 'up' },
  { rank: 3, name: 'Emily Chen', avatar: 'EC', designation: 'QA Engineer', tasks: 135, efficiency: '92%', trend: 'down' },
  { rank: 4, name: 'David Lee', avatar: 'DL', designation: 'Backend Dev', tasks: 110, efficiency: '90%', trend: 'neutral' },
]

interface TaskDomain {
  domain: string
  percentage: number
  color: string
}

const taskDomains: TaskDomain[] = [
  { domain: 'Software Development', percentage: 42, color: '#b89047' },
  { domain: 'Marketing Strategy', percentage: 28, color: '#b89047' },
  { domain: 'Client Onboarding', percentage: 18, color: '#b89047' },
  { domain: 'Internal Ops', percentage: 12, color: '#b89047' },
]

export default function Reports() {
  const navigate = useNavigate()
  const handleExport = () => {
    const rows = topEmployees.map((emp) => ({
      Rank: emp.rank,
      Name: emp.name,
      Designation: emp.designation,
      'Tasks Completed': emp.tasks,
      Efficiency: emp.efficiency,
      Trend: emp.trend,
    }))
    downloadCsv(rows, 'team_analytics_report.csv')
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header-row">
        <div>
          <h2 className="analytics-page-title">Team Analytics Overview</h2>
          <p className="analytics-page-subtitle">Real-time productivity distribution and operational performance tracking.</p>
        </div>
        <div className="analytics-header-actions">
          <button className="analytics-btn-outline" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
          <button className="analytics-btn-gold" onClick={() => toast({ message: 'Analytics data updated successfully', type: 'success' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.28l5.67-5.67" />
            </svg>
            Update Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="analytics-stats-row">
        <div className="analytics-stat-card">
          <div className="analytics-stat-header">
            <span className="analytics-stat-label">EFFICIENCY INDEX</span>
            <span className="analytics-stat-icon-gold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </span>
          </div>
          <div className="analytics-stat-value">94.2%</div>
          <div className="analytics-stat-trend up">↑ +2.4% vs last week</div>
          <div className="analytics-progress-track">
            <div className="analytics-progress-fill" style={{ width: '94.2%' }} />
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-header">
            <span className="analytics-stat-label">TEAM MILESTONES</span>
            <span className="analytics-stat-icon-gold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10M6 4v6a6 6 0 0 0 12 0V4M3 4h3M18 4h3"/></svg>
            </span>
          </div>
          <div className="analytics-stat-value">28/32</div>
          <div className="analytics-stat-desc">Q3 Objectives Status</div>
          <div className="analytics-avatar-group">
            <div className="analytics-avatar" style={{ background: '#3d7cf0' }}>JD</div>
            <div className="analytics-avatar" style={{ background: '#2bb673', marginLeft: '-10px' }}>MS</div>
            <div className="analytics-avatar" style={{ background: '#e0941a', marginLeft: '-10px' }}>EC</div>
            <div className="analytics-avatar-more" style={{ marginLeft: '-10px' }}>+12</div>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-header">
            <span className="analytics-stat-label">AVG RESOLUTION TIME</span>
            <span className="analytics-stat-icon-gold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
          </div>
          <div className="analytics-stat-value">1.4h</div>
          <div className="analytics-stat-trend down">↓ -0.2h optimization needed</div>
          <div className="analytics-mini-chart">
            {[40, 60, 50, 80, 70, 100].map((h, i) => (
              <div key={i} className="analytics-mini-bar" style={{ height: `${h}%`, background: i === 5 ? '#b89047' : undefined }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="analytics-chart-card">
        <div className="analytics-chart-header">
          <h3 className="analytics-card-title">Performance Trends (Operational Flow vs. Target)</h3>
          <div className="analytics-chart-legend">
            <div className="analytics-legend-item">
              <span className="analytics-legend-color" style={{ background: '#b89047' }} />
              Operational Flow
            </div>
            <div className="analytics-legend-item">
              <span className="analytics-legend-color" style={{ background: '#d0d3df' }} />
              Target Baseline
            </div>
          </div>
        </div>
        <div className="analytics-chart-area">
          <svg width="100%" height="240" preserveAspectRatio="none" viewBox="0 0 1000 240">
            <line x1="0" y1="60" x2="1000" y2="60" stroke="#f0f2f8" strokeWidth="1" />
            <line x1="0" y1="120" x2="1000" y2="120" stroke="#f0f2f8" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="180" x2="1000" y2="180" stroke="#f0f2f8" strokeWidth="1" />
            <path d="M 0 160 L 100 150 L 200 170 L 300 160 L 400 155 L 500 145 L 600 140 L 700 130 L 800 120 L 900 125 L 1000 115" fill="none" stroke="#d0d3df" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M 0 160 L 100 150 L 200 170 L 300 160 L 400 155 L 500 145 L 600 140 L 700 130 L 800 120 L 900 125 L 1000 115 L 1000 240 L 0 240 Z" fill="rgba(240, 242, 248, 0.5)" />
            <path d="M 0 180 L 100 190 L 200 160 L 300 130 L 400 150 L 500 120 L 600 100 L 700 110 L 800 90 L 900 80 L 1000 90" fill="none" stroke="#b89047" strokeWidth="3" />
            <circle cx="500" cy="120" r="4" fill="#b89047" />
            <circle cx="800" cy="90" r="4" fill="#b89047" />
            {['WK 01','WK 02','WK 03','WK 04','WK 05','WK 06','WK 07','WK 08','WK 09','WK 10'].map((wk, i) => (
              <text key={wk} x={i * 100} y="230" fill="#8a8fa3" fontSize="12" fontWeight="600">{wk}</text>
            ))}
          </svg>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="analytics-bottom-grid">
        <div className="analytics-table-card">
          <div className="analytics-card-header-row">
            <h3 className="analytics-card-title">Top Performing Employees</h3>
            <button className="analytics-link-btn" onClick={() => navigate('/lead/incentives')}>Full Leaderboard</button>
          </div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th><th>DESIGNATION</th>
                <th>TASKS COMPLETED</th><th>EFFICIENCY</th><th>TREND</th>
              </tr>
            </thead>
            <tbody>
              {topEmployees.map((emp) => (
                <tr key={emp.rank}>
                  <td>
                    <div className="analytics-emp-cell">
                      <div className="analytics-emp-avatar">{emp.avatar}</div>
                      <span>{emp.name}</span>
                    </div>
                  </td>
                  <td>{emp.designation}</td>
                  <td className="analytics-bold">{emp.tasks}</td>
                  <td className="analytics-efficiency">{emp.efficiency}</td>
                  <td>
                    {emp.trend === 'up' && <span className="analytics-trend-up">↗</span>}
                    {emp.trend === 'down' && <span className="analytics-trend-down">↘</span>}
                    {emp.trend === 'neutral' && <span className="analytics-trend-neutral">→</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="analytics-domain-card">
          <h3 className="analytics-card-title">Task Domain Distribution</h3>
          <div className="analytics-domain-list">
            {taskDomains.map((domain) => (
              <div className="analytics-domain-item" key={domain.domain}>
                <div className="analytics-domain-header">
                  <span className="analytics-domain-name">{domain.domain}</span>
                  <span className="analytics-domain-percent">{domain.percentage}%</span>
                </div>
                <div className="analytics-domain-track">
                  <div className="analytics-domain-fill" style={{ width: `${domain.percentage}%`, background: domain.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
