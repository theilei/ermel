// ============================================================
// Quotation System Types
// ============================================================

export type QuoteStatus =
  | 'pending'
  | 'rejected'
  | 'draft'
  | 'approved'
  | 'cancelled'
  | 'customer_accepted'
  | 'customer_declined'
  | 'converted_to_order'
  | 'expired';

export type PaymentMethod = 'qrph' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'expired';

export interface QuotePayment {
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  proofFile?: string;
  adminRejectionReason?: string;
  submittedAt?: string;
  createdAt?: string;
}

export type InstallationStatus =
  | 'materials_ordered'
  | 'fabrication'
  | 'installation'
  | 'completed';

export interface Quote {
  id: string; // Q-0001 format
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  projectType: string;
  glassType: string;
  frameMaterial: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  originalEstimatedCost?: number;
  estimatedCost: number;
  updatedCost?: number;
  status: QuoteStatus;
  submissionDate: string;
  rejectionReason?: string;
  approvedDate?: string;
  expiryDate?: string; // 30 days from approval
  acceptedDate?: string;
  declinedDate?: string;
  convertedDate?: string;
  notes?: string;
  reservationDate?: string;
  reservationStatus?: ReservationStatus;
  payment?: QuotePayment | null;
}

export interface QuoteUpdate {
  id: string;
  quoteId: string;
  status?: string;
  estimatedPrice?: number;
  updatedPrice?: number;
  adminRemark?: string;
  adminName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  relatedQuoteNumber?: string;
  createdAt: string;
}

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Reservation {
  id: string;
  quoteId: string;
  quoteNumber?: string;
  customerName?: string;
  customerEmail?: string;
  projectType?: string;
  reservationDate: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface InstallationOrder {
  id: string; // ORD-0001 format
  quoteId: string;
  customerName: string;
  projectType: string;
  dimensions: string;
  installationStatus: InstallationStatus;
  orderDate: string;
  installationSchedule?: string;
}

export interface ActivityLog {
  id: string;
  event: string;
  quoteId?: string;
  orderId?: string;
  userRole: 'admin' | 'customer';
  userName: string;
  timestamp: string;
  details?: string;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Pending',
  rejected: 'Rejected',
  draft: 'Draft',
  approved: 'Approved',
  cancelled: 'Cancelled',
  customer_accepted: 'Customer Accepted',
  customer_declined: 'Customer Declined',
  converted_to_order: 'Converted to Order',
  expired: 'Expired',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: '#fff8e1', text: '#7a5200', border: '#f0c04066' },
  rejected: { bg: '#fff0f0', text: '#7a0000', border: '#7a000044' },
  draft: { bg: '#e8ecf0', text: '#15263c', border: '#15263c44' },
  approved: { bg: '#e8f5e9', text: '#1a5c1a', border: '#1a5c1a44' },
  cancelled: { bg: '#fff0f0', text: '#7a0000', border: '#7a000044' },
  customer_accepted: { bg: '#e0f2fe', text: '#0369a1', border: '#0369a144' },
  customer_declined: { bg: '#fff0f0', text: '#7a0000', border: '#7a000044' },
  converted_to_order: { bg: '#f3e8ff', text: '#6b21a8', border: '#6b21a844' },
  expired: { bg: '#f5f5f5', text: '#888', border: '#88888844' },
};

export const INSTALLATION_STATUS_LABELS: Record<InstallationStatus, string> = {
  materials_ordered: 'Materials Ordered',
  fabrication: 'Fabrication',
  installation: 'Installation',
  completed: 'Completed',
};

export const INSTALLATION_STATUS_COLORS: Record<InstallationStatus, { bg: string; text: string; border: string }> = {
  materials_ordered: { bg: '#fff8e1', text: '#7a5200', border: '#f0c04066' },
  fabrication: { bg: '#e8ecf0', text: '#15263c', border: '#15263c44' },
  installation: { bg: '#e0f2fe', text: '#0369a1', border: '#0369a144' },
  completed: { bg: '#e8f5e9', text: '#1a5c1a', border: '#1a5c1a44' },
};

export function generateQuoteId(seq: number): string {
  return `Q-${String(seq).padStart(4, '0')}`;
}

export function generateOrderId(seq: number): string {
  return `ORD-${String(seq).padStart(4, '0')}`;
}

export function isQuoteExpired(quote: Quote): boolean {
  if (quote.status !== 'approved' || !quote.expiryDate) return false;
  return new Date() > new Date(quote.expiryDate);
}

export function getExpiryDate(approvedDate: string): string {
  const d = new Date(approvedDate);
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
