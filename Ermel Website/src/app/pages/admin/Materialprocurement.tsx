import { useState, useMemo } from 'react';
import {
  Package, Plus, Search, AlertTriangle, CheckCircle2,
  Clock, Truck, ShoppingCart, ChevronLeft, ChevronRight,
  TrendingUp, Edit2, Save, X, Filter,
} from 'lucide-react';

type ProcurementStatus = 'in_stock' | 'low_stock' | 'ordered' | 'out_of_stock';
type Category = 'Glass' | 'Aluminum' | 'Hardware' | 'Sealant' | 'Accessories';

interface Material {
  id: string;
  name: string;
  category: Category;
  unit: string;
  stockQty: number;
  minStock: number;
  unitCost: number;
  supplier: string;
  lastOrdered: string;
  status: ProcurementStatus;
  pendingQty?: number;
}

interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  items: number;
  totalCost: number;
  status: 'pending' | 'delivered' | 'partial';
}

const INITIAL_MATERIALS: Material[] = [
  { id: 'MAT-001', name: 'Clear Float Glass 6mm', category: 'Glass', unit: 'sqm', stockQty: 45, minStock: 20, unitCost: 480, supplier: 'San Miguel Glass', lastOrdered: '2026-02-15', status: 'in_stock' },
  { id: 'MAT-002', name: 'Tempered Glass 10mm', category: 'Glass', unit: 'sqm', stockQty: 8, minStock: 15, unitCost: 1200, supplier: 'Philippine Glass Corp', lastOrdered: '2026-02-10', status: 'low_stock' },
  { id: 'MAT-003', name: 'Frosted Glass 6mm', category: 'Glass', unit: 'sqm', stockQty: 0, minStock: 10, unitCost: 620, supplier: 'San Miguel Glass', lastOrdered: '2026-01-28', status: 'out_of_stock' },
  { id: 'MAT-004', name: 'Bronze Glass 5mm', category: 'Glass', unit: 'sqm', stockQty: 22, minStock: 10, unitCost: 550, supplier: 'San Miguel Glass', lastOrdered: '2026-02-20', status: 'in_stock' },
  { id: 'MAT-005', name: 'Aluminum Profile 3in (Silver)', category: 'Aluminum', unit: 'length', stockQty: 60, minStock: 30, unitCost: 380, supplier: 'Altech Industrial', lastOrdered: '2026-02-18', status: 'in_stock' },
  { id: 'MAT-006', name: 'Aluminum Profile 2in (Bronze)', category: 'Aluminum', unit: 'length', stockQty: 14, minStock: 25, unitCost: 320, supplier: 'Altech Industrial', lastOrdered: '2026-02-05', status: 'low_stock', pendingQty: 40 },
  { id: 'MAT-007', name: 'Stainless Patch Fitting Set', category: 'Hardware', unit: 'set', stockQty: 12, minStock: 5, unitCost: 2800, supplier: 'Dorma Hardware', lastOrdered: '2026-02-12', status: 'in_stock' },
  { id: 'MAT-008', name: 'Sliding Door Roller', category: 'Hardware', unit: 'pcs', stockQty: 3, minStock: 10, unitCost: 450, supplier: 'Dorma Hardware', lastOrdered: '2026-01-30', status: 'low_stock' },
  { id: 'MAT-009', name: 'Silicone Sealant (Transparent)', category: 'Sealant', unit: 'tube', stockQty: 88, minStock: 24, unitCost: 180, supplier: 'Dow Chemical PH', lastOrdered: '2026-02-22', status: 'in_stock' },
  { id: 'MAT-010', name: 'Frame Gasket Strip', category: 'Accessories', unit: 'meter', stockQty: 0, minStock: 50, unitCost: 45, supplier: 'Rubber Depot PH', lastOrdered: '2026-01-20', status: 'out_of_stock', pendingQty: 200 },
];

const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 'PO-2026-012', date: '2026-03-08', supplier: 'Altech Industrial', items: 3, totalCost: 18400, status: 'pending' },
  { id: 'PO-2026-011', date: '2026-03-05', supplier: 'San Miguel Glass', items: 2, totalCost: 32000, status: 'delivered' },
  { id: 'PO-2026-010', date: '2026-02-28', supplier: 'Rubber Depot PH', items: 1, totalCost: 9000, status: 'partial' },
  { id: 'PO-2026-009', date: '2026-02-20', supplier: 'Dorma Hardware', items: 4, totalCost: 24500, status: 'delivered' },
];

const STATUS_CFG: Record<ProcurementStatus, { label: string; color: string; bg: string; icon: any }> = {
  in_stock:     { label: 'In Stock',     color: '#1a5c1a', bg: '#e8f5e9', icon: CheckCircle2 },
  low_stock:    { label: 'Low Stock',    color: '#7a5200', bg: '#fff8e6', icon: AlertTriangle },
  ordered:      { label: 'Ordered',      color: '#005c7a', bg: '#e6f4f8', icon: Truck },
  out_of_stock: { label: 'Out of Stock', color: '#7a0000', bg: '#fde8e8', icon: X },
};

const PO_STATUS_CFG = {
  pending:   { label: 'Pending',   color: '#7a5200', bg: '#fff8e6' },
  delivered: { label: 'Delivered', color: '#1a5c1a', bg: '#e8f5e9' },
  partial:   { label: 'Partial',   color: '#005c7a', bg: '#e6f4f8' },
};

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'Glass', label: 'Glass' },
  { value: 'Aluminum', label: 'Aluminum' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Sealant', label: 'Sealant' },
  { value: 'Accessories', label: 'Accessories' },
];

const ITEMS_PER_PAGE = 8;

// ── Add Order Modal ──
function AddOrderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ supplier: '', material: '', qty: '', notes: '' });
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(21,38,60,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 480, backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>NEW</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 800 }}>Create Purchase Order</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#54667d" />
          </button>
        </div>
        {[
          { label: 'Supplier', key: 'supplier', placeholder: 'e.g. San Miguel Glass' },
          { label: 'Material / Item', key: 'material', placeholder: 'e.g. Clear Float Glass 6mm' },
          { label: 'Quantity', key: 'qty', placeholder: 'e.g. 50 sqm' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} className="mb-4">
            <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
            <input
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div className="mb-6">
          <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Additional instructions for this order…"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#54667d', fontSize: '14px' }}>
            Cancel
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '6px', border: 'none', background: '#15263c', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'white', fontSize: '14px' }}>
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function MaterialProcurement() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');

  const filtered = useMemo(() => {
    let data = [...INITIAL_MATERIALS];
    if (categoryFilter !== 'all') data = data.filter((m) => m.category === categoryFilter);
    if (statusFilter !== 'all') data = data.filter((m) => m.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((m) => m.name.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q));
    }
    return data;
  }, [search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const alertItems = INITIAL_MATERIALS.filter((m) => m.status === 'low_stock' || m.status === 'out_of_stock');
  const totalInventoryValue = INITIAL_MATERIALS.reduce((s, m) => s + m.stockQty * m.unitCost, 0);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            MANAGEMENT
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Material Procurement
          </h1>
          <p style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
            Inventory tracking and purchase order management
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderRadius: '8px', background: '#15263c', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px' }}
        >
          <Plus size={16} />
          New Purchase Order
        </button>
      </div>

      {/* Alert Banner */}
      {alertItems.length > 0 && (
        <div className="flex items-start gap-3 p-4 mb-6" style={{ backgroundColor: '#fff8e6', border: '1px solid #f0c040', borderRadius: '8px' }}>
          <AlertTriangle size={18} color="#7a5200" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#7a5200', fontSize: '13px', fontWeight: 700 }}>
              {alertItems.length} item{alertItems.length > 1 ? 's' : ''} require restocking
            </div>
            <div style={{ color: '#7a5200', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
              {alertItems.map((m) => m.name).join(' • ')}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Items', value: INITIAL_MATERIALS.length, icon: Package, color: '#15263c', bg: '#e8ecf1' },
          { label: 'Inventory Value', value: `₱${(totalInventoryValue / 1000).toFixed(0)}K`, icon: TrendingUp, color: '#1a5c1a', bg: '#e8f5e9' },
          { label: 'Low / Out of Stock', value: alertItems.length, icon: AlertTriangle, color: '#7a5200', bg: '#fff8e6' },
          { label: 'Pending Orders', value: PURCHASE_ORDERS.filter(p => p.status === 'pending').length, icon: ShoppingCart, color: '#005c7a', bg: '#e6f4f8' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
            <div className="mb-3">
              <div style={{ width: 40, height: 40, backgroundColor: bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1" style={{ backgroundColor: '#f3f3f5', borderRadius: '8px', width: 'fit-content' }}>
        {[
          { key: 'inventory', label: 'Inventory' },
          { key: 'orders', label: 'Purchase Orders' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            style={{
              padding: '7px 20px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 600,
              border: 'none',
              backgroundColor: activeTab === key ? '#15263c' : 'transparent',
              color: activeTab === key ? 'white' : '#54667d',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── INVENTORY TAB ── */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{ backgroundColor: '#f3f3f5', borderRadius: '6px', padding: '8px 12px' }}>
              <Search size={15} color="#54667d" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search materials, suppliers…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#15263c', width: '100%' }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '8px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
            >
              {CATEGORY_FILTERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '8px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fb' }}>
                  {['Item ID', 'Material Name', 'Category', 'Stock', 'Min Stock', 'Unit Cost', 'Total Value', 'Supplier', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e4ea' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((mat, idx) => {
                  const cfg = STATUS_CFG[mat.status];
                  const Icon = cfg.icon;
                  const stockPct = Math.min(100, (mat.stockQty / (mat.minStock * 3)) * 100);
                  const isEditing = editingId === mat.id;
                  return (
                    <tr
                      key={mat.id}
                      style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f3f7' }}
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '12px', fontWeight: 700 }}>{mat.id}</td>
                      <td style={{ padding: '14px 16px', minWidth: 180 }}>
                        <div style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>{mat.name}</div>
                        {mat.pendingQty && (
                          <div style={{ color: '#005c7a', fontSize: '11px', marginTop: 2 }}>+{mat.pendingQty} {mat.unit} ordered</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f0f3f7', color: '#54667d', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                          {mat.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: 120 }}>
                        {isEditing ? (
                          <input
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            style={{ width: 70, padding: '4px 8px', border: '1.5px solid #15263c', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none' }}
                          />
                        ) : (
                          <div>
                            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>
                              {mat.stockQty} <span style={{ color: '#54667d', fontWeight: 400, fontSize: '11px' }}>{mat.unit}</span>
                            </div>
                            {/* Stock bar */}
                            <div style={{ marginTop: 4, height: 4, width: 80, backgroundColor: '#e0e4ea', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${stockPct}%`, backgroundColor: mat.status === 'out_of_stock' ? '#7a0000' : mat.status === 'low_stock' ? '#f0c040' : '#1a5c1a', borderRadius: 2 }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>{mat.minStock} {mat.unit}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>₱{mat.unitCost.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>₱{(mat.stockQty * mat.unitCost).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px', whiteSpace: 'nowrap' }}>{mat.supplier}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-1.5 px-2 py-1 w-fit" style={{ backgroundColor: cfg.bg, borderRadius: '6px' }}>
                          <Icon size={11} color={cfg.color} />
                          <span style={{ fontFamily: 'var(--font-heading)', color: cfg.color, fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ width: 28, height: 28, borderRadius: '4px', border: 'none', background: '#15263c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Save size={13} color="white" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ width: 28, height: 28, borderRadius: '4px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <X size={13} color="#54667d" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditingId(mat.id); setEditQty(String(mat.stockQty)); }}
                              style={{ width: 28, height: 28, borderRadius: '4px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Edit stock"
                            >
                              <Edit2 size={12} color="#54667d" />
                            </button>
                            <button
                              onClick={() => setShowAddModal(true)}
                              style={{ width: 28, height: 28, borderRadius: '4px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Order more"
                            >
                              <ShoppingCart size={12} color="#54667d" />
                            </button>
                          </div>
                        )}
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
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={14} color="#54667d" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setCurrentPage(p)} style={{ width: 32, height: 32, borderRadius: '6px', border: p === currentPage ? '1.5px solid #15263c' : '1px solid #e0e4ea', background: p === currentPage ? '#15263c' : 'white', color: p === currentPage ? 'white' : '#54667d', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#54667d" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PURCHASE ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700 }}>
              Recent Purchase Orders
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fb' }}>
                  {['PO Number', 'Date', 'Supplier', 'Items', 'Total Cost', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e4ea' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PURCHASE_ORDERS.map((po, idx) => {
                  const cfg = PO_STATUS_CFG[po.status];
                  return (
                    <tr key={po.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f3f7' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>{po.id}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>
                        {new Date(po.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>{po.supplier}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>{po.items} item{po.items > 1 ? 's' : ''}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>₱{po.totalCost.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: cfg.bg, color: cfg.color, fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && <AddOrderModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}