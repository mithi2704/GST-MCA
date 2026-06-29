import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'
import { trackingService } from '@/services/trackingService'
import { AlertCircle } from 'lucide-react'

interface StatCard {
  id: string
  label: string
  value: string
  iconBg: string
  icon: React.ReactNode
}

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

const PAGE_SIZE = 4

const mapBackendToExecutive = (emp: any): Executive => {
  // Compute initials
  const nameParts = emp.name.trim().split(/\s+/);
  const initials = nameParts.length > 1
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : nameParts[0] ? nameParts[0][0].toUpperCase() : '';

  // Deterministic color
  const colors = ['#b89047', '#3d7cf0', '#2bb673', '#8a8fa3', '#b85f47', '#833df0', '#f03da1'];
  const color = colors[emp.id % colors.length];

  // Formatting times
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '---';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '---';
    }
  };

  const checkIn = formatTime(emp.checkInTime);
  const checkOut = formatTime(emp.checkOutTime);

  // checkInStatus and checkInOk
  let checkInStatus = '';
  let checkInOk: boolean | null = null;
  if (emp.trackingStatus === 'LATE') {
    checkInStatus = 'Late';
    checkInOk = false;
  } else if (emp.trackingStatus === 'CHECKED_IN' || emp.trackingStatus === 'CHECKED_OUT') {
    checkInStatus = 'On Time';
    checkInOk = true;
  }

  // Location address and icon
  let location = 'Residential Address';
  let locationIcon: LocationIcon = 'home';

  if (emp.trackingStatus === 'CHECKED_OUT') {
    location = emp.location?.checkOutAddress || emp.location?.checkInAddress || 'Residential Address';
    locationIcon = 'pin';
  } else if (emp.trackingStatus === 'CHECKED_IN') {
    location = emp.location?.checkInAddress || 'Cyber City, Hub 4';
    locationIcon = 'pin';
  } else if (emp.trackingStatus === 'LATE') {
    location = emp.location?.checkInAddress || 'En-route Sector 62';
    locationIcon = 'warning';
  }

  // Status mapping
  let status = 'OFFLINE';
  let statusClass: StatusClass = 'status-offline';

  if (emp.trackingStatus === 'CHECKED_IN' || emp.trackingStatus === 'LATE') {
    status = 'ON SITE';
    statusClass = 'status-onsite';
  }

  return {
    id: String(emp.id),
    name: emp.name,
    initials,
    color,
    checkIn,
    checkInStatus,
    checkInOk,
    checkOut,
    location,
    locationIcon,
    status,
    statusClass
  };
};

export default function EmployeeTracking() {
  const navigate = useNavigate()
  const [backendData, setBackendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchTrackingData = async (showToast = false) => {
    try {
      if (!showToast) {
        setLoading(true);
      }
      setError(null);
      const data = await trackingService.getTrackingRows();
      setBackendData(data || []);
      if (showToast) {
        toast({ message: 'Tracking data updated successfully', type: 'success' });
      }
    } catch (err: any) {
      console.error('Error fetching tracking data:', err);
      setError(err.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const rows = useMemo(() => {
    return backendData.map(mapBackendToExecutive);
  }, [backendData]);

  const stats = useMemo(() => {
    if (backendData.length === 0) {
      return {
        checkedIn: '0/0',
        lateArrival: '00',
        activeRoutes: '00',
        avgProductivity: '0.0%'
      };
    }
    const checkedInCount = backendData.filter(e => e.trackingStatus === 'CHECKED_IN' || e.trackingStatus === 'LATE').length;
    const totalCount = backendData.length;
    
    const lateCount = backendData.filter(e => e.trackingStatus === 'LATE').length;
    const activeCount = backendData.filter(e => e.currentTask !== null).length;
    const avgProductivity = (backendData.reduce((acc, e) => acc + e.attendancePct, 0) / totalCount).toFixed(1) + '%';

    return {
      checkedIn: `${checkedInCount}/${totalCount}`,
      lateArrival: String(lateCount).padStart(2, '0'),
      activeRoutes: String(activeCount).padStart(2, '0'),
      avgProductivity
    };
  }, [backendData]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [rows.length, totalPages, currentPage]);

  const handleExportLog = () => {
    const exportData = rows.map((exec) => ({
      'Employee ID': exec.id,
      Name: exec.name,
      'Check-In Time': exec.checkIn,
      'Check-In Status': exec.checkInStatus || 'N/A',
      'Check-Out Time': exec.checkOut,
      Location: exec.location,
      Status: exec.status,
    }))
    downloadCsv(exportData, 'employee_tracking_log.csv')
    toast({ message: 'Tracking log exported successfully', type: 'success' })
  }

  const handleSyncDashboard = () => {
    fetchTrackingData(true)
  }

  const handleSyncReload = () => {
    fetchTrackingData(true)
  }

  const paginatedExecutives = useMemo(() => {
    return rows.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );
  }, [rows, currentPage]);

  const onlineCount = useMemo(() => {
    return backendData.filter(e => e.trackingStatus === 'CHECKED_IN' || e.trackingStatus === 'LATE').length;
  }, [backendData]);

  const offlineCount = useMemo(() => {
    return backendData.filter(e => e.trackingStatus === 'OFFLINE' || e.trackingStatus === 'CHECKED_OUT').length;
  }, [backendData]);

  const statCards: StatCard[] = [
    {
      id: 'checkedIn',
      label: 'CHECKED IN',
      value: stats.checkedIn,
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
      value: stats.lateArrival,
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
      value: stats.activeRoutes,
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
      value: stats.avgProductivity,
      iconBg: '#fdf3e1',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b89047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
  ]

  return (
    <div className="tracking-page-v2">
      <div className="tracking-header-row">
        <div>
          <h2 className="tracking-page-title">Real-time Employee Tracking</h2>
          <p className="tracking-page-subtitle">
            {backendData.length > 0
              ? `Live operational status of ${backendData.length} field executives across the city.`
              : 'Live operational status of field executives.'}
          </p>
        </div>
        <div className="tracking-header-actions">
          <button className="tracking-btn-outline" onClick={handleExportLog} disabled={loading || rows.length === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Log
          </button>
          <button className="tracking-btn-gold" onClick={handleSyncDashboard} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-1"><Spinner size={12} /> Syncing...</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Sync Dashboard
              </>
            )}
          </button>
        </div>
      </div>

      {loading && backendData.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 border border-red-200 bg-red-50 rounded-lg text-red-700 my-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => fetchTrackingData(false)} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">
            Retry Action
          </button>
        </div>
      ) : (
        <>
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
                  <span className="tracking-dot online" /> {onlineCount} Online
                </span>
                <span className="tracking-badge tracking-badge-offline">
                  <span className="tracking-dot offline-yellow" /> {offlineCount} Offline
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="tracking-exec-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th><th>CHECK-IN</th><th>CHECK-OUT</th>
                    <th>LOCATION</th><th>STATUS</th><th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: '#8a8fa3' }}>
                        No employee tracking data available.
                      </td>
                    </tr>
                  ) : (
                    paginatedExecutives.map((exec) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {rows.length > 0 && (
              <div className="tracking-table-footer">
                <span className="tracking-showing">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length} employees
                </span>
                <div className="tracking-pagination">
                  <button className="tracking-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`tracking-page-btn ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  ))}
                  <button className="tracking-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Reload Button */}
      <button className="tracking-fab" aria-label="Sync tracking data" onClick={handleSyncReload} disabled={loading}>
        {loading ? (
          <Spinner size={20} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        )}
      </button>
    </div>
  )
}
