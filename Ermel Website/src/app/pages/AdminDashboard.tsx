import { useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Bell, Upload, RefreshCw, CheckCircle, AlertTriangle, X, Edit2, Save,
  Clock, Package, Hammer, Calendar, Activity, ChevronDown,
  PhilippinePeso,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACTIVITY_FEED, KANBAN_COLUMNS, Order, OrderStatus } from '../data/mockData';

const DRAG_TYPE = 'ORDER_CARD';

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    new_inquiry: Bell,
    payment_upload: Upload,
    status_update: RefreshCw,
    approved: CheckCircle,
  };
  const Icon = icons[type] || Bell;
  const colors: Record<string, string> = {
    new_inquiry: '#7a0000',
    payment_upload: '#1a5c1a',
    status_update: '#15263c',
    approved: '#005c7a',
  };
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${colors[type] || '#54667d'}22`, border: `1px solid ${colors[type] || '#54667d'}44` }}
    >
      <Icon size={14} color={colors[type] || '#54667d'} />
    </div>
  );
}

function KanbanCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPE,
    item: { id: order.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const statusBadge: Record<string, { color: string; bg: string }> = {
    inquiry: { color: '#7a0000', bg: '#fff0f0' },
    quotation: { color: '#7a5200', bg: '#fff8e1' },
    ordering: { color: '#005c7a', bg: '#e0f4ff' },
    fabrication: { color: '#15263c', bg: '#e8ecf0' },
    installation: { color: '#1a5c1a', bg: '#e8f5e9' },
  };

  const badge = statusBadge[order.status] || statusBadge.inquiry;

  return (
    <div
      ref={drag as any}
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e4ea',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.15s',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = '0 4px 16px rgba(21,38,60,0.14)';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
          {order.id}
        </span>
        {order.paid && (
          <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e8f5e9', color: '#1a5c1a', fontSize: '10px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            PAID
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
        {order.customer}
      </div>
      <div style={{ color: '#54667d', fontSize: '12px', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
        {order.project} · {order.glassType}
      </div>
      <div style={{ color: '#54667d', fontSize: '12px', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
        {order.dimensions}
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700 }}>
          ₱{(order.approvedCost ?? order.estimatedCost).toLocaleString()}
        </span>
        <span style={{ fontSize: '11px', color: '#aaa', fontFamily: 'var(--font-body)' }}>
          {order.scheduledDate || order.createdDate}
        </span>
      </div>
      {order.paymentUploaded && (
        <div className="mt-2 flex items-center gap-1" style={{ color: '#1a5c1a', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '0.05em' }}>
          <CheckCircle size={11} /> PROOF UPLOADED
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  orders,
  onDrop,
  onCardClick,
}: {
  column: { id: OrderStatus; label: string; color: string };
  orders: Order[];
  onDrop: (id: string, targetStatus: OrderStatus) => void;
  onCardClick: (order: Order) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DRAG_TYPE,
    drop: (item: { id: string }) => onDrop(item.id, column.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div
      ref={drop as any}
      style={{
        minWidth: '240px',
        width: '240px',
        flexShrink: 0,
        backgroundColor: isOver ? '#eef2f7' : '#f5f7fa',
        borderRadius: '10px',
        padding: '12px',
        border: `2px solid ${isOver ? column.color : '#e0e4ea'}`,
        transition: 'all 0.2s',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {column.label}
        </span>
        <span
          className="ml-auto px-2 py-0.5 rounded-full"
          style={{ backgroundColor: column.color, color: 'white', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}
        >
          {orders.length}
        </span>
      </div>
      <div>
        {orders.map((o) => (
          <KanbanCard key={o.id} order={o} onClick={() => onCardClick(o)} />
        ))}
        {orders.length === 0 && (
          <div
            className="text-center py-8 rounded-lg border-dashed border-2"
            style={{ borderColor: '#d9d9d9', color: '#bbb', fontSize: '13px', fontFamily: 'var(--font-body)' }}
          >
            No items
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectModal({ order, onClose, onApprovePrice, onStatusChange }: {
  order: Order;
  onClose: () => void;
  onApprovePrice: (id: string, price: number) => void;
  onStatusChange: (id: string, status: OrderStatus, date?: string) => void;
}) {
  const [editPrice, setEditPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(order.approvedCost ?? order.estimatedCost));
  const [schedDate, setSchedDate] = useState(order.scheduledDate || '');
  const [priceApproved, setPriceApproved] = useState(!!order.approvedCost);

  const handleSavePrice = () => {
    const p = parseFloat(priceInput);
    if (!isNaN(p) && p > 0) {
      onApprovePrice(order.id, p);
      setPriceApproved(true);
      setEditPrice(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'white', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#15263c' }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#9ab0c4', fontSize: '12px', letterSpacing: '0.12em' }}>
              PROJECT DETAILS
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '20px', fontWeight: 800 }}>
              {order.id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <X size={18} color="white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div style={{ color: '#54667d', fontSize: '12px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>CLIENT</div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700 }}>{order.customer}</div>
              <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{order.email}</div>
              <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{order.phone}</div>
            </div>
            <div>
              <div style={{ color: '#54667d', fontSize: '12px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>SPECIFICATION</div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700 }}>{order.project}</div>
              <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{order.glassType} · {order.material}</div>
              <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{order.dimensions}</div>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
              <div style={{ color: '#54667d', fontSize: '12px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>NOTES</div>
              <div style={{ color: '#15263c', fontSize: '14px', fontFamily: 'var(--font-body)' }}>{order.notes}</div>
            </div>
          )}

          {/* Price Approval */}
          <div className="p-5 rounded-xl" style={{ backgroundColor: '#f5f7fa', border: '2px solid #e0e4ea' }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PRICE APPROVAL
              </div>
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                  {priceApproved ? 'Approved' : 'Pending'}
                </span>
                <button
                  onClick={() => setPriceApproved(!priceApproved)}
                  className="relative w-12 h-6 rounded-full transition-all duration-200"
                  style={{ backgroundColor: priceApproved ? '#1a5c1a' : '#d9d9d9' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
                    style={{ backgroundColor: 'white', left: priceApproved ? '28px' : '4px' }}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div style={{ color: '#54667d', fontSize: '12px', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                  ESTIMATED
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '20px', fontWeight: 700 }}>
                  ₱{order.estimatedCost.toLocaleString()}
                </div>
              </div>
              <div className="flex-1">
                <div style={{ color: '#7a0000', fontSize: '12px', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                  APPROVED PRICE
                </div>
                {editPrice ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{ border: '2px solid #15263c', borderRadius: '6px', fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#15263c' }}
                      autoFocus
                    />
                    <button onClick={handleSavePrice} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1a5c1a' }}>
                      <Save size={15} color="white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 800 }}>
                      ₱{(order.approvedCost ?? order.estimatedCost).toLocaleString()}
                    </div>
                    <button onClick={() => setEditPrice(true)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
                      <Edit2 size={13} color="#54667d" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {priceApproved && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44' }}>
                <CheckCircle size={14} color="#1a5c1a" />
                <span style={{ color: '#1a5c1a', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                  Price approved. Customer will be notified and payment QR will be activated.
                </span>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              SCHEDULED DATE
            </div>
            <input
              type="date"
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
              className="px-4 py-3 rounded-lg outline-none"
              style={{
                border: '2px solid #d9d9d9',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'var(--font-body)',
                backgroundColor: 'white',
                color: '#15263c',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#15263c')}
              onBlur={(e) => (e.target.style.borderColor = '#d9d9d9')}
            />
          </div>

          {/* Status move */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'transparent',
                color: '#54667d',
                fontWeight: 600,
                letterSpacing: '0.06em',
                fontSize: '14px',
                padding: '11px',
                borderRadius: '8px',
                border: '2px solid #d9d9d9',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Close
            </button>
            <button
              onClick={() => { onStatusChange(order.id, order.status, schedDate); onClose(); }}
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #15263c, #1e3655)',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '14px',
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { orders, updateOrderStatus, updateOrderCost } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [conflictAlert, setConflictAlert] = useState<{ orderId: string; targetStatus: OrderStatus; conflictWith: Order } | null>(null);
  const [activityOpen, setActivityOpen] = useState(true);

  const metrics = [
    {
      label: 'Pending Inquiries',
      value: orders.filter((o) => o.status === 'inquiry').length,
      icon: Bell,
      color: '#7a0000',
      bg: '#fff0f0',
    },
    {
      label: 'Active Projects',
      value: orders.filter((o) => o.status !== 'installation').length,
      icon: Package,
      color: '#005c7a',
      bg: '#e0f4ff',
    },
    {
      label: 'Upcoming Installs',
      value: orders.filter((o) => o.status === 'installation').length,
      icon: Calendar,
      color: '#1a5c1a',
      bg: '#e8f5e9',
    },
    {
      label: 'Awaiting Payment',
      value: orders.filter((o) => !!o.approvedCost && !o.paid).length,
      icon: PhilippinePeso,
      color: '#7a5200',
      bg: '#fff8e1',
    },
  ];

  const handleDrop = (orderId: string, targetStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (order.status === targetStatus) return;

    if (targetStatus === 'installation') {
      const scheduled = order.scheduledDate;
      if (scheduled) {
        const conflict = orders.find(
          (o) => o.id !== orderId && o.status === 'installation' && o.scheduledDate === scheduled
        );
        if (conflict) {
          setConflictAlert({ orderId, targetStatus, conflictWith: conflict });
          return;
        }
      }
    }
    updateOrderStatus(orderId, targetStatus);
  };

  const forceMove = () => {
    if (conflictAlert) {
      updateOrderStatus(conflictAlert.orderId, conflictAlert.targetStatus);
      setConflictAlert(null);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingTop: '76px', fontFamily: 'var(--font-body)' }}>
        {/* Conflict Alert */}
        {conflictAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: 'white' }}>
              <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: '#7a0000' }}>
                <AlertTriangle size={22} color="white" />
                <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase' }}>
                  SCHEDULING CONFLICT
                </div>
              </div>
              <div className="p-6">
                <p style={{ color: '#15263c', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px', fontFamily: 'var(--font-body)' }}>
                  The scheduled date for this project conflicts with{' '}
                  <strong>{conflictAlert.conflictWith.customer}</strong> ({conflictAlert.conflictWith.id}), which is already booked for installation on the same date.
                </p>
                <div className="p-3 rounded-lg mb-6" style={{ backgroundColor: '#fff0f0', border: '1px solid #ffaaaa' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em' }}>
                    CONFLICTING DATE: {conflictAlert.conflictWith.scheduledDate}
                  </div>
                  <div style={{ color: '#7a0000', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                    {conflictAlert.conflictWith.customer} · {conflictAlert.conflictWith.project}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConflictAlert(null)}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-heading)',
                      background: 'transparent',
                      color: '#54667d',
                      fontWeight: 600,
                      fontSize: '14px',
                      padding: '11px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={forceMove}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-heading)',
                      background: 'linear-gradient(135deg, #7a0000, #a50000)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '14px',
                      padding: '11px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Override & Move
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project modal */}
        {selectedOrder && (
          <ProjectModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onApprovePrice={updateOrderCost}
            onStatusChange={updateOrderStatus}
          />
        )}

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
                ADMIN PORTAL
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1 }}>
                ORDER MANAGEMENT
              </h1>
            </div>
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'white', border: '1px solid #e0e4ea' }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#1a5c1a' }} />
              <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Live Dashboard</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-5"
                style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                    <m.icon size={20} color={m.color} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', color: m.color, fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
                    {m.value}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Main content: Kanban + Activity */}
          <div className="flex gap-6">
            {/* Kanban */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  KANBAN BOARD
                </h2>
                <span style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                  Drag cards to update status · Click to view details
                </span>
              </div>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                  {KANBAN_COLUMNS.map((col) => (
                    <KanbanColumn
                      key={col.id}
                      column={col}
                      orders={orders.filter((o) => o.status === col.id)}
                      onDrop={handleDrop}
                      onCardClick={setSelectedOrder}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div style={{ width: '280px', flexShrink: 0 }}>
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: 'white', border: '1px solid #e0e4ea' }}
              >
                <button
                  className="w-full px-5 py-4 flex items-center justify-between"
                  style={{ backgroundColor: '#15263c' }}
                  onClick={() => setActivityOpen(!activityOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Activity size={16} color="#9ab0c4" />
                    <span style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      ACTIVITY FEED
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#7a0000', color: 'white', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                    >
                      {ACTIVITY_FEED.length}
                    </span>
                    <ChevronDown
                      size={14}
                      color="white"
                      style={{ transform: activityOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                    />
                  </div>
                </button>
                {activityOpen && (
                  <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                    {ACTIVITY_FEED.map((item, idx) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 flex gap-3"
                        style={{ borderBottom: idx < ACTIVITY_FEED.length - 1 ? '1px solid #f0f2f5' : 'none' }}
                      >
                        <ActivityIcon type={item.type} />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '13px', lineHeight: 1.4, marginBottom: '2px' }}>
                            {item.message}
                          </div>
                          <div style={{ color: '#54667d', fontSize: '11px', fontFamily: 'var(--font-body)', marginBottom: '2px' }}>
                            {item.detail}
                          </div>
                          <div style={{ color: '#aaa', fontSize: '11px', fontFamily: 'var(--font-body)' }}>
                            {item.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}