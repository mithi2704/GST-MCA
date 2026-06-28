import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'

interface StatCard {
  id: string
  label: string
  value: string
  iconBg: string
  icon: React.ReactNode
}

const statCards: StatCard[] = [
  {
    id: 'checkedIn',
    label: 'CHECKED IN',
    value: '11/12',
    iconBg: '#e7f7ed',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2bb673" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'lateArrival',
    label: 'LATE ARRIVAL',
    value: '02',
    iconBg: '#fff4e0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0941a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'activeRoutes',
    label: 'ACTIVE ROUTES',
    value: '08',
    iconBg: '#e8f0fe',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3d7cf0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
  {
    id: 'avgProductivity',
    label: 'AVG PRODUCTIVITY',
    value: '94.2%',
    iconBg: '#fdf3e1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b89047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
]

type LocationIcon = 'pin' | 'warning' | 'home'
type StatusClass = 'status-onsite' | 'status-transit' | 'status-offline'

interface Executive {
  id: string
  name: string
  initials: string
  color: string
  checkIn: string
  checkInStatus: string
  checkInOk: boolean | null
  checkOut: string
  location: string
  locationIcon: LocationIcon
  status: string
  statusClass: StatusClass
}

const executives: Executive[] = [
  // Page 1
  { id: 'EMP-1042', name: 'Sarah Jenkins', initials: 'SJ', color: '#b89047', checkIn: '08:45 AM', checkInStatus: 'On Time', checkInOk: true, checkOut: '---', location: 'Cyber City, Hub 4', locationIcon: 'pin', status: 'ON SITE', statusClass: 'status-onsite' },
  { id: 'EMP-1043', name: 'Rahul Verma', initials: 'RV', color: '#3d7cf0', checkIn: '08:12 AM', checkInStatus: 'Late (12m)', checkInOk: false, checkOut: '---', location: 'En-route Sector 62', locationIcon: 'warning', status: 'TRANSIT', statusClass: 'status-transit' },
  { id: 'EMP-1044', name: 'Meera Patel', initials: 'MP', color: '#2bb673', checkIn: '08:55 AM', checkInStatus: 'On Time', checkInOk: true, checkOut: '---', location: 'DLF Phase 2', locationIcon: 'pin', status: 'ON SITE', statusClass: 'status-onsite' },
  { id: 'EMP-1045', name: 'Sanjay Kumar', initials: 'SK', color: '#8a8fa3', checkIn: '---', checkInStatus: '', checkInOk: null, checkOut: '---', location: 'Residential Address', locationIcon: 'home', status: 'OFFLINE', statusClass: 'status-offline' },
  // Page 2
  { id: 'EMP-1046', name: 'John Doe', initials: 'JD', color: '#b89047', checkIn: '09:05 AM', checkInStatus: 'Late (5m)', checkInOk: false, checkOut: '---', location: 'Gachibowli office', locationIcon: 'pin', status: 'ON SITE', statusClass: 'status-onsite' },
  { id: 'EMP-1047', name: 'Sarah Miller', initials: 'SM', color: '#3d7cf0', checkIn: '08:30 AM', checkInStatus: 'On Time', checkInOk: true, checkOut: '---', location: 'Transit Metro Station', locationIcon: 'pin', status: 'TRANSIT', statusClass: 'status-transit' },
  { id: 'EMP-1048', name: 'Robert Wilson', initials: 'RW', color: '#2bb673', checkIn: '08:50 AM', checkInStatus: 'On Time', checkInOk: true, checkOut: '---', location: 'DLF Cyber Park', locationIcon: 'pin', status: 'ON SITE', statusClass: 'status-onsite' },
  { id: 'EMP-1049', name: 'Anita Kumar', initials: 'AK', color: '#8a8fa3', checkIn: '---', checkInStatus: '', checkInOk: null, checkOut: '---', location: 'Residential Address', locationIcon: 'home', status: 'OFFLINE', statusClass: 'status-offline' },
  // Page 3
  { id: 'EMP-1050', name: 'David Chen', initials: 'DC', color: '#b89047', checkIn: '08:48 AM', checkInStatus: 'On Time', checkInOk: true, checkOut: '---', location: 'Infotech Park', locationIcon: 'pin', status: 'ON SITE', statusClass: 'status-onsite' },
  { id: 'EMP-1051', name: 'Sana Khan', initials: 'SK', color: '#3d7cf0', checkIn: '08:40 AM', checkInStatus: 'On Time', checkInOk: true, checkOut: '---', location: 'Expressway Route 2', locationIcon: 'pin', status: 'TRANSIT', statusClass: 'status-transit' },
  { id: 'EMP-1052', name: 'Vikram Patel', initials: 'VP', color: '#2bb673', checkIn: '09:15 AM', checkInStatus: 'Late (15m)', checkInOk: false, checkOut: '---', location: 'Adani Port office', locationIcon: 'pin', status: 'ON SITE', statusClass: 'status-onsite' },
  { id: 'EMP-1053', name: 'Amit Mishra', initials: 'AM', color: '#8a8fa3', checkIn: '---', checkInStatus: '', checkInOk: null, checkOut: '---', location: 'Residential Address', locationIcon: 'home', status: 'OFFLINE', statusClass: 'status-offline' },
]

const PAGES = 3
const PAGE_SIZE = 4

export default function EmployeeTracking() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)

  const handleExportLog = () => {
    const rows = executives.map((exec) => ({
      'Employee ID': exec.id,
      Name: exec.name,
      'Check-In Time': exec.checkIn,
      'Check-In Status': exec.checkInStatus || 'N/A',
      'Check-Out Time': exec.checkOut,
      Location: exec.location,
      Status: exec.status,
    }))
    downloadCsv(rows, 'employee_tracking_log.csv')
  }

  const handleSyncDashboard = () => {
    toast({ message: 'Dashboard synchronized successfully', type: 'success' })
  }

  const handleSyncReload = () => {
    toast({ message: 'Tracking data updated successfully', type: 'success' })
  }

  const paginatedExecutives = executives.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="tracking-page-v2">
      <div className="tracking-header-row">
        <div>
          <h2 className="tracking-page-title">Real-time Employee Tracking</h2>
          <p className="tracking-page-subtitle">Live operational status of 12 field executives across the city.</p>
        </div>
        <div className="tracking-header-actions">
          <button className="tracking-btn-outline" onClick={handleExportLog}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Log
          </button>
          <button className="tracking-btn-gold" onClick={handleSyncDashboard}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="tracking-stat-cards">
        {statCards.map((card) => (
          <div className="tracking-stat-card" key={card.id}>
            <div className="tracking-stat-icon-box" style={{ background: card.iconBg }}>
              {card.icon}
            </div>
            <div className="tracking-stat-info">
              <span className="tracking-stat-label">{card.label}</span>
              <span className="tracking-stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Status Feed */}
      <div className="tracking-feed-card">
        <div className="tracking-feed-header">
          <h3 className="tracking-feed-title">Executive Status Feed</h3>
          <div className="tracking-feed-badges">
            <span className="tracking-badge tracking-badge-online">
              <span className="tracking-dot online" /> 8 Online
            </span>
            <span className="tracking-badge tracking-badge-offline">
              <span className="tracking-dot offline-yellow" /> 3 Offline
            </span>
          </div>
        </div>

        <table className="tracking-exec-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th><th>CHECK-IN</th><th>CHECK-OUT</th>
              <th>LOCATION</th><th>STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExecutives.map((exec) => (
              <tr key={exec.id}>
                <td>
                  <div className="tracking-exec-cell">
                    <div className="tracking-exec-avatar" style={{ background: exec.color }}>{exec.initials}</div>
                    <div className="tracking-exec-info">
                      <span className="tracking-exec-name">{exec.name}</span>
                      <span className="tracking-exec-id">ID: {exec.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="tracking-checkin-cell">
                    <span className="tracking-checkin-time">{exec.checkIn}</span>
                    {exec.checkInStatus && (
                      <span className={`tracking-checkin-status ${exec.checkInOk ? 'on-time' : 'late'}`}>
                        {exec.checkInStatus}
                      </span>
                    )}
                  </div>
                </td>
                <td className="tracking-checkout">{exec.checkOut}</td>
                <td>
                  <div className="tracking-location-cell">
                    {exec.locationIcon === 'pin' && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8fa3" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    )}
                    {exec.locationIcon === 'warning' && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e0941a" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    )}
                    {exec.locationIcon === 'home' && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8fa3" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    )}
                    <span>{exec.location}</span>
                  </div>
                </td>
                <td>
                  <span className={`tracking-status-pill ${exec.statusClass}`}>{exec.status}</span>
                </td>
                <td>
                  <button className="tracking-action-arrow" aria-label="View employee details" onClick={() => navigate(`/lead/employees/${exec.id}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tracking-table-footer">
          <span className="tracking-showing">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, executives.length)} of {executives.length} employees
          </span>
          <div className="tracking-pagination">
            <button className="tracking-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            {Array.from({ length: PAGES }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`tracking-page-btn ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="tracking-page-btn" onClick={() => setCurrentPage((p) => Math.min(PAGES, p + 1))} disabled={currentPage === PAGES}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Reload Button */}
      <button className="tracking-fab" aria-label="Sync tracking data" onClick={handleSyncReload}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>
  )
}
