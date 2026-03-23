import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, Package, Calendar, ClipboardCheck, FileText } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchAdminDashboardMetrics } from '../services/api';
import type { DashboardActiveInstallation } from '../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// Mock forecast data - 3-month moving average
const FORECAST_DATA = [
  { month: 'Dec 2025', revenue: 485000, confirmed: 325000, pending: 160000 },
  { month: 'Jan 2026', revenue: 520000, confirmed: 360000, pending: 160000 },
  { month: 'Feb 2026', revenue: 495000, confirmed: 345000, pending: 150000 },
  { month: 'Mar 2026', revenue: 580000, confirmed: 420000, pending: 160000 },
  { month: 'Apr 2026 (Forecast)', revenue: 612000, confirmed: 0, pending: 0, isForecast: true },
];


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

function SalesForecastChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...FORECAST_DATA.map(d => d.revenue));

  return (
    <div className="p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Projected Income for Next Month
          </div>
          <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
            Based on 3-month moving average and historical material costs
          </div>
        </div>
        <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44', borderRadius: '8px' }}>
          <TrendingUp size={16} color="#1a5c1a" />
          <span style={{ fontFamily: 'var(--font-heading)', color: '#1a5c1a', fontSize: '13px', fontWeight: 700 }}>+18% Growth</span>
        </div>
      </div>

      <div className="relative" style={{ height: '280px' }}>
        <div className="absolute inset-0 flex items-end justify-between gap-4 px-2">
          {FORECAST_DATA.map((data, idx) => {
            const heightPercent = (data.revenue / maxValue) * 100;
            const isHovered = hoveredIndex === idx;
            const isForecast = data.isForecast;

            return (
              <div
                key={data.month}
                className="flex-1 flex flex-col items-center gap-2"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div
                    className="absolute px-3 py-2 rounded shadow-lg z-10"
                    style={{
                      backgroundColor: '#15263c',
                      bottom: `${heightPercent + 5}%`,
                      transform: 'translateX(-50%)',
                      left: '50%',
                      minWidth: '140px',
                    }}
                  >
                    <div style={{ color: 'white', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '4px' }}>
                      {data.month}
                    </div>
                    <div style={{ color: '#9ab0c4', fontSize: '10px', fontFamily: 'var(--font-body)' }}>
                      Total: ₱{(data.revenue / 1000).toFixed(0)}k
                    </div>
                    {!isForecast && (
                      <>
                        <div style={{ color: '#4ade80', fontSize: '10px', fontFamily: 'var(--font-body)' }}>
                          Confirmed: ₱{(data.confirmed / 1000).toFixed(0)}k
                        </div>
                        <div style={{ color: '#fbbf24', fontSize: '10px', fontFamily: 'var(--font-body)' }}>
                          Pending: ₱{(data.pending / 1000).toFixed(0)}k
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t transition-all duration-200"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isForecast ? '#7a0000' : (isHovered ? '#15263c' : '#54667d'),
                    opacity: isForecast ? 0.6 : 1,
                    border: isForecast ? '2px dashed #7a0000' : 'none',
                    cursor: 'pointer',
                  }}
                />

                {/* Label */}
                <div className="text-center mt-2">
                  <div style={{ color: '#54667d', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {data.month}
                  </div>
                  <div style={{ color: isForecast ? '#7a0000' : '#15263c', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                    ₱{(data.revenue / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>
            );
          })}
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

  const loadDashboardMetrics = useCallback(async () => {
    try {
      const metrics = await fetchAdminDashboardMetrics();
      setPendingInquiries(metrics.pendingInquiries || 0);
      setActiveInstallations(metrics.activeInstallations || 0);
      setTotalQuotes(metrics.totalQuotes || 0);
      setApprovedQuotes(metrics.approvedQuotes || 0);
      setActiveInstallationEntries(metrics.activeInstallationEntries || []);
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
    const channel = client
      .channel('admin-dashboard-metrics-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, () => {
        loadDashboardMetrics();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, () => {
        loadDashboardMetrics();
      })
      .subscribe();

    return () => {
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
    const grouped = new Map<string, any[]>();
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
          <SalesForecastChart />
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
