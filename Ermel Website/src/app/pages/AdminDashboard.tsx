import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Package, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import * as api from '../services/api';
import type { Reservation } from '../types/quotation';

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

function FabricationCapacityGauge() {
  const capacity = 76; // 76%
  const booked = 420;
  const maxCapacity = 320;
  const isOverbooked = booked > maxCapacity;

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (capacity / 100) * circumference;

  return (
    <div className="p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
        Fabrication Capacity
      </div>
      <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)', marginBottom: '24px' }}>
        Current month workload
      </div>

      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: '200px', height: '200px' }}>
          <svg className="transform -rotate-90" width="200" height="200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="#e0e4ea"
              strokeWidth="16"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke={isOverbooked ? '#7a0000' : '#1a5c1a'}
              strokeWidth="16"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div style={{ fontFamily: 'var(--font-heading)', color: isOverbooked ? '#7a0000' : '#15263c', fontSize: '48px', fontWeight: 800, lineHeight: 1 }}>
              {capacity}%
            </div>
            <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600, marginTop: '4px' }}>
              CAPACITY
            </div>
          </div>
        </div>

        <div className="mt-6 w-full space-y-2">
          <div className="flex justify-between items-center">
            <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Booked Hours</span>
            <span style={{ color: '#15263c', fontSize: '14px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{booked} hrs</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Max Capacity</span>
            <span style={{ color: '#15263c', fontSize: '14px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{maxCapacity} hrs</span>
          </div>
          {isOverbooked && (
            <div className="flex items-start gap-2 mt-3 p-3" style={{ backgroundColor: '#fff0f0', borderRadius: '8px', border: '1px solid #7a000044' }}>
              <AlertTriangle size={16} color="#7a0000" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ color: '#7a0000', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  Overbooked by {booked - maxCapacity} hours
                </div>
                <div style={{ color: '#7a0000', fontSize: '11px', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                  Consider extending deadlines or adding resources
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { orders } = useApp();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState<Record<string, string>>({});

  const loadReservations = async () => {
    try {
      const data = await api.fetchReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      setReservations([]);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleApproveReservation = async (id: string) => {
    await api.approveReservation(id);
    await loadReservations();
  };

  const handleRejectReservation = async (id: string) => {
    await api.rejectReservation(id);
    await loadReservations();
  };

  const handleRescheduleReservation = async (id: string) => {
    const date = rescheduleDate[id];
    if (!date) return;
    await api.rescheduleReservation(id, date);
    await loadReservations();
  };

  const pendingReservations = reservations.filter((r) => r.status === 'pending');
  const calendarEvents = reservations.map((r) => ({
    title: `${r.quoteNumber || 'Quote'} • ${r.status}`,
    date: r.reservationDate,
    color: r.status === 'approved' ? '#1a5c1a' : r.status === 'rejected' ? '#7a0000' : '#7a5200',
  }));

  // Calculate metrics
  const totalInquiries = orders.filter(o => o.status === 'inquiry').length;
  const activeInstallations = orders.filter(o => o.status === 'installation').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.approvedCost || o.estimatedCost), 0);
  const predictedRevenue = Math.round(totalRevenue * 1.18); // 18% growth projection

  const metrics = [
    {
      label: 'Pending Inquiries',
      value: totalInquiries,
      icon: Package,
      color: '#7a0000',
      bg: '#fff0f0',
      trend: '+12%',
    },
    {
      label: 'Active Installations',
      value: activeInstallations,
      icon: Calendar,
      color: '#1a5c1a',
      bg: '#e8f5e9',
    },
    {
      label: 'Predicted Revenue',
      value: `₱${Math.round(predictedRevenue / 1000)}k`,
      icon: DollarSign,
      color: '#005c7a',
      bg: '#e0f4ff',
      trend: '+18%',
    },
  ];

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100%', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Sales Forecast (2/3) */}
          <div className="lg:col-span-2">
            <SalesForecastChart />
          </div>

          {/* Right: Fabrication Capacity (1/3) */}
          <div>
            <FabricationCapacityGauge />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
              Pending Reservation List
            </div>
            {pendingReservations.length === 0 && (
              <div style={{ color: '#54667d', fontSize: '13px' }}>No pending reservations.</div>
            )}
            {pendingReservations.map((r) => (
              <div key={r.id} className="mb-3 p-3" style={{ border: '1px solid #e0e4ea', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, fontSize: '13px' }}>
                  {r.quoteNumber} • {r.customerName}
                </div>
                <div style={{ color: '#54667d', fontSize: '12px', marginBottom: '8px' }}>
                  Date: {r.reservationDate}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => handleApproveReservation(r.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#1a5c1a', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    Approve
                  </button>
                  <button onClick={() => handleRejectReservation(r.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#7a0000', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    Reject
                  </button>
                  <input
                    type="date"
                    value={rescheduleDate[r.id] || ''}
                    onChange={(e) => setRescheduleDate((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '5px 8px', fontSize: '12px' }}
                  />
                  <button onClick={() => handleRescheduleReservation(r.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #15263c', backgroundColor: 'white', color: '#15263c', fontSize: '12px', cursor: 'pointer' }}>
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
              Installation Calendar
            </div>
            <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" events={calendarEvents} height="auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
