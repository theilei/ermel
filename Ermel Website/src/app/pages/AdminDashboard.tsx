import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Package, Calendar, ClipboardCheck, FileText } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchAdminDashboardMetrics, fetchAdminAnalyticsSummary } from '../services/api';
import type { DashboardActiveInstallation } from '../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface ForecastPoint {
  month: string;
  revenue: number;
  confirmed: number;
  pending: number;
  isForecast?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bg: string;
  trend?: string;
}

function PesoSignIcon({ size = 20, color = '#005c7a' }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        color,
        fontSize: `${size}px`,
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      ₱
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, color, bg, trend }: MetricCardProps) {
  return (
    <div
      className="p-5"
      style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 flex items-center justify-center" style={{ backgroundColor: bg, borderRadius: '8px' }}>
          <Icon size={20} color={color} />
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendingUp size={14} color={color} />
            <span style={{ color, fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              {trend}
            </span>
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '8px' }}>
        {label}
      </div>
    </div>
  );
}

function linearRegression(values: number[]) {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0, predictNext: 0 };
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = values[i] || 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;
  const predictNext = slope * n + intercept;
  return { slope, intercept, predictNext };
}

function niceMax(rawMax: number): number {
  if (rawMax <= 0) return 100000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const normalized = rawMax / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude * 1.1;
}

function yTicks(max: number, steps = 4): number[] {
  const step = max / steps;
  return Array.from({ length: steps + 1 }, (_, i) => Math.round(step * i));
}

function formatPeso(value: number): string {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₱${Math.round(value / 1000)}k`;
  return `₱${value}`;
}

function Tooltip({
  data,
  barHeightPct,
}: {
  data: ForecastPoint;
  barHeightPct: number;
}) {
  const bottom = Math.min(barHeightPct + 6, 88);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: `${bottom}%`,
        transform: 'translateX(-50%)',
        backgroundColor: '#15263c',
        color: 'white',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: 'var(--font-heading)',
        whiteSpace: 'nowrap',
        zIndex: 20,
        pointerEvents: 'none',
        minWidth: '148px',
        boxShadow: '0 4px 16px rgba(21,38,60,0.28)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '11px', color: '#9ab0c4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {data.month}
      </div>
      <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
        {formatPeso(data.revenue)}
      </div>
      {!data.isForecast && (
        <>
          <div style={{ color: '#4ade80', fontSize: '11px' }}>
            Confirmed  {formatPeso(data.confirmed)}
          </div>
          <div style={{ color: '#fbbf24', fontSize: '11px' }}>
            Pending    {formatPeso(data.pending)}
          </div>
        </>
      )}
      {data.isForecast && (
        <div style={{ color: '#f09595', fontSize: '11px' }}>Model estimate</div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #15263c',
        }}
      />
    </div>
  );
}

function SalesForecastChart({
  forecastData,
  trendLabel,
  confidenceLabel,
}: {
  forecastData: ForecastPoint[];
  trendLabel: string;
  confidenceLabel: 'Low' | 'Medium' | 'High';
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const normalized = useMemo(
    () =>
      forecastData.map((d) => ({
        ...d,
        revenue: Number.isFinite(d.revenue) && d.revenue > 0 ? d.revenue : 0,
        confirmed: Number.isFinite(d.confirmed) && d.confirmed > 0 ? d.confirmed : 0,
        pending: Number.isFinite(d.pending) && d.pending > 0 ? d.pending : 0,
      })),
    [forecastData]
  );

  const rawMax = Math.max(1, ...normalized.map((d) => d.revenue));
  const yMax = niceMax(rawMax);
  const ticks = yTicks(yMax, 4);
  const isPositiveTrend = !trendLabel.startsWith('-');

  const confidenceColor: Record<string, string> = {
    Low: '#7a5200',
    Medium: '#005c7a',
    High: '#1a5c1a',
  };
  const confidenceBg: Record<string, string> = {
    Low: '#fff8e1',
    Medium: '#e0f4ff',
    High: '#e8f5e9',
  };

  if (forecastData.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: 'white',
          border: '1px solid #e0e4ea',
          borderRadius: '10px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, margin: 0 }}>
          Projected Income — Next Month
        </p>
        <p style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '8px' }}>
          Waiting for enough data to generate a forecast.
        </p>
      </div>
    );
  }

  const CHART_H = 240;
  const Y_AXIS_W = 64;

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e4ea',
        borderRadius: '10px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Projected Income — Next Month
          </p>
          <p style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)', marginTop: '4px', marginBottom: 0 }}>
            DSS estimate based on reservation pipeline, average project cost, and recent trend
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              backgroundColor: isPositiveTrend ? '#e8f5e9' : '#fff0f0',
              border: `1px solid ${isPositiveTrend ? '#1a5c1a44' : '#7a000044'}`,
              borderRadius: '8px',
            }}
          >
            {isPositiveTrend ? (
              <TrendingUp size={14} color="#1a5c1a" />
            ) : (
              <TrendingDown size={14} color="#7a0000" />
            )}
            <span style={{ fontFamily: 'var(--font-heading)', color: isPositiveTrend ? '#1a5c1a' : '#7a0000', fontSize: '12px', fontWeight: 700 }}>
              {trendLabel}
            </span>
          </div>

          <div
            style={{
              padding: '5px 12px',
              backgroundColor: confidenceBg[confidenceLabel],
              border: `1px solid ${confidenceColor[confidenceLabel]}44`,
              borderRadius: '8px',
              fontFamily: 'var(--font-heading)',
              color: confidenceColor[confidenceLabel],
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {confidenceLabel} confidence
          </div>
        </div>
      </div>

      <p style={{ color: '#54667d', fontSize: '11px', fontFamily: 'var(--font-body)', marginBottom: '20px', marginTop: '6px' }}>
        Use as planning guidance, not a fixed financial commitment.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#54667d', display: 'inline-block' }} />
          Historical
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a0000', fontFamily: 'var(--font-body)' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            display: 'inline-block',
            border: '2px dashed #7a0000',
            backgroundImage: 'repeating-linear-gradient(135deg, #fff0f0 0, #fff0f0 3px, #f09595 3px, #f09595 6px)',
          }} />
          Forecast
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <div style={{ width: `${Y_AXIS_W}px`, height: `${CHART_H}px`, position: 'relative', flexShrink: 0 }}>
          {ticks.map((tick) => {
            const pct = (tick / yMax) * 100;
            return (
              <div
                key={tick}
                style={{
                  position: 'absolute',
                  bottom: `${pct}%`,
                  right: '8px',
                  transform: 'translateY(50%)',
                  fontSize: '10px',
                  color: '#54667d',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatPeso(tick)}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', height: `${CHART_H}px` }}>
            {ticks.map((tick) => {
              const pct = (tick / yMax) * 100;
              return (
                <div
                  key={tick}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${pct}%`,
                    borderTop: '1px dashed #e0e4ea',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}

            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'stretch', gap: '6px', padding: '0 4px' }}>
              {normalized.map((data, idx) => {
                const barPct = data.revenue > 0 ? Math.max(4, (data.revenue / yMax) * 100) : 1;
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={data.month}
                    style={{ flex: 1, position: 'relative', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {isHovered && (
                      <Tooltip data={data} barHeightPct={barPct} />
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '4px',
                        right: '4px',
                        height: `${barPct}%`,
                        borderRadius: '4px 4px 0 0',
                        backgroundColor: data.isForecast ? 'transparent' : (isHovered ? '#15263c' : '#54667d'),
                        backgroundImage: data.isForecast
                          ? 'repeating-linear-gradient(135deg, #fff0f0 0, #fff0f0 4px, #f09595 4px, #f09595 8px)'
                          : undefined,
                        border: data.isForecast ? '2px dashed #7a0000' : 'none',
                        borderBottom: 'none',
                        transition: 'background-color 0.15s',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', padding: '8px 4px 0', alignItems: 'flex-start' }}>
            {normalized.map((data) => {
              const label = data.isForecast
                ? data.month.replace(' (Forecast)', '')
                : data.month;
              return (
                <div key={data.month} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      color: data.isForecast ? '#7a0000' : '#54667d',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: data.isForecast ? '#7a0000' : '#15263c',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      marginTop: '2px',
                    }}
                  >
                    {formatPeso(data.revenue)}
                  </div>
                  {data.isForecast && (
                    <div style={{ fontSize: '9px', color: '#7a0000', fontFamily: 'var(--font-body)', marginTop: '1px' }}>
                      est.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [pendingInquiries, setPendingInquiries] = useState(0);
  const [activeInstallations, setActiveInstallations] = useState(0);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [approvedQuotes, setApprovedQuotes] = useState(0);
  const [activeInstallationEntries, setActiveInstallationEntries] = useState<DashboardActiveInstallation[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<Array<{ month: string; total: number }>>([]);

  const loadDashboardMetrics = useCallback(async () => {
    try {
      const [metrics, analytics] = await Promise.all([
        fetchAdminDashboardMetrics(),
        fetchAdminAnalyticsSummary(),
      ]);
      setPendingInquiries(metrics.pendingInquiries || 0);
      setActiveInstallations(metrics.activeInstallations || 0);
      setTotalQuotes(metrics.totalQuotes || 0);
      setApprovedQuotes(metrics.approvedQuotes || 0);
      setActiveInstallationEntries(metrics.activeInstallationEntries || []);
      setMonthlyTrends(analytics.monthlyTrends || []);
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch dashboard metrics:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const queueRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        loadDashboardMetrics();
      }, 120);
    };

    const channel = client
      .channel('admin-dashboard-metrics-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qq_quotes' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, queueRefresh)
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      client.removeChannel(channel);
    };
  }, [loadDashboardMetrics]);

  const convertedQuotes = useMemo(
    () => activeInstallationEntries.map((entry) => ({
      id: entry.id,
      customerName: entry.customerName,
      projectType: entry.projectType,
      width: entry.width,
      height: entry.height,
      quantity: entry.quantity,
      color: entry.color,
      estimatedCost: entry.estimatedCost,
      status: entry.status,
      reservationDate: entry.reservationDate,
    })),
    [activeInstallationEntries]
  );

  const convertedByDate = useMemo(() => {
    const grouped = new Map<string, typeof convertedQuotes>();
    convertedQuotes.forEach((q) => {
      if (!q.reservationDate) return;
      const list = grouped.get(q.reservationDate) || [];
      list.push(q);
      grouped.set(q.reservationDate, list);
    });
    return grouped;
  }, [convertedQuotes]);

  const calendarEvents = useMemo(
    () => convertedQuotes
      .filter((q) => !!q.reservationDate)
      .map((q) => ({
        id: q.id,
        title: q.customerName,
        date: q.reservationDate as string,
        color: '#6b21a8',
      })),
    [convertedQuotes]
  );

  const selectedDateQuotes = selectedCalendarDate
    ? (convertedByDate.get(selectedCalendarDate) || [])
    : [];

  const dssForecast = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

    const totalEstimatedCost = activeInstallationEntries.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
    const avgTicket = activeInstallationEntries.length > 0 ? totalEstimatedCost / activeInstallationEntries.length : 0;

    const byMonthRevenue = activeInstallationEntries.reduce((acc, item) => {
      if (!item.reservationDate) return acc;
      const key = item.reservationDate.slice(0, 7);
      acc.set(key, (acc.get(key) || 0) + Number(item.estimatedCost || 0));
      return acc;
    }, new Map<string, number>());

    const scheduledRevenueNextMonth = byMonthRevenue.get(nextMonthKey) || 0;

    const sortedTrends = [...monthlyTrends].sort((a, b) => a.month.localeCompare(b.month));
    const recentWindow = 6;
    const recentTrends = sortedTrends.slice(-recentWindow);
    const totals = recentTrends.map((t) => Number(t.total || 0));
    const regression = linearRegression(totals);
    const predictedNextTotal = Math.max(0, regression.predictNext || 0);
    const latestTotal = totals.length ? totals[totals.length - 1] : 0;
    const rawGrowth = latestTotal > 0 ? (predictedNextTotal - latestTotal) / latestTotal : 0;
    const clampedGrowth = Math.max(-0.25, Math.min(0.35, rawGrowth));

    const approvalRate = totalQuotes > 0 ? approvedQuotes / totalQuotes : 0.55;
    const expectedInstallations = Math.max(1, activeInstallations * (1 + clampedGrowth));
    const trendBasedRevenue = expectedInstallations * (avgTicket || 55000) * Math.max(0.35, approvalRate);

    const projectedIncome = Math.round((scheduledRevenueNextMonth * 0.45) + (trendBasedRevenue * 0.55));
    const forecastMonthLabel = nextMonth.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const historicalRevenuePoints: ForecastPoint[] = recentTrends.map((item) => {
      const monthDate = new Date(`${item.month}-01T00:00:00`);
      const derivedRevenue = Math.round(item.total * (avgTicket || 55000) * Math.max(0.35, approvalRate));
      const confirmed = Math.round(derivedRevenue * 0.7);
      const pending = derivedRevenue - confirmed;

      return {
        month: monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        revenue: derivedRevenue,
        confirmed,
        pending,
      };
    });

    if (historicalRevenuePoints.length === 0) {
      const fallbackCurrent = Math.max(scheduledRevenueNextMonth, Math.round(activeInstallations * (avgTicket || 55000)));
      historicalRevenuePoints.push({
        month: now.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        revenue: fallbackCurrent,
        confirmed: Math.round(fallbackCurrent * 0.7),
        pending: Math.round(fallbackCurrent * 0.3),
      });
    }

    const forecastData: ForecastPoint[] = [
      ...historicalRevenuePoints,
      {
        month: `${forecastMonthLabel} (Forecast)`,
        revenue: projectedIncome,
        confirmed: 0,
        pending: 0,
        isForecast: true,
      },
    ];

    const latestHistorical = historicalRevenuePoints[historicalRevenuePoints.length - 1]?.revenue || 0;
    const hasReliableBaseline = latestHistorical >= 10000;
    const rawProjectedGrowthPct = hasReliableBaseline
      ? ((projectedIncome - latestHistorical) / latestHistorical) * 100
      : 0;
    const projectedGrowthPct = Math.max(-99, Math.min(300, rawProjectedGrowthPct));
    const trendLabel = hasReliableBaseline
      ? `${projectedGrowthPct >= 0 ? '+' : ''}${projectedGrowthPct.toFixed(1)}% Trend`
      : 'Insufficient baseline';

    const confidenceScore =
      (monthlyTrends.length >= 4 ? 1 : 0) +
      (activeInstallationEntries.length >= 4 ? 1 : 0) +
      (scheduledRevenueNextMonth > 0 ? 1 : 0);

    const confidenceLabel: 'Low' | 'Medium' | 'High' = confidenceScore >= 3 ? 'High' : confidenceScore === 2 ? 'Medium' : 'Low';

    return {
      forecastData,
      trendLabel,
      confidenceLabel,
      currentMonthKey,
    };
  }, [activeInstallations, activeInstallationEntries, approvedQuotes, monthlyTrends, totalQuotes]);

  const metrics = [
    {
      label: 'Pending Inquiries',
      value: pendingInquiries,
      icon: Package,
      color: '#7a0000',
      bg: '#fff0f0',
    },
    {
      label: 'Active Installations',
      value: activeInstallations,
      icon: Calendar,
      color: '#1a5c1a',
      bg: '#e8f5e9',
    },
    {
      label: 'Total Quotes',
      value: totalQuotes,
      icon: FileText,
      color: '#005c7a',
      bg: '#e0f4ff',
    },
    {
      label: 'Approved Quotes',
      value: approvedQuotes,
      icon: ClipboardCheck,
      color: '#7a5200',
      bg: '#fff8e1',
    },
  ];

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100%', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        <div className="mb-8">
          <SalesForecastChart
            forecastData={dssForecast.forecastData}
            trendLabel={dssForecast.trendLabel}
            confidenceLabel={dssForecast.confidenceLabel}
          />
        </div>
        <div className="mb-8">
          <div className="p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
              Installation Calendar
            </div>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              height="auto"
              eventColor="#6b21a8"
              dateClick={(info) => setSelectedCalendarDate(info.dateStr)}
              eventClick={(info) => setSelectedCalendarDate(info.event.startStr.split('T')[0])}
            />
          </div>
        </div>

        {selectedCalendarDate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(21, 38, 60, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200,
              padding: '16px',
            }}
            onClick={() => setSelectedCalendarDate(null)}
          >
            <div
              style={{
                width: 'min(840px, 100%)',
                maxHeight: '80vh',
                overflowY: 'auto',
                backgroundColor: 'white',
                borderRadius: '10px',
                border: '1px solid #e0e4ea',
                padding: '18px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Installations on {selectedCalendarDate}
                  </div>
                  <div style={{ color: '#54667d', fontSize: '12px', marginTop: '4px' }}>
                    Read-only installation details
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  style={{ border: '1px solid #e0e4ea', borderRadius: '6px', padding: '6px 10px', backgroundColor: 'white', color: '#15263c', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>

              {selectedDateQuotes.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                  No installation for this date
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateQuotes.map((q) => (
                    <div key={q.id} style={{ border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, fontSize: '14px' }}>
                        {q.customerName}
                      </div>
                      <div style={{ color: '#54667d', fontSize: '12px', marginTop: '4px' }}>
                        {q.projectType}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginTop: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#54667d' }}>Dimensions: {q.width}cm × {q.height}cm × {q.quantity}</div>
                        <div style={{ fontSize: '12px', color: '#54667d' }}>Color: {q.color}</div>
                        <div style={{ fontSize: '12px', color: '#54667d' }}>Estimated Cost: ₱{Number(q.estimatedCost || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: '#54667d' }}>Status: {q.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
