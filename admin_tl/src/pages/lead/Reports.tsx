import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'
import { analyticsService } from '@/services/analyticsService'
import { AlertCircle } from 'lucide-react'

interface TopEmployee {
  rank: number
  name: string
  avatar: string
  designation: string
  tasks: number
  efficiency: string
  trend: 'up' | 'down' | 'neutral'
}

interface TaskDomain {
  domain: string
  percentage: number
  color: string
}

const formatMonthLabel = (monthStr: string) => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString([], { month: 'short', year: '2-digit' }).toUpperCase();
  } catch {
    return monthStr;
  }
};

const avatarColors = ['#3d7cf0', '#2bb673', '#e0941a', '#b89047', '#8a8fa3'];

export default function Reports() {
  const navigate = useNavigate()
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async (showToast = false) => {
    try {
      if (!showToast) {
        setLoading(true);
      }
      setError(null);
      const res = await analyticsService.getAnalyticsRows();
      setAnalyticsData(res);
      if (showToast) {
        toast({ message: 'Analytics data updated successfully', type: 'success' });
      }
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to load team analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalAssigned = useMemo(() => {
    const ranking = analyticsData?.employeeRanking || [];
    return ranking.reduce((s: number, r: any) => s + r.totalTasks, 0);
  }, [analyticsData]);

  const totalCompleted = useMemo(() => {
    const ranking = analyticsData?.employeeRanking || [];
    return ranking.reduce((s: number, r: any) => s + r.completedTasks, 0);
  }, [analyticsData]);

  const pendingTasks = useMemo(() => {
    return totalAssigned - totalCompleted;
  }, [totalAssigned, totalCompleted]);

  // KPI Card 1: Efficiency Index calculations
  const efficiencyIndex = useMemo(() => {
    return analyticsData?.efficiency ?? 0;
  }, [analyticsData]);

  const efficiencyTrend = useMemo(() => {
    const trend = analyticsData?.taskCompletionTrend || [];
    let trendText = 'vs last month';
    let trendClass = 'neutral';
    let trendArrow = '→';
    
    if (trend.length >= 2) {
      const currentMonthRate = trend[trend.length - 1].rate;
      const prevMonthRate = trend[trend.length - 2].rate;
      const diff = currentMonthRate - prevMonthRate;
      if (diff > 0) {
        trendText = `+${diff.toFixed(1)}% vs last month`;
        trendClass = 'up';
        trendArrow = '↑';
      } else if (diff < 0) {
        trendText = `${diff.toFixed(1)}% vs last month`;
        trendClass = 'down';
        trendArrow = '↓';
      } else {
        trendText = `+0% vs last month`;
        trendClass = 'neutral';
        trendArrow = '→';
      }
    } else {
      trendText = 'Efficiency Baseline';
      trendClass = 'neutral';
      trendArrow = '→';
    }

    return { trendText, trendClass, trendArrow };
  }, [analyticsData]);

  // KPI Card 2: Team Milestone performer bubbles
  const performerAvatars = useMemo(() => {
    const ranking = analyticsData?.employeeRanking || [];
    return ranking.slice(0, 3).map((emp: any) => {
      const nameParts = emp.name.trim().split(/\s+/);
      const avatar = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0] ? nameParts[0][0].toUpperCase() : '';
      return { id: emp.id, avatar };
    });
  }, [analyticsData]);

  const remainingPerformersCount = useMemo(() => {
    const ranking = analyticsData?.employeeRanking || [];
    return Math.max(0, ranking.length - 3);
  }, [analyticsData]);

  // KPI Card 3: Weekly completions mini bar height
  const weeklyBars = useMemo(() => {
    const weekly = analyticsData?.weeklyData || [];
    if (weekly.length === 0) {
      return Array.from({ length: 6 }).map(() => ({ height: 10, isLast: false }));
    }
    const maxVal = Math.max(...weekly.map((d: any) => d.completed), 1);
    return weekly.map((d: any, i: number) => ({
      height: Math.max(10, Math.round((d.completed / maxVal) * 100)),
      isLast: i === weekly.length - 1
    }));
  }, [analyticsData]);

  // Main Performance Chart dynamic SVG coords
  const chartPoints = useMemo(() => {
    const trend = analyticsData?.taskCompletionTrend || [];
    if (trend.length === 0) {
      return {
        pointsStr: "0,120 1000,120",
        areaStr: "M 0 120 L 1000 120 L 1000 240 L 0 240 Z",
        months: ['WK 01','WK 02','WK 03','WK 04','WK 05','WK 06','WK 07','WK 08','WK 09','WK 10'],
        targetStr: "M 0 120 L 1000 120",
        circles: [],
        stepX: 100
      };
    }

    const points = trend.slice(-10); // Display up to 10 points
    const N = points.length;
    const stepX = N > 1 ? 1000 / (N - 1) : 1000;

    const coords = points.map((p: any, i: number) => {
      const X = i * stepX;
      // Map completion rate (0-100) to Y space (200 down to 40)
      const Y = 200 - (p.rate / 100) * 160;
      return { X, Y, rate: p.rate, month: formatMonthLabel(p.month) };
    });

    const pointsStr = coords.map((c: any) => `${c.X} ${c.Y}`).join(' L ');
    const areaStr = `M 0 240 L ${coords.map((c: any) => `${c.X} ${c.Y}`).join(' L ')} L 1000 240 Z`;
    
    // Constant Target Baseline at Y=72 (80%)
    const targetStr = `M 0 72 L 1000 72`;

    return {
      pointsStr: `M ${pointsStr}`,
      areaStr,
      months: coords.map((c: any) => c.month),
      targetStr,
      circles: coords,
      stepX
    };
  }, [analyticsData]);

  // Leaderboard data mapping
  const topEmployees = useMemo((): TopEmployee[] => {
    const ranking = analyticsData?.employeeRanking || [];
    return ranking.slice(0, 4).map((emp: any, index: number) => {
      const nameParts = emp.name.trim().split(/\s+/);
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0] ? nameParts[0][0].toUpperCase() : '';

      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (emp.efficiency > 80) trend = 'up';
      else if (emp.efficiency < 50) trend = 'down';

      return {
        rank: index + 1,
        name: emp.name,
        avatar: initials,
        designation: emp.designation || 'Field Officer',
        tasks: emp.completedTasks,
        efficiency: `${emp.efficiency}%`,
        trend
      };
    });
  }, [analyticsData]);

  // Department distribution calculation
  const taskDomains = useMemo((): TaskDomain[] => {
    const ranking = analyticsData?.employeeRanking || [];
    const departmentTasks: Record<string, number> = {};
    let totalCompletedDepts = 0;

    ranking.forEach((emp: any) => {
      const dept = emp.department || 'Operations';
      departmentTasks[dept] = (departmentTasks[dept] || 0) + emp.completedTasks;
      totalCompletedDepts += emp.completedTasks;
    });

    return Object.entries(departmentTasks)
      .map(([domain, count]) => {
        const percentage = totalCompletedDepts > 0 ? Math.round((count / totalCompletedDepts) * 100) : 0;
        return {
          domain: `${domain} Operations`,
          percentage,
          color: '#b89047'
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [analyticsData]);

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
    toast({ message: 'Analytics report exported successfully', type: 'success' })
  }

  const handleUpdate = () => {
    loadAnalytics(true)
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header-row">
        <div>
          <h2 className="analytics-page-title">Team Analytics Overview</h2>
          <p className="analytics-page-subtitle">Real-time productivity distribution and operational performance tracking.</p>
        </div>
        <div className="analytics-header-actions">
          <button className="analytics-btn-outline" onClick={handleExport} disabled={loading || topEmployees.length === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
          <button className="analytics-btn-gold" onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-1"><Spinner size={12} /> Syncing...</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.28l5.67-5.67" />
                </svg>
                Update Data
              </>
            )}
          </button>
        </div>
      </div>

      {loading && !analyticsData ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 border border-red-200 bg-red-50 rounded-lg text-red-700 my-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => loadAnalytics(false)} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">
            Retry Action
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="analytics-stats-row">
            <div className="analytics-stat-card">
              <div className="analytics-stat-header">
                <span className="analytics-stat-label">EFFICIENCY INDEX</span>
                <span className="analytics-stat-icon-gold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </span>
              </div>
              <div className="analytics-stat-value">{efficiencyIndex}%</div>
              <div className={`analytics-stat-trend ${efficiencyTrend.trendClass}`}>
                {efficiencyTrend.trendArrow} {efficiencyTrend.trendText}
              </div>
              <div className="analytics-progress-track">
                <div className="analytics-progress-fill" style={{ width: `${efficiencyIndex}%` }} />
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-header">
                <span className="analytics-stat-label">TEAM MILESTONES</span>
                <span className="analytics-stat-icon-gold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10M6 4v6a6 6 0 0 0 12 0V4M3 4h3M18 4h3"/></svg>
                </span>
              </div>
              <div className="analytics-stat-value">{totalCompleted}/{totalAssigned}</div>
              <div className="analytics-stat-desc">Tasks Completed</div>
              <div className="analytics-avatar-group">
                {performerAvatars.map((emp: any, i: number) => (
                  <div key={emp.id} className="analytics-avatar" style={{ background: avatarColors[i % avatarColors.length], marginLeft: i > 0 ? '-10px' : undefined }}>
                    {emp.avatar}
                  </div>
                ))}
                {remainingPerformersCount > 0 && (
                  <div className="analytics-avatar-more" style={{ marginLeft: '-10px' }}>
                    +{remainingPerformersCount}
                  </div>
                )}
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-header">
                <span className="analytics-stat-label">PENDING TASKS</span>
                <span className="analytics-stat-icon-gold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
              </div>
              <div className="analytics-stat-value">{pendingTasks}</div>
              <div className="analytics-stat-desc">Active workload across team</div>
              <div className="analytics-mini-chart">
                {weeklyBars.map((bar: any, i: number) => (
                  <div key={i} className="analytics-mini-bar" style={{ height: `${bar.height}%`, background: bar.isLast ? '#b89047' : undefined }} />
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
                
                {/* Target Baseline dashed line and grey/blue area underneath */}
                <path d={chartPoints.targetStr} fill="none" stroke="#d0d3df" strokeWidth="2" strokeDasharray="6 6" />
                <path d={chartPoints.areaStr} fill="rgba(240, 242, 248, 0.5)" />
                
                {/* Operational Flow solid gold line */}
                <path d={chartPoints.pointsStr} fill="none" stroke="#b89047" strokeWidth="3" />
                
                {/* Data point circles */}
                {chartPoints.circles.map((c: any, i: number) => (
                  <circle key={i} cx={c.X} cy={c.Y} r="4" fill="#b89047" />
                ))}

                {/* Month labels */}
                {chartPoints.months.map((wk: string, i: number) => (
                  <text 
                    key={i} 
                    x={i * chartPoints.stepX} 
                    y="230" 
                    fill="#8a8fa3" 
                    fontSize="12" 
                    fontWeight="600"
                    textAnchor={i === chartPoints.months.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
                  >
                    {wk}
                  </text>
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
              <div className="overflow-x-auto">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th><th>DESIGNATION</th>
                      <th>TASKS COMPLETED</th><th>EFFICIENCY</th><th>TREND</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', color: '#8a8fa3' }}>
                          No leaderboard data available.
                        </td>
                      </tr>
                    ) : (
                      topEmployees.map((emp) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="analytics-domain-card">
              <h3 className="analytics-card-title">Task Domain Distribution</h3>
              <div className="analytics-domain-list">
                {taskDomains.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#8a8fa3', fontSize: '13px' }}>
                    No task domain distribution data available.
                  </div>
                ) : (
                  taskDomains.map((domain) => (
                    <div className="analytics-domain-item" key={domain.domain}>
                      <div className="analytics-domain-header">
                        <span className="analytics-domain-name">{domain.domain}</span>
                        <span className="analytics-domain-percent">{domain.percentage}%</span>
                      </div>
                      <div className="analytics-domain-track">
                        <div className="analytics-domain-fill" style={{ width: `${domain.percentage}%`, background: domain.color }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
