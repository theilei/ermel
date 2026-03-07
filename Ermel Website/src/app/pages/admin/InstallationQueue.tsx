// ============================================================
// Admin Installation Queue Page
// ============================================================
import { useState, useMemo } from 'react';
import {
  Package, Hammer, Truck, CheckCircle, Filter,
  ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import { useQuotes } from '../../context/QuoteContext';
import type { InstallationStatus } from '../../types/quotation';
import { INSTALLATION_STATUS_LABELS, INSTALLATION_STATUS_COLORS } from '../../types/quotation';

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS: { value: InstallationStatus; label: string; icon: any }[] = [
  { value: 'materials_ordered', label: 'Materials Ordered', icon: Package },
  { value: 'fabrication', label: 'Fabrication', icon: Hammer },
  { value: 'installation', label: 'Installation', icon: Truck },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

export default function InstallationQueue() {
  const { installationOrders, updateInstallationStatus } = useQuotes();

  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<InstallationStatus>('materials_ordered');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return installationOrders;
    return installationOrders.filter((o) => o.installationStatus === statusFilter);
  }, [installationOrders, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleUpdateStatus = (orderId: string) => {
    updateInstallationStatus(orderId, editStatus);
    setEditingOrder(null);
  };

  // Stats
  const stats = useMemo(() => ({
    total: installationOrders.length,
    materialsOrdered: installationOrders.filter((o) => o.installationStatus === 'materials_ordered').length,
    fabrication: installationOrders.filter((o) => o.installationStatus === 'fabrication').length,
    installation: installationOrders.filter((o) => o.installationStatus === 'installation').length,
    completed: installationOrders.filter((o) => o.installationStatus === 'completed').length,
  }), [installationOrders]);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
          OPERATIONS
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Installation Queue
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {STATUS_OPTIONS.map((opt) => {
          const count = installationOrders.filter((o) => o.installationStatus === opt.value).length;
          const colors = INSTALLATION_STATUS_COLORS[opt.value];
          const Icon = opt.icon;
          return (
            <div
              key={opt.value}
              className="p-4 rounded-lg cursor-pointer transition-all"
              style={{
                backgroundColor: statusFilter === opt.value ? colors.bg : 'white',
                border: `1px solid ${statusFilter === opt.value ? colors.border : '#e0e4ea'}`,
                borderRadius: '8px',
              }}
              onClick={() => { setStatusFilter(statusFilter === opt.value ? 'all' : opt.value); setCurrentPage(1); }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ backgroundColor: colors.bg }}>
                  <Icon size={18} color={colors.text} />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', color: colors.text, fontSize: '24px', fontWeight: 800 }}>
                  {count}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', color: colors.text, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {opt.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} color="#54667d" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '10px 32px 10px 12px',
            border: '1px solid #e0e4ea',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            backgroundColor: 'white',
            color: '#15263c',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'auto',
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e4ea' }}>
                {['Order ID', 'Customer Name', 'Project Type', 'Dimensions', 'Order Date', 'Schedule', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#54667d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-3">
                      <Truck size={40} color="#d9d9d9" />
                      <div style={{ color: '#aaa', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase' }}>
                        No orders in queue
                      </div>
                      <div style={{ color: '#aaa', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                        Orders will appear here once quotes are converted.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const statusColors = INSTALLATION_STATUS_COLORS[order.installationStatus];
                  const isEditing = editingOrder === order.id;

                  return (
                    <tr
                      key={order.id}
                      style={{ borderBottom: '1px solid #f0f2f5' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafbfc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: '#15263c', letterSpacing: '0.04em' }}>
                          {order.id}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ab0c4', fontFamily: 'var(--font-body)' }}>
                          Ref: {order.quoteId}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, color: '#15263c' }}>
                        {order.customerName}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                        {order.projectType}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {order.dimensions}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {order.orderDate}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {order.installationSchedule || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as InstallationStatus)}
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #e0e4ea',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 600,
                              color: '#15263c',
                              outline: 'none',
                              appearance: 'auto',
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="px-2 py-1 rounded-md"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.text,
                              border: `1px solid ${statusColors.border}`,
                              fontSize: '11px',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {INSTALLATION_STATUS_LABELS[order.installationStatus]}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateStatus(order.id)}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #1a5c1a, #2e7d2e)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                fontSize: '11px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingOrder(null)}
                              style={{
                                padding: '6px 12px',
                                border: '1px solid #e0e4ea',
                                borderRadius: '6px',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                fontSize: '11px',
                                color: '#54667d',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingOrder(order.id); setEditStatus(order.installationStatus); }}
                            style={{
                              padding: '6px 14px',
                              border: '1px solid #e0e4ea',
                              borderRadius: '6px',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 700,
                              fontSize: '11px',
                              color: '#54667d',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f7fa'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                          >
                            Update Status
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f0f2f5' }}>
            <div style={{ fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e4ea',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={14} color="#54667d" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className="px-3 py-1.5 rounded"
                  style={{
                    backgroundColor: p === currentPage ? '#15263c' : 'transparent',
                    color: p === currentPage ? 'white' : '#54667d',
                    border: p === currentPage ? 'none' : '1px solid #e0e4ea',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e4ea',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight size={14} color="#54667d" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
