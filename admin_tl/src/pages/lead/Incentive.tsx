import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'
import { incentiveService } from '@/services/incentiveService'
import { AlertCircle } from 'lucide-react'

interface LeaderboardRow {
  rank: number
  name: string
  avatar: string
  attainment: number
  trend: 'up' | 'neutral'
  estimated: string
}

interface Validation {
  id: string
  type: string
  claimedBy: string
  amount: string
  color: string
}

const formatCurrency = (val: number | string | undefined | null) => {
  if (val === undefined || val === null) return '₹0.00';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatMonthLabel = (monthStr: string) => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString([], { month: 'short' });
  } catch {
    return monthStr;
  }
};

const avatarColors = ['#3d7cf0', '#2bb673', '#e0941a', '#b89047', '#8a8fa3'];

export default function Incentive() {
  const navigate = useNavigate()
  const [incentiveData, setIncentiveData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvedIds, setApprovedIds] = useState<string[]>([])

  const loadIncentives = async (showToast = false) => {
    try {
      if (!showToast) {
        setLoading(true);
      }
      setError(null);
      const res = await incentiveService.getTLIncentives();
      setIncentiveData(res);
      if (showToast) {
        toast({ message: 'Incentive details synchronized', type: 'success' });
      }
    } catch (err: any) {
      console.error('Error fetching incentives:', err);
      setError(err.message || 'Failed to load incentives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncentives();
  }, []);

  const totalPool = useMemo(() => {
    return incentiveData?.currentIncentivePool ?? 0;
  }, [incentiveData]);

  const poolTrend = useMemo(() => {
    const dist = incentiveData?.monthlyDistribution || [];
    if (dist.length >= 2) {
      const last = dist[dist.length - 1].total;
      const prev = dist[dist.length - 2].total;
      const diff = last - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : 0;
      return {
        text: `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% vs Last Month`,
        class: pct >= 0 ? 'incentive-stat-up' : 'incentive-stat-down'
      };
    }
    return {
      text: 'Incentive pool baseline',
      class: 'incentive-stat-neutral'
    };
  }, [incentiveData]);

  const payoutReadiness = useMemo(() => {
    const list = incentiveData?.incentives || [];
    if (list.length === 0) return 100.0;
    return Number(((approvedIds.length / list.length) * 100).toFixed(1));
  }, [incentiveData, approvedIds]);

  const payoutDetails = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = endOfMonth.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const dateStr = endOfMonth.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    return { dateStr, diffDays };
  }, []);

  const barChartData = useMemo(() => {
    const dist = incentiveData?.monthlyDistribution || [];
    if (dist.length === 0) {
      return Array.from({ length: 6 }).map((_, i) => ({ month: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][i], base: 10, highlight: false }));
    }
    const maxVal = Math.max(...dist.map((d: any) => d.total), 1);
    return dist.slice(-6).map((d: any, idx: number) => {
      const pct = Math.round((d.total / maxVal) * 100);
      return {
        month: formatMonthLabel(d.month),
        base: Math.max(10, pct),
        highlight: idx === Math.min(dist.length, 6) - 1
      };
    });
  }, [incentiveData]);

  const poolAllocations = useMemo(() => {
    const list = incentiveData?.incentives || [];
    const deptSums: Record<string, number> = {};
    let totalSum = 0;

    list.forEach((inc: any) => {
      const dept = inc.employee?.department || 'Operations';
      deptSums[dept] = (deptSums[dept] || 0) + inc.amount;
      totalSum += inc.amount;
    });

    const allocations = Object.entries(deptSums).map(([label, sum]) => {
      const percent = totalSum > 0 ? Math.round((sum / totalSum) * 100) : 0;
      return { label: `${label} Team`, percent };
    }).sort((a: any, b: any) => b.percent - a.percent);

    if (allocations.length === 0) {
      return [
        { label: 'GST Operations', percent: 100 }
      ];
    }
    return allocations;
  }, [incentiveData]);

  const leaderboardData = useMemo(() => {
    const board = incentiveData?.leaderboard || [];
    const maxVal = Math.max(...board.map((b: any) => b.total), 1);
    return board.map((row: any, index: number): LeaderboardRow => {
      const nameParts = row.name.trim().split(/\s+/);
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0] ? nameParts[0][0].toUpperCase() : '';

      const attainment = Math.round((row.total / maxVal) * 100);
      
      return {
        rank: index + 1,
        name: row.name,
        avatar: initials,
        attainment,
        trend: index === 0 ? 'up' : 'neutral',
        estimated: formatCurrency(row.total)
      };
    });
  }, [incentiveData]);

  const pendingValidations = useMemo((): Validation[] => {
    const list = incentiveData?.incentives || [];
    return list.slice(0, 3).map((v: any, index: number) => {
      return {
        id: String(v.id),
        type: `${v.employee?.department || 'GST'} Payout`,
        claimedBy: v.employee ? `${v.employee.firstName} ${v.employee.lastName}` : 'Unknown',
        amount: formatCurrency(v.amount),
        color: avatarColors[index % avatarColors.length]
      };
    });
  }, [incentiveData]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id])
    toast({ message: `Payout validation #${id} approved successfully`, type: 'success' })
  }

  const handleCalculate = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-06"
    try {
      setCalculating(true);
      setError(null);
      const res = await incentiveService.calculateTLIncentives(currentMonth);
      toast({ message: `Incentives calculated for ${currentMonth}: ${res.calculated} records calculated.`, type: 'success' });
      await loadIncentives(false);
    } catch (err: any) {
      console.error('Error calculating incentives:', err);
      toast({ message: err.message || 'Failed to calculate incentives', type: 'error' });
    } finally {
      setCalculating(false);
    }
  };

  const handleExport = () => {
    const rows = leaderboardData.map((row: LeaderboardRow) => ({
      Rank: row.rank,
      Name: row.name,
      Attainment: `${row.attainment}%`,
      'Estimated Payout': row.estimated,
    }))
    downloadCsv(rows, 'incentive_performance_report.csv')
    toast({ message: 'Performance report exported successfully', type: 'success' })
  }

  return (
    <div className="incentive-page">
      <div className="incentive-page-header">
        <div>
          <h2 className="incentive-page-title">Team Incentive Performance</h2>
          <p className="incentive-page-subtitle">Real-time tracking of quarterly payouts and individual performance metrics.</p>
        </div>
        <div className="incentive-header-actions">
          <button className="btn-outline-dark" onClick={handleCalculate} disabled={calculating || loading}>
            {calculating ? (
              <span className="flex items-center gap-1"><Spinner size={12} /> Calculating...</span>
            ) : (
              'Calculate Incentives'
            )}
          </button>
          <button className="btn-outline-dark" onClick={handleExport} disabled={loading || leaderboardData.length === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {loading && !incentiveData ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 border border-red-200 bg-red-50 rounded-lg text-red-700 my-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => loadIncentives(false)} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">
            Retry Action
          </button>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="incentive-stats-row">
            <div className="incentive-stat-card">
              <div className="incentive-stat-card-header">
                <span className="incentive-stat-label">TOTAL INCENTIVE POOL</span>
                <span className="incentive-stat-icon incentive-stat-icon-gold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></svg>
                </span>
              </div>
              <div className="incentive-stat-value">{formatCurrency(totalPool)}</div>
              <div className={`incentive-stat-change ${poolTrend.class}`}>{poolTrend.text}</div>
            </div>

            <div className="incentive-stat-card">
              <div className="incentive-stat-card-header">
                <span className="incentive-stat-label">PAYOUT READINESS</span>
                <span className="incentive-stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                </span>
              </div>
              <div className="incentive-stat-value">{payoutReadiness}%</div>
              <div className="incentive-payout-bar-track">
                <div className="incentive-payout-bar-fill" style={{ width: `${payoutReadiness}%` }} />
              </div>
            </div>

            <div className="incentive-stat-card">
              <div className="incentive-stat-card-header">
                <span className="incentive-stat-label">NEXT PAYOUT DATE</span>
                <span className="incentive-stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </span>
              </div>
              <div className="incentive-stat-value incentive-stat-value-sm">{payoutDetails.dateStr}</div>
              <div className="incentive-stat-sublabel">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                {payoutDetails.diffDays} Days Remaining
              </div>
            </div>
          </div>

          {/* Chart & Pool Allocation */}
          <div className="incentive-mid-grid">
            <div className="incentive-chart-card">
              <div className="incentive-chart-header">
                <h3 className="incentive-card-title">Monthly Incentive Distribution</h3>
                <span className="incentive-chart-period" onClick={() => loadIncentives(true)}>Sync Distribution ↻</span>
              </div>
              <div className="incentive-bar-chart">
                {barChartData.map((bar: any) => (
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
                {poolAllocations.map((item: any) => (
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
                Allocations are adjusted dynamically based on department payout totals.
              </div>
            </div>
          </div>

          {/* Leaderboard & Pending Validations */}
          <div className="incentive-bottom-grid">
            <div className="incentive-leaderboard-card">
              <div className="incentive-card-header-row">
                <h3 className="incentive-card-title">Team Incentive Leaderboard</h3>
                <button className="incentive-link-btn" onClick={() => loadIncentives(true)}>Refresh Rank</button>
              </div>
              <div className="overflow-x-auto">
                <table className="incentive-leader-table">
                  <thead>
                    <tr><th>RANK</th><th>MEMBER</th><th>ATTAINMENT</th><th>ESTIMATED INCENTIVE</th></tr>
                  </thead>
                  <tbody>
                    {leaderboardData.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '32px 24px', textAlign: 'center', color: '#8a8fa3' }}>
                          No team ranking data available.
                        </td>
                      </tr>
                    ) : (
                      leaderboardData.map((row: any) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="incentive-validations-card">
              <div className="incentive-card-header-row">
                <h3 className="incentive-card-title">Pending Payout Validations</h3>
                <span className="incentive-required-badge">
                  {pendingValidations.length - approvedIds.length} Required
                </span>
              </div>
              <div className="incentive-validation-list">
                {pendingValidations.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8a8fa3', fontSize: '13px' }}>
                    No pending claims. Click Calculate Incentives to run.
                  </div>
                ) : (
                  pendingValidations.map((v: any) => (
                    <div className="incentive-validation-item" key={v.id}>
                      <div className="incentive-validation-header">
                        <span className="incentive-validation-type">{v.type} – ID #{v.id}</span>
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
                        <button className="incentive-review-btn" onClick={() => toast({ message: 'Claim is under verification', type: 'info' })}>Review</button>
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
