import { useEffect, useMemo, useState } from 'react';
import {
  Package, Search, AlertTriangle, CheckCircle2,
  TrendingUp, Edit2, Save, X, Filter,
  ChevronLeft, ChevronRight, Brain, ArrowUp,
  Info, Layers, Wrench, Droplets, Box, Zap,
  BarChart2, AlertCircle, ShieldCheck, Clock,
} from 'lucide-react';
import { fetchAdminMaterialDemandTrends, type MaterialDemandTrends } from '../../services/api';

type ProcurementStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
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
  leadDays: number;
}

// Full material catalogue
const INITIAL_MATERIALS: Material[] = [
  // Glass
  { id: 'MAT-001', name: 'Clear Float Glass 6mm',            category: 'Glass',       unit: 'sqm',    stockQty: 45,  minStock: 20,  unitCost: 480,   supplier: 'San Miguel Glass',       lastOrdered: '2026-02-15', status: 'in_stock',    leadDays: 5  },
  { id: 'MAT-002', name: 'Tempered Glass 6mm (Clear)',        category: 'Glass',       unit: 'sqm',    stockQty: 30,  minStock: 15,  unitCost: 890,   supplier: 'Philippine Glass Corp',  lastOrdered: '2026-02-20', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-003', name: 'Tempered Glass 10mm (Clear)',       category: 'Glass',       unit: 'sqm',    stockQty: 8,   minStock: 15,  unitCost: 1200,  supplier: 'Philippine Glass Corp',  lastOrdered: '2026-02-10', status: 'low_stock',   leadDays: 7  },
  { id: 'MAT-004', name: 'Tempered Glass 12mm (Clear)',       category: 'Glass',       unit: 'sqm',    stockQty: 12,  minStock: 10,  unitCost: 1550,  supplier: 'Philippine Glass Corp',  lastOrdered: '2026-02-08', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-005', name: 'Laminated Glass 8mm',               category: 'Glass',       unit: 'sqm',    stockQty: 5,   minStock: 12,  unitCost: 1450,  supplier: 'San Miguel Glass',       lastOrdered: '2026-01-25', status: 'low_stock',   leadDays: 10 },
  { id: 'MAT-006', name: 'Frosted Glass 6mm',                 category: 'Glass',       unit: 'sqm',    stockQty: 0,   minStock: 10,  unitCost: 620,   supplier: 'San Miguel Glass',       lastOrdered: '2026-01-28', status: 'out_of_stock',leadDays: 5  },
  { id: 'MAT-007', name: 'Sandblasted Glass 6mm',             category: 'Glass',       unit: 'sqm',    stockQty: 12,  minStock: 8,   unitCost: 780,   supplier: 'San Miguel Glass',       lastOrdered: '2026-02-12', status: 'in_stock',    leadDays: 5  },
  { id: 'MAT-008', name: 'Bronze Tinted Glass 5mm',           category: 'Glass',       unit: 'sqm',    stockQty: 22,  minStock: 10,  unitCost: 550,   supplier: 'San Miguel Glass',       lastOrdered: '2026-02-20', status: 'in_stock',    leadDays: 5  },
  { id: 'MAT-009', name: 'Euro Gray Tinted Glass 6mm',        category: 'Glass',       unit: 'sqm',    stockQty: 6,   minStock: 10,  unitCost: 570,   supplier: 'San Miguel Glass',       lastOrdered: '2026-01-30', status: 'low_stock',   leadDays: 5  },
  { id: 'MAT-010', name: 'Dark Gray Tinted Glass 6mm',        category: 'Glass',       unit: 'sqm',    stockQty: 14,  minStock: 8,   unitCost: 590,   supplier: 'San Miguel Glass',       lastOrdered: '2026-02-18', status: 'in_stock',    leadDays: 5  },
  { id: 'MAT-011', name: 'Green Tinted Glass 6mm',            category: 'Glass',       unit: 'sqm',    stockQty: 0,   minStock: 8,   unitCost: 600,   supplier: 'San Miguel Glass',       lastOrdered: '2026-01-20', status: 'out_of_stock',leadDays: 5  },
  { id: 'MAT-012', name: 'Heat-Resistant Tempered Glass 10mm',category: 'Glass',       unit: 'sqm',    stockQty: 4,   minStock: 8,   unitCost: 1800,  supplier: 'Philippine Glass Corp',  lastOrdered: '2026-01-15', status: 'low_stock',   leadDays: 14 },
  { id: 'MAT-013', name: 'Reflective Glass (Blue) 6mm',       category: 'Glass',       unit: 'sqm',    stockQty: 15,  minStock: 8,   unitCost: 750,   supplier: 'Philippine Glass Corp',  lastOrdered: '2026-02-10', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-014', name: 'Reflective Glass (Silver) 6mm',     category: 'Glass',       unit: 'sqm',    stockQty: 10,  minStock: 8,   unitCost: 730,   supplier: 'Philippine Glass Corp',  lastOrdered: '2026-02-05', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-015', name: 'Mirror Glass 5mm',                  category: 'Glass',       unit: 'sqm',    stockQty: 7,   minStock: 12,  unitCost: 680,   supplier: 'San Miguel Glass',       lastOrdered: '2026-02-01', status: 'low_stock',   leadDays: 5  },

  // Aluminum 
  { id: 'MAT-016', name: 'Aluminum Profile 2in (Silver)',      category: 'Aluminum',   unit: 'length', stockQty: 35,  minStock: 20,  unitCost: 280,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-22', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-017', name: 'Aluminum Profile 3in (Silver)',      category: 'Aluminum',   unit: 'length', stockQty: 60,  minStock: 30,  unitCost: 380,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-18', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-018', name: 'Aluminum Profile 4in (Silver)',      category: 'Aluminum',   unit: 'length', stockQty: 28,  minStock: 15,  unitCost: 480,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-15', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-019', name: 'Aluminum Profile 2in (Bronze)',      category: 'Aluminum',   unit: 'length', stockQty: 14,  minStock: 25,  unitCost: 320,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-05', status: 'low_stock',   leadDays: 3  },
  { id: 'MAT-020', name: 'Aluminum Profile 3in (Champagne)',   category: 'Aluminum',   unit: 'length', stockQty: 10,  minStock: 20,  unitCost: 400,   supplier: 'Altech Industrial',      lastOrdered: '2026-01-28', status: 'low_stock',   leadDays: 3  },
  { id: 'MAT-021', name: 'Aluminum Profile 2in (Anodized Black)',category:'Aluminum',  unit: 'length', stockQty: 22,  minStock: 15,  unitCost: 350,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-10', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-022', name: 'Aluminum Profile 2in (Charcoal)',    category: 'Aluminum',   unit: 'length', stockQty: 8,   minStock: 15,  unitCost: 340,   supplier: 'Altech Industrial',      lastOrdered: '2026-01-25', status: 'low_stock',   leadDays: 3  },
  { id: 'MAT-023', name: 'Aluminum Profile 3in (Wood Grain)',  category: 'Aluminum',   unit: 'length', stockQty: 18,  minStock: 10,  unitCost: 420,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-18', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-024', name: 'Aluminum Composite Panel (ACP)',     category: 'Aluminum',   unit: 'sheet',  stockQty: 40,  minStock: 15,  unitCost: 1200,  supplier: 'ACP Philippines',        lastOrdered: '2026-02-20', status: 'in_stock',    leadDays: 5  },
  { id: 'MAT-025', name: 'Aluminum Corner Key',                category: 'Aluminum',   unit: 'pcs',    stockQty: 150, minStock: 80,  unitCost: 18,    supplier: 'Altech Industrial',      lastOrdered: '2026-02-22', status: 'in_stock',    leadDays: 3  },

  // Hardware
  { id: 'MAT-026', name: 'Stainless Patch Fitting Set',        category: 'Hardware',   unit: 'set',    stockQty: 12,  minStock: 5,   unitCost: 2800,  supplier: 'Dorma Hardware',         lastOrdered: '2026-02-12', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-027', name: 'Sliding Door Roller',                category: 'Hardware',   unit: 'pcs',    stockQty: 3,   minStock: 10,  unitCost: 450,   supplier: 'Dorma Hardware',         lastOrdered: '2026-01-30', status: 'low_stock',   leadDays: 7  },
  { id: 'MAT-028', name: 'Floor Spring Closer',                category: 'Hardware',   unit: 'unit',   stockQty: 7,   minStock: 5,   unitCost: 3500,  supplier: 'Dorma Hardware',         lastOrdered: '2026-02-10', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-029', name: 'Glass Door Pivot Hinge (Heavy-Duty)',category: 'Hardware',   unit: 'set',    stockQty: 15,  minStock: 8,   unitCost: 1200,  supplier: 'Dorma Hardware',         lastOrdered: '2026-02-15', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-030', name: 'Stainless Pull Handle (18in)',       category: 'Hardware',   unit: 'pcs',    stockQty: 22,  minStock: 10,  unitCost: 850,   supplier: 'Dorma Hardware',         lastOrdered: '2026-02-20', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-031', name: 'Glass Door Lock Set',                category: 'Hardware',   unit: 'set',    stockQty: 4,   minStock: 8,   unitCost: 1650,  supplier: 'Dorma Hardware',         lastOrdered: '2026-01-28', status: 'low_stock',   leadDays: 7  },
  { id: 'MAT-032', name: 'Window Handle / Latch',              category: 'Hardware',   unit: 'pcs',    stockQty: 30,  minStock: 15,  unitCost: 320,   supplier: 'Dorma Hardware',         lastOrdered: '2026-02-22', status: 'in_stock',    leadDays: 7  },
  { id: 'MAT-033', name: 'Shower Door Hinge (Glass-to-Wall)',  category: 'Hardware',   unit: 'set',    stockQty: 6,   minStock: 8,   unitCost: 980,   supplier: 'Dorma Hardware',         lastOrdered: '2026-02-01', status: 'low_stock',   leadDays: 7  },
  { id: 'MAT-034', name: 'Glass Spider Fitting / Clamp',       category: 'Hardware',   unit: 'pcs',    stockQty: 0,   minStock: 6,   unitCost: 1800,  supplier: 'Dorma Hardware',         lastOrdered: '2026-01-15', status: 'out_of_stock',leadDays: 10 },

  // Sealant
  { id: 'MAT-035', name: 'Silicone Sealant (Transparent)',     category: 'Sealant',    unit: 'tube',   stockQty: 88,  minStock: 24,  unitCost: 180,   supplier: 'Dow Chemical PH',        lastOrdered: '2026-02-22', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-036', name: 'Silicone Sealant (Black)',           category: 'Sealant',    unit: 'tube',   stockQty: 45,  minStock: 20,  unitCost: 185,   supplier: 'Dow Chemical PH',        lastOrdered: '2026-02-20', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-037', name: 'Silicone Sealant (White)',           category: 'Sealant',    unit: 'tube',   stockQty: 10,  minStock: 20,  unitCost: 185,   supplier: 'Dow Chemical PH',        lastOrdered: '2026-01-30', status: 'low_stock',   leadDays: 3  },
  { id: 'MAT-038', name: 'Structural Silicone (Gray)',         category: 'Sealant',    unit: 'tube',   stockQty: 25,  minStock: 12,  unitCost: 420,   supplier: 'Dow Chemical PH',        lastOrdered: '2026-02-18', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-039', name: 'Polyurethane Foam Sealant',          category: 'Sealant',    unit: 'can',    stockQty: 0,   minStock: 12,  unitCost: 280,   supplier: 'Dow Chemical PH',        lastOrdered: '2026-01-20', status: 'out_of_stock',leadDays: 3  },

  // Accessories
  { id: 'MAT-040', name: 'Frame Gasket Strip',                 category: 'Accessories',unit: 'meter',  stockQty: 0,   minStock: 50,  unitCost: 45,    supplier: 'Rubber Depot PH',        lastOrdered: '2026-01-20', status: 'out_of_stock',leadDays: 5  },
  { id: 'MAT-041', name: 'EPDM Setting Block',                 category: 'Accessories',unit: 'pcs',    stockQty: 200, minStock: 80,  unitCost: 12,    supplier: 'Rubber Depot PH',        lastOrdered: '2026-02-22', status: 'in_stock',    leadDays: 5  },
  { id: 'MAT-042', name: 'Self-Adhesive Foam Tape (9mm)',      category: 'Accessories',unit: 'roll',   stockQty: 15,  minStock: 20,  unitCost: 95,    supplier: 'Rubber Depot PH',        lastOrdered: '2026-02-05', status: 'low_stock',   leadDays: 5  },
  { id: 'MAT-043', name: 'Weep Hole Cover',                    category: 'Accessories',unit: 'pcs',    stockQty: 80,  minStock: 40,  unitCost: 8,     supplier: 'Altech Industrial',      lastOrdered: '2026-02-18', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-044', name: 'Curtain Wall Bracket Set',           category: 'Accessories',unit: 'set',    stockQty: 25,  minStock: 10,  unitCost: 680,   supplier: 'Altech Industrial',      lastOrdered: '2026-02-15', status: 'in_stock',    leadDays: 3  },
  { id: 'MAT-045', name: 'Thermal Break Strip',                category: 'Accessories',unit: 'meter',  stockQty: 60,  minStock: 30,  unitCost: 85,    supplier: 'Rubber Depot PH',        lastOrdered: '2026-02-12', status: 'in_stock',    leadDays: 5  },
];

// Config 
const STATUS_CFG: Record<ProcurementStatus, { label: string; color: string; bg: string; icon: any }> = {
  in_stock:     { label: 'In Stock',     color: '#1a5c1a', bg: '#e8f5e9', icon: CheckCircle2 },
  low_stock:    { label: 'Low Stock',    color: '#7a5200', bg: '#fff8e6', icon: AlertTriangle },
  out_of_stock: { label: 'Out of Stock', color: '#7a0000', bg: '#fde8e8', icon: X },
};

const CATEGORY_META: Record<Category, { icon: any; color: string; bg: string }> = {
  Glass:       { icon: Layers,   color: '#005c7a', bg: '#e6f4f8' },
  Aluminum:    { icon: Box,      color: '#15263c', bg: '#e8ecf1' },
  Hardware:    { icon: Wrench,   color: '#5c3a00', bg: '#fdf0e0' },
  Sealant:     { icon: Droplets, color: '#1a5c1a', bg: '#e8f5e9' },
  Accessories: { icon: Zap,      color: '#6a0a7a', bg: '#f5e8fa' },
};

const CATEGORY_FILTERS = [
  { value: 'all',         label: 'All Categories' },
  { value: 'Glass',       label: 'Glass' },
  { value: 'Aluminum',    label: 'Aluminum' },
  { value: 'Hardware',    label: 'Hardware' },
  { value: 'Sealant',     label: 'Sealant' },
  { value: 'Accessories', label: 'Accessories' },
];

const ITEMS_PER_PAGE = 10;

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

function getForecastTotal(series?: Array<{ month: string; total: number }>) {
  if (!series || series.length < 2) return null;
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  const windowed = sorted.slice(-6);
  const totals = windowed.map((entry) => Number(entry.total || 0));
  const regression = linearRegression(totals);
  return Math.max(0, regression.predictNext || 0);
}

// DSS Helper: compute priority & suggested restock using linear regression forecasts.
function getDSSItems(materials: Material[], categoryForecasts: Partial<Record<Category, number>>) {
  const categoryTotals = materials.reduce<Record<Category, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + (m.minStock || 0);
    return acc;
  }, { Glass: 0, Aluminum: 0, Hardware: 0, Sealant: 0, Accessories: 0 });

  return materials
    .map(m => {
      const categoryTotal = categoryTotals[m.category] || 0;
      const forecastTotal = categoryForecasts[m.category] ?? categoryTotal;
      const share = categoryTotal > 0 ? (m.minStock / categoryTotal) : 0;
      const predictedMonthly = Math.max(0, forecastTotal * share);

      const forecastGap = Math.max(0, Math.round(predictedMonthly - m.stockQty));
      const suggestedQty = forecastGap;
      const estimatedCost = suggestedQty * m.unitCost;

      const urgency: 'critical' | 'high' | 'medium' =
        m.stockQty <= 0 && suggestedQty > 0 ? 'critical' :
        suggestedQty > 0 && m.stockQty <= Math.max(1, Math.round(predictedMonthly * 0.5)) ? 'high' :
        'medium';

      const stockPct = m.minStock > 0 ? Math.round((m.stockQty / m.minStock) * 100) : 0;

      return { ...m, forecastGap, predictedMonthly, suggestedQty, estimatedCost, urgency, stockPct };
    })
    .filter(m => m.suggestedQty > 0)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 };
      return order[a.urgency] - order[b.urgency];
    });
}

const URGENCY_CFG = {
  critical: { label: 'CRITICAL',  color: '#7a0000', bg: '#fde8e8', border: '#f5a0a0', icon: AlertCircle },
  high:     { label: 'HIGH',      color: '#7a3500', bg: '#fdf0e0', border: '#f5c080', icon: ArrowUp },
  medium:   { label: 'MEDIUM',    color: '#7a5200', bg: '#fff8e6', border: '#f0c040', icon: Clock },
};

// Main Component 
export default function MaterialProcurement() {
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editQty, setEditQty]           = useState('');
  const [materials, setMaterials]       = useState<Material[]>(INITIAL_MATERIALS);
  const [activeTab, setActiveTab]       = useState<'inventory' | 'dss'>('inventory');
  const [dssCategory, setDssCategory]   = useState<string>('all');
  const [materialDemandTrends, setMaterialDemandTrends] = useState<MaterialDemandTrends | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchAdminMaterialDemandTrends()
      .then((data) => {
        if (isMounted) setMaterialDemandTrends(data);
      })
      .catch((err) => {
        console.error('[MaterialProcurement] Failed to load demand trends:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const categoryForecasts = useMemo(() => {
    const glassForecast = getForecastTotal(materialDemandTrends?.glassMonthly);
    const frameForecast = getForecastTotal(materialDemandTrends?.frameMonthly);
    return {
      Glass: glassForecast ?? undefined,
      Aluminum: frameForecast ?? undefined,
    };
  }, [materialDemandTrends]);

  // Inventory filtering
  const filtered = useMemo(() => {
    let data = [...materials];
    if (categoryFilter !== 'all') data = data.filter(m => m.category === categoryFilter);
    if (statusFilter   !== 'all') data = data.filter(m => m.status   === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(m => m.name.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q));
    }
    return data;
  }, [search, categoryFilter, statusFilter, materials]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const alertItems          = materials.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock');
  const totalInventoryValue = materials.reduce((s, m) => s + m.stockQty * m.unitCost, 0);
  const inStockCount        = materials.filter(m => m.status === 'in_stock').length;

  // DSS data
  const dssItems = useMemo(() => {
    const all = getDSSItems(materials, categoryForecasts);
    return dssCategory === 'all' ? all : all.filter(m => m.category === dssCategory);
  }, [materials, dssCategory, categoryForecasts]);

  const totalRestockCost    = dssItems.reduce((s, m) => s + m.estimatedCost, 0);
  const criticalCount       = dssItems.filter(m => m.urgency === 'critical').length;

  // Category breakdown for DSS chart
  const categoryBreakdown = useMemo(() =>
    (['Glass', 'Aluminum', 'Hardware', 'Sealant', 'Accessories'] as Category[]).map(cat => {
      const items = materials.filter(m => m.category === cat);
      const alerts = items.filter(m => m.status !== 'in_stock').length;
      const pct = items.length > 0 ? Math.round((items.filter(m => m.status === 'in_stock').length / items.length) * 100) : 100;
      return { cat, total: items.length, alerts, pct };
    }), [materials]);

  // Save stock edit
  function handleSaveEdit(id: string) {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) { setEditingId(null); return; }
    setMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newStatus: ProcurementStatus =
        qty === 0 ? 'out_of_stock' :
        qty < m.minStock ? 'low_stock' : 'in_stock';
      return { ...m, stockQty: qty, status: newStatus };
    }));
    setEditingId(null);
  }

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
            Inventory tracking and restocking decision support
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {alertItems.length > 0 && (
        <div className="flex items-start gap-3 p-4 mb-6" style={{ backgroundColor: '#fff8e6', border: '1px solid #f0c040', borderRadius: '8px' }}>
          <AlertTriangle size={18} color="#7a5200" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#7a5200', fontSize: '13px', fontWeight: 700 }}>
              {alertItems.length} item{alertItems.length > 1 ? 's' : ''} require restocking attention
            </div>
            <div style={{ color: '#7a5200', fontSize: '12px', fontFamily: 'var(--font-body)', marginTop: '3px', lineHeight: 1.6 }}>
              {alertItems.map(m => m.name).join(' • ')}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Materials',    value: materials.length,                                  icon: Package,       color: '#15263c', bg: '#e8ecf1' },
          { label: 'Inventory Value',    value: `₱${(totalInventoryValue / 1000).toFixed(0)}K`,   icon: TrendingUp,    color: '#1a5c1a', bg: '#e8f5e9' },
          { label: 'In Stock',           value: inStockCount,                                       icon: ShieldCheck,   color: '#005c7a', bg: '#e6f4f8' },
          { label: 'Needs Restocking',   value: alertItems.length,                                 icon: AlertTriangle, color: '#7a0000', bg: '#fde8e8' },
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
          { key: 'inventory', label: 'Inventory',               icon: Package },
          { key: 'dss',       label: 'Decision Support (DSS)',  icon: Brain   },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className="flex items-center gap-2"
            style={{
              padding: '7px 18px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 600, border: 'none',
              backgroundColor: activeTab === key ? '#15263c' : 'transparent',
              color:           activeTab === key ? 'white' : '#54667d',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{ backgroundColor: '#f3f3f5', borderRadius: '6px', padding: '8px 12px' }}>
              <Search size={15} color="#54667d" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search materials, suppliers…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#15263c', width: '100%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} color="#54667d" />
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '8px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
              >
                {CATEGORY_FILTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '8px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fb' }}>
                  {['Item ID', 'Material Name', 'Category', 'Stock Level', 'Min Stock', 'Unit Cost', 'Total Value', 'Supplier', 'Lead Time', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e4ea' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)', fontSize: '14px' }}>No materials match your filters.</td></tr>
                ) : paginated.map((mat, idx) => {
                  const cfg     = STATUS_CFG[mat.status];
                  const Icon    = cfg.icon;
                  const catMeta = CATEGORY_META[mat.category];
                  const CatIcon = catMeta.icon;
                  const stockPct = mat.minStock > 0 ? Math.min(100, (mat.stockQty / (mat.minStock * 2)) * 100) : 100;
                  const isEditing = editingId === mat.id;
                  return (
                    <tr key={mat.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f3f7' }}>

                      <td style={{ padding: '13px 14px', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700 }}>{mat.id}</td>

                      <td style={{ padding: '13px 14px', minWidth: 200 }}>
                        <div style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>{mat.name}</div>
                      </td>

                      <td style={{ padding: '13px 14px' }}>
                        <div className="flex items-center gap-1.5 px-2 py-1 w-fit" style={{ backgroundColor: catMeta.bg, borderRadius: '5px' }}>
                          <CatIcon size={11} color={catMeta.color} />
                          <span style={{ fontFamily: 'var(--font-heading)', color: catMeta.color, fontSize: '11px', fontWeight: 600 }}>{mat.category}</span>
                        </div>
                      </td>

                      <td style={{ padding: '13px 14px', minWidth: 130 }}>
                        {isEditing ? (
                          <input
                            value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                            style={{ width: 70, padding: '4px 8px', border: '1.5px solid #15263c', borderRadius: '4px', fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none' }}
                          />
                        ) : (
                          <div>
                            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>
                              {mat.stockQty} <span style={{ color: '#54667d', fontWeight: 400, fontSize: '11px' }}>{mat.unit}</span>
                            </div>
                            <div style={{ marginTop: 5, height: 4, width: 90, backgroundColor: '#e0e4ea', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${stockPct}%`, backgroundColor: mat.status === 'out_of_stock' ? '#c0392b' : mat.status === 'low_stock' ? '#e67e22' : '#27ae60', borderRadius: 2, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '13px 14px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px' }}>{mat.minStock} {mat.unit}</td>
                      <td style={{ padding: '13px 14px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>₱{mat.unitCost.toLocaleString()}</td>
                      <td style={{ padding: '13px 14px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>₱{(mat.stockQty * mat.unitCost).toLocaleString()}</td>
                      <td style={{ padding: '13px 14px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px', whiteSpace: 'nowrap' }}>{mat.supplier}</td>
                      <td style={{ padding: '13px 14px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px', whiteSpace: 'nowrap' }}>{mat.leadDays}d</td>

                      <td style={{ padding: '13px 14px' }}>
                        <div className="flex items-center gap-1.5 px-2 py-1 w-fit" style={{ backgroundColor: cfg.bg, borderRadius: '6px' }}>
                          <Icon size={11} color={cfg.color} />
                          <span style={{ fontFamily: 'var(--font-heading)', color: cfg.color, fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                        </div>
                      </td>

                      <td style={{ padding: '13px 14px' }}>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleSaveEdit(mat.id)} style={{ width: 28, height: 28, borderRadius: '4px', border: 'none', background: '#15263c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Save size={13} color="white" />
                            </button>
                            <button onClick={() => setEditingId(null)} style={{ width: 28, height: 28, borderRadius: '4px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <X size={13} color="#54667d" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(mat.id); setEditQty(String(mat.stockQty)); }}
                            style={{ width: 28, height: 28, borderRadius: '4px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit stock quantity"
                          >
                            <Edit2 size={12} color="#54667d" />
                          </button>
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
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={14} color="#54667d" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} style={{ width: 32, height: 32, borderRadius: '6px', border: p === currentPage ? '1.5px solid #15263c' : '1px solid #e0e4ea', background: p === currentPage ? '#15263c' : 'white', color: p === currentPage ? 'white' : '#54667d', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#54667d" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DECISION SUPPORT SYSTEM (DSS) TAB */}
      {activeTab === 'dss' && (
        <div className="flex flex-col gap-4">

          {/* DSS Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, #15263c 0%, #1e3655 100%)', borderRadius: '10px', padding: '20px 24px' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.55)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>INTELLIGENT ANALYSIS</div>
                <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '18px', fontWeight: 800 }}>Restocking Decision Support</div>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.6, maxWidth: 640 }}>
              Materials flagged below fall below their minimum stock threshold. Suggested quantities are calculated to replenish stock to a healthy buffer level. Review urgency tiers and estimated costs before coordinating with suppliers.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { label: 'Items Flagged',     value: dssItems.length,                     accent: '#ff8888' },
                { label: 'Critical / OOS',    value: criticalCount,                        accent: '#ff5555' },
                { label: 'Est. Restock Cost', value: `₱${totalRestockCost.toLocaleString()}`, accent: '#ffcc44' },
              ].map(({ label, value, accent }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: accent, fontSize: '20px', fontWeight: 800 }}>{value}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/*Category Health Overview*/}
          <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '20px 24px' }}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={15} color="#15263c" />
              <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700 }}>Category Stock Health</span>
            </div>
            <div className="flex flex-col gap-3">
              {categoryBreakdown.map(({ cat, total, alerts, pct }) => {
                const meta = CATEGORY_META[cat as Category];
                const CatIcon = meta.icon;
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <div className="flex items-center gap-2" style={{ minWidth: 140 }}>
                      <div style={{ width: 28, height: 28, backgroundColor: meta.bg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CatIcon size={13} color={meta.color} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>{cat}</span>
                    </div>
                    <div style={{ flex: 1, height: 10, backgroundColor: '#f0f3f7', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#27ae60' : pct >= 50 ? '#e67e22' : '#c0392b',
                        borderRadius: 5,
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{pct}%</span>
                    <span style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px', minWidth: 80 }}>{total - alerts}/{total} healthy</span>
                    {alerts > 0 && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fde8e8', color: '#7a0000', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                        {alerts} alert{alerts > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Restock Recommendations ── */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px' }}>
            {/* Table Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
              <div className="flex items-center gap-2">
                <Info size={14} color="#54667d" />
                <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700 }}>Restocking Recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600 }}>Filter:</span>
                <select
                  value={dssCategory}
                  onChange={e => setDssCategory(e.target.value)}
                  style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '6px 10px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
                >
                  <option value="all">All Categories</option>
                  {(['Glass', 'Aluminum', 'Hardware', 'Sealant', 'Accessories'] as Category[]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {dssItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div style={{ width: 48, height: 48, backgroundColor: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={24} color="#1a5c1a" />
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '15px', fontWeight: 700 }}>All Good!</div>
                <div style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>All materials in this category are sufficiently stocked.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fb' }}>
                      {['Priority', 'Material', 'Category', 'Current Stock', 'Minimum', 'Forecast Gap', 'Suggested Order', 'Est. Cost', 'Supplier', 'Lead Time'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e4ea' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dssItems.map((item, idx) => {
                      const urg     = URGENCY_CFG[item.urgency];
                      const UrgIcon = urg.icon;
                      const catMeta = CATEGORY_META[item.category];
                      const CatIcon = catMeta.icon;
                      return (
                        <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f3f7' }}>

                          {/* Priority badge */}
                          <td style={{ padding: '14px 14px' }}>
                            <div className="flex items-center gap-1.5 px-2 py-1 w-fit" style={{ backgroundColor: urg.bg, border: `1px solid ${urg.border}`, borderRadius: '6px' }}>
                              <UrgIcon size={11} color={urg.color} />
                              <span style={{ fontFamily: 'var(--font-heading)', color: urg.color, fontSize: '11px', fontWeight: 700 }}>{urg.label}</span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 14px', minWidth: 200 }}>
                            <div style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '11px', marginTop: 2 }}>{item.id}</div>
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            <div className="flex items-center gap-1 px-2 py-1 w-fit" style={{ backgroundColor: catMeta.bg, borderRadius: '5px' }}>
                              <CatIcon size={11} color={catMeta.color} />
                              <span style={{ fontFamily: 'var(--font-heading)', color: catMeta.color, fontSize: '11px', fontWeight: 600 }}>{item.category}</span>
                            </div>
                          </td>

                          {/* Current stock with mini bar */}
                          <td style={{ padding: '14px 14px', minWidth: 120 }}>
                            <div style={{ fontFamily: 'var(--font-heading)', color: item.status === 'out_of_stock' ? '#c0392b' : '#e67e22', fontSize: '13px', fontWeight: 700 }}>
                              {item.stockQty} <span style={{ fontWeight: 400, fontSize: '11px' }}>{item.unit}</span>
                            </div>
                            <div style={{ marginTop: 4, height: 4, width: 80, backgroundColor: '#e0e4ea', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${item.stockPct}%`, backgroundColor: item.status === 'out_of_stock' ? '#c0392b' : '#e67e22', borderRadius: 2 }} />
                            </div>
                          </td>

                          <td style={{ padding: '14px 14px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>
                            {item.minStock} {item.unit}
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '13px', fontWeight: 700 }}>
                              −{item.forecastGap} {item.unit}
                            </span>
                          </td>

                          {/* Suggested quantity */}
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', backgroundColor: '#e8ecf1', borderRadius: '6px' }}>
                              <ArrowUp size={12} color="#15263c" />
                              <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>
                                {item.suggestedQty} {item.unit}
                              </span>
                            </div>
                          </td>

                          {/* Estimated cost */}
                          <td style={{ padding: '14px 14px' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>
                              ₱{item.estimatedCost.toLocaleString()}
                            </span>
                          </td>

                          <td style={{ padding: '14px 14px', fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {item.supplier}
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            <span style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '12px' }}>
                              ~{item.leadDays} day{item.leadDays > 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8f9fb', borderTop: '2px solid #e0e4ea' }}>
                      <td colSpan={7} style={{ padding: '12px 14px', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Total Estimated Restocking Cost
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '15px', fontWeight: 800 }}>
                        ₱{totalRestockCost.toLocaleString()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/*DSS Legend/Notes*/}
          <div style={{ backgroundColor: '#f8f9fb', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '16px 20px' }}>
            <div className="flex items-center gap-2 mb-3">
              <Info size={13} color="#54667d" />
              <span style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>DSS Methodology</span>
            </div>
            <div className="flex flex-wrap gap-6">
              {Object.entries(URGENCY_CFG).map(([key, cfg]) => {
                const UrgIcon = cfg.icon;
                return (
                  <div key={key} className="flex items-start gap-2">
                    <div style={{ marginTop: 2, width: 20, height: 20, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UrgIcon size={11} color={cfg.color} />
                    </div>
                    <div>
                      <span style={{ fontFamily: 'var(--font-heading)', color: cfg.color, fontSize: '12px', fontWeight: 700 }}>{cfg.label}</span>
                      <div style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '11px', marginTop: 1 }}>
                        {key === 'critical' && 'Stock fully depleted — operations at risk.'}
                        {key === 'high'     && 'Stock is at or below reorder point — reorder soon.'}
                        {key === 'medium'   && 'Stock below minimum — schedule reorder.'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-2">
                <div style={{ marginTop: 2, width: 20, height: 20, backgroundColor: '#e8ecf1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowUp size={11} color="#15263c" />
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '12px', fontWeight: 700 }}>SUGGESTED QTY</span>
                  <div style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '11px', marginTop: 1 }}>
                    Suggested qty = max(0, forecast monthly demand − current stock).
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div style={{ marginTop: 2, width: 20, height: 20, backgroundColor: '#e6f4f8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BarChart2 size={11} color="#005c7a" />
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-heading)', color: '#005c7a', fontSize: '12px', fontWeight: 700 }}>DEMAND BASIS</span>
                  <div style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '11px', marginTop: 1 }}>
                    Forecast demand from linear regression on monthly approved quotes.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div style={{ marginTop: 2, width: 20, height: 20, backgroundColor: '#e8ecf1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={11} color="#15263c" />
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '12px', fontWeight: 700 }}>TREND FACTOR</span>
                  <div style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '11px', marginTop: 1 }}>
                    Forecasted totals split by each item's share of category minimum stock.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}