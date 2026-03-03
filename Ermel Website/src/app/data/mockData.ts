export type OrderStatus = 'inquiry' | 'quotation' | 'ordering' | 'fabrication' | 'installation';

export interface Order {
  id: string;
  customer: string;
  project: string;
  material: string;
  glassType: string;
  dimensions: string;
  width: number;
  height: number;
  estimatedCost: number;
  approvedCost?: number;
  status: OrderStatus;
  createdDate: string;
  scheduledDate?: string;
  phone: string;
  email: string;
  notes?: string;
  paid: boolean;
  paymentUploaded?: boolean;
  // New fields for enhanced quotation system
  projectCategoryOther?: string | null;
  glassTypeOther?: string | null;
  colorOther?: string | null;
  widthM?: number;
  heightM?: number;
  widthCm?: number;
  heightCm?: number;
  widthFt?: number;
  heightFt?: number;
  phoneHash?: string;
  address?: string;
  measurementUnit?: 'cm' | 'm' | 'ft';
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 'EGA-2026-001',
    customer: 'Maria Santos',
    project: 'Storefront',
    material: 'Aluminum Frame',
    glassType: 'Clear Glass',
    dimensions: '240cm × 180cm',
    width: 240,
    height: 180,
    estimatedCost: 45000,
    approvedCost: 44500,
    status: 'inquiry',
    createdDate: '2026-02-18',
    phone: '09171234567',
    email: 'maria.santos@email.com',
    notes: 'Double door setup with push/pull handle',
    paid: false,
  },
  {
    id: 'EGA-2026-002',
    customer: 'Jose Reyes',
    project: 'Sliding Window',
    material: 'Aluminum Frame',
    glassType: 'Bronze Glass',
    dimensions: '180cm × 120cm',
    width: 180,
    height: 120,
    estimatedCost: 28000,
    approvedCost: 27500,
    status: 'quotation',
    createdDate: '2026-02-17',
    scheduledDate: '2026-03-05',
    phone: '09281234567',
    email: 'jose.reyes@email.com',
    notes: '2-panel sliding configuration',
    paid: false,
  },
  {
    id: 'EGA-2026-003',
    customer: 'Ana Dela Cruz',
    project: 'Glass Partition',
    material: 'Steel Frame',
    glassType: 'Frosted Glass',
    dimensions: '300cm × 250cm',
    width: 300,
    height: 250,
    estimatedCost: 62000,
    approvedCost: 61500,
    status: 'ordering',
    createdDate: '2026-02-15',
    scheduledDate: '2026-03-10',
    phone: '09351234567',
    email: 'ana.delacruz@email.com',
    notes: 'Office divider, privacy partition',
    paid: false,
  },
  {
    id: 'EGA-2026-004',
    customer: 'Roberto Lim',
    project: 'Glass Door',
    material: 'Stainless Frame',
    glassType: 'Tempered Glass',
    dimensions: '100cm × 220cm',
    width: 100,
    height: 220,
    estimatedCost: 35000,
    approvedCost: 34800,
    status: 'fabrication',
    createdDate: '2026-02-12',
    scheduledDate: '2026-03-15',
    phone: '09451234567',
    email: 'roberto.lim@email.com',
    notes: 'Single swing door, patch fittings',
    paid: true,
  },
  {
    id: 'EGA-2026-005',
    customer: 'Carla Mendoza',
    project: 'Awning Window',
    material: 'Aluminum Frame',
    glassType: 'Clear Glass',
    dimensions: '120cm × 90cm',
    width: 120,
    height: 90,
    estimatedCost: 18000,
    approvedCost: 17800,
    status: 'installation',
    createdDate: '2026-02-10',
    scheduledDate: '2026-02-28',
    phone: '09561234567',
    email: 'carla.mendoza@email.com',
    notes: 'Top-hung awning, 3 units',
    paid: true,
    paymentUploaded: true,
  },
  {
    id: 'EGA-2026-006',
    customer: 'Pedro Garcia',
    project: 'Fixed Window',
    material: 'Aluminum Frame',
    glassType: 'Bronze Glass',
    dimensions: '200cm × 150cm',
    width: 200,
    height: 150,
    estimatedCost: 32000,
    status: 'inquiry',
    createdDate: '2026-02-22',
    phone: '09671234567',
    email: 'pedro.garcia@email.com',
    paid: false,
  },
];

export const ACTIVITY_FEED = [
  {
    id: 1,
    type: 'new_inquiry',
    message: 'New quote request from Pedro Garcia',
    detail: 'Fixed Window - Bronze Glass',
    time: '2 hours ago',
    icon: 'bell',
  },
  {
    id: 2,
    type: 'payment_upload',
    message: 'Carla Mendoza uploaded payment screenshot',
    detail: 'EGA-2026-005 - ₱17,800',
    time: '5 hours ago',
    icon: 'upload',
  },
  {
    id: 3,
    type: 'status_update',
    message: 'Roberto Lim project moved to Fabrication',
    detail: 'EGA-2026-004 - Tempered Glass Door',
    time: '1 day ago',
    icon: 'refresh',
  },
  {
    id: 4,
    type: 'payment_upload',
    message: 'Roberto Lim confirmed payment',
    detail: 'EGA-2026-004 - ₱34,800',
    time: '1 day ago',
    icon: 'check',
  },
  {
    id: 5,
    type: 'new_inquiry',
    message: 'New quote request from Maria Santos',
    detail: 'Storefront - Clear Glass',
    time: '3 days ago',
    icon: 'bell',
  },
  {
    id: 6,
    type: 'approved',
    message: 'Jose Reyes quote approved',
    detail: 'EGA-2026-002 - ₱27,500',
    time: '4 days ago',
    icon: 'check',
  },
];

export const KANBAN_COLUMNS: { id: OrderStatus; label: string; color: string }[] = [
  { id: 'inquiry', label: 'Inquiry Received', color: '#54667d' },
  { id: 'quotation', label: 'Quotation Drafting', color: '#7a5200' },
  { id: 'ordering', label: 'Ordering Materials', color: '#005c7a' },
  { id: 'fabrication', label: 'Fabrication', color: '#15263c' },
  { id: 'installation', label: 'Installation', color: '#1a5c1a' },
];
