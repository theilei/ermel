import { useState, useMemo } from 'react';
import {
  FileText, Search, Filter, Download, Eye, CheckCircle,
  Clock, Package, Hammer, Truck, ChevronLeft, ChevronRight,
  Calendar, DollarSign, User, ArrowUpDown,
} from 'lucide-react';
import { MOCK_ORDERS, type Order, type OrderStatus } from '../../data/mockData';

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: any }> = {
  inquiry:      { label: 'Inquiry',      color: '#54667d', bg: '#f0f3f7', icon: Clock },
  quotation:    { label: 'Quotation',    color: '#7a5200', bg: '#fff8e6', icon: FileText },
  ordering:     { label: 'Ordering',     color: '#005c7a', bg: '#e6f4f8', icon: Package },
  fabrication:  { label: 'Fabrication',  color: '#15263c', bg: '#e8ecf1', icon: Hammer },
  installation: { label: 'Installation', color: '#1a5c1a', bg: '#e8f5e9', icon: Truck },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc',  label: 'Oldest First' },
  { value: 'cost_desc', label: 'Highest Cost' },
  { value: 'cost_asc',  label: 'Lowest Cost' },
];

// ── Detail Drawer ──
function OrderDetailDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(21,38,60,0.45)',
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '440px', backgroundColor: 'white', height: '100vh',
          overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          padding: '32px 28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
              ORDER DETAIL
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 800 }}>
              {order.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ fontSize: 18, color: '#54667d' }}>×</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-6 p-3" style={{ backgroundColor: cfg.bg, borderRadius: '8px', border: `1px solid ${cfg.color}22` }}>
          <Icon size={16} color={cfg.color} />
          <span style={{ fontFamily: 'var(--font-heading)', color: cfg.color, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {cfg.label}
          </span>
        </div>

        {/* Info Grid */}
        {[
          { label: 'Customer', value: order.customer },
          { label: 'Project Type', value: order.project },
          { label: 'Phone', value: order.phone },
          { label: 'Email', value: order.email },
          { label: 'Material', value: order.material },
          { label: 'Glass Type', value: order.glassType },
          { label: 'Dimensions', value: order.dimensions },
          { label: 'Date Created', value: new Date(order.createdDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) },
          { label: 'Scheduled Date', value: order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid #f0f3f7' }}>
            <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{label}</span>
            <span style={{ color: '#15263c', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}

        {/* Cost Section */}
        <div className="mt-4 p-4" style={{ backgroundColor: '#f8f9fb', borderRadius: '8px', border: '1px solid #e0e4ea' }}>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            FINANCIALS
          </div>
          <div className="flex justify-between mb-2">
            <span style={{ color: '#54667d', fontSize: '13px' }}>Estimated Cost</span>
            <span style={{ color: '#15263c', fontSize: '13px', fontWeight: 600 }}>₱{order.estimatedCost.toLocaleString()}</span>
          </div>
          {order.approvedCost && (
            <div className="flex justify-between mb-2">
              <span style={{ color: '#54667d', fontSize: '13px' }}>Approved Cost</span>
              <span style={{ color: '#1a5c1a', fontSize: '13px', fontWeight: 700 }}>₱{order.approvedCost.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: '#54667d', fontSize: '13px' }}>Payment Status</span>
            <span style={{
              color: order.paid ? '#1a5c1a' : '#7a5200',
              fontSize: '12px', fontWeight: 700,
              backgroundColor: order.paid ? '#e8f5e9' : '#fff8e6',
              padding: '2px 8px', borderRadius: '4px',
            }}>
              {order.paid ? 'PAID' : 'UNPAID'}
            </span>
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 p-4" style={{ backgroundColor: '#fffbf0', borderRadius: '8px', border: '1px solid #f0e68c44' }}>
            <div style={{ color: '#7a5200', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>NOTES</div>
            <p style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──
export default function OrderLogs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let data = [...MOCK_ORDERS];
    if (statusFilter !== 'all') data = data.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.project.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'date_asc':  data.sort((a, b) => a.createdDate.localeCompare(b.createdDate)); break;
      case 'date_desc': data.sort((a, b) => b.createdDate.localeCompare(a.createdDate)); break;
      case 'cost_desc': data.sort((a, b) => b.estimatedCost - a.estimatedCost); break;
      case 'cost_asc':  data.sort((a, b) => a.estimatedCost - b.estimatedCost); break;
    }
    return data;
  }, [search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Summary stats
  const stats = useMemo(() => ({
    total: MOCK_ORDERS.length,
    totalRevenue: MOCK_ORDERS.reduce((s, o) => s + (o.approvedCost || o.estimatedCost), 0),
    paid: MOCK_ORDERS.filter((o) => o.paid).length,
    active: MOCK_ORDERS.filter((o) => o.status !== 'installation').length,
  }), []);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
          MANAGEMENT
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Order Logs
        </h1>
        <p style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
          Complete history of all customer orders and transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: stats.total, icon: FileText, color: '#15263c', bg: '#e8ecf1' },
          { label: 'Total Revenue', value: `₱${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: '#1a5c1a', bg: '#e8f5e9' },
          { label: 'Paid Orders', value: stats.paid, icon: CheckCircle, color: '#005c7a', bg: '#e6f4f8' },
          { label: 'Active Orders', value: stats.active, icon: Clock, color: '#7a5200', bg: '#fff8e6' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, backgroundColor: bg, borderRadius: '8px' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{ backgroundColor: '#f3f3f5', borderRadius: '6px', padding: '8px 12px' }}>
            <Search size={15} color="#54667d" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search orders, customers…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#15263c', width: '100%' }}
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderRadius: '6px', border: '1px solid #e0e4ea', background: showFilters ? '#15263c' : 'white', color: showFilters ? 'white' : '#54667d', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            <Filter size={14} />
            Filters
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '8px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', fontFamily: 'var(--font-body)', background: 'white' }}
          >
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Export */}
          <button
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', color: '#54667d', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 px-4 py-3" style={{ borderBottom: '1px solid #e0e4ea', backgroundColor: '#fafafa' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setCurrentPage(1); }}
                style={{
                  padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '0.04em',
                  border: statusFilter === f.value ? '1.5px solid #15263c' : '1.5px solid #e0e4ea',
                  backgroundColor: statusFilter === f.value ? '#15263c' : 'white',
                  color: statusFilter === f.value ? 'white' : '#54667d',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fb' }}>
                {['Order ID', 'Customer', 'Project', 'Material', 'Dimensions', 'Status', 'Cost', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e4ea' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : paginated.map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status];
                const Icon = cfg.icon;
                return (
                  <tr
                    key={order.id}
                    style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f3f7', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f5ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fafafa')}
                  >
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {order.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#e8ecf1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color="#54667d" />
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>{order.customer}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>{order.project}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px', whiteSpace: 'nowrap' }}>{order.material}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px', whiteSpace: 'nowrap' }}>{order.dimensions}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex items-center gap-1.5 px-2 py-1 w-fit" style={{ backgroundColor: cfg.bg, borderRadius: '6px' }}>
                        <Icon size={12} color={cfg.color} />
                        <span style={{ fontFamily: 'var(--font-heading)', color: cfg.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ₱{(order.approvedCost || order.estimatedCost).toLocaleString()}
                      {order.paid && (
                        <div style={{ color: '#1a5c1a', fontSize: '10px', fontWeight: 600, marginTop: 2 }}>PAID</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <div className="flex items-center gap-1">
                        <Calendar size={11} color="#54667d" />
                        {new Date(order.createdDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5"
                        style={{ borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e0e4ea' }}>
            <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={14} color="#54667d" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{ width: 32, height: 32, borderRadius: '6px', border: p === currentPage ? '1.5px solid #15263c' : '1px solid #e0e4ea', background: p === currentPage ? '#15263c' : 'white', color: p === currentPage ? 'white' : '#54667d', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={14} color="#54667d" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedOrder && (
        <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}