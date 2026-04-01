// ============================================================
// API Service — Frontend API layer for quote system
// ============================================================
import type {
  Quote,
  QuoteStatus,
  InstallationOrder,
  InstallationStatus,
  ActivityLog,
  Reservation,
  QuoteUpdate,
  SystemNotification,
  PaymentMethod,
} from '../types/quotation';
import { supabase } from './supabaseClient';

export interface DashboardActiveInstallation {
  id: string;
  customerName: string;
  projectType: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  estimatedCost: number;
  status: QuoteStatus;
  reservationDate: string;
}

export interface AdminDashboardMetrics {
  pendingInquiries: number;
  activeInstallations: number;
  totalQuotes: number;
  approvedQuotes: number;
  activeInstallationEntries: DashboardActiveInstallation[];
}

export interface LegacyOrderSummary {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
}

export interface PopularMaterialsSummary {
  glassType: string | null;
  color: string | null;
  frameMaterial: string | null;
  sampleSize: number;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function adminFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = await getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

function getCustomerHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  const body = await res.json();
  // Unwrap { success, data } envelope when present
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

// ---- Admin Quote API ----
export async function fetchQuotes(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await adminFetch(`${API_BASE}/admin/quotes?${query}`);
  return handleResponse<{ quotes: Quote[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }>(res);
}

export async function fetchQuote(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}`);
  return handleResponse<Quote>(res);
}

export async function updateQuote(id: string, data: Partial<Quote>) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleResponse<Quote>(res);
}

export async function approveQuote(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  });
  return handleResponse<Quote>(res);
}

export async function rejectQuote(id: string, reason: string) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return handleResponse<Quote>(res);
}

export function getQuotePDFUrl(id: string): string {
  return `${API_BASE}/admin/quotes/${encodeURIComponent(id)}/pdf`;
}

export async function convertQuoteToOrder(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}/convert`, {
    method: 'POST',
  });
  return handleResponse<{ quote: Quote; order: InstallationOrder }>(res);
}

// ---- Admin Order API ----
export async function fetchOrders(params?: { status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await adminFetch(`${API_BASE}/admin/orders?${query}`);
  return handleResponse<{ orders: InstallationOrder[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }>(res);
}

export async function updateInstallationStatus(id: string, status: InstallationStatus, installationSchedule?: string) {
  const res = await adminFetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, installationSchedule }),
  });
  return handleResponse<InstallationOrder>(res);
}

// ---- Customer API ----
export async function fetchCustomerQuotes(_email: string) {
  const res = await fetch(`${API_BASE}/customer/quotes`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<Quote[]>(res);
}

export async function customerAcceptQuote(id: string, _email: string) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<Quote>(res);
}

export async function customerDeclineQuote(id: string, _email: string) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(id)}/decline`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<Quote>(res);
}

// ---- Activity Logs ----
export async function fetchActivityLogs(params?: { quoteId?: string; orderId?: string }) {
  const query = new URLSearchParams();
  if (params?.quoteId) query.set('quoteId', params.quoteId);
  if (params?.orderId) query.set('orderId', params.orderId);
  const res = await adminFetch(`${API_BASE}/admin/activity-logs?${query}`);
  return handleResponse<ActivityLog[]>(res);
}

export async function fetchAdminDashboardMetrics() {
  const res = await adminFetch(`${API_BASE}/admin/dashboard/metrics`);
  return handleResponse<AdminDashboardMetrics>(res);
}

// ---- Reservation API ----
export async function fetchReservedDates() {
  const res = await fetch(`${API_BASE}/reservations/dates`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<string[]>(res);
}

export async function fetchPopularMaterials(projectType?: string) {
  const query = new URLSearchParams();
  if (projectType) query.set('projectType', projectType);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/quotes/popular-materials${suffix}`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<PopularMaterialsSummary>(res);
}

export async function fetchReservations(params?: { status?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);

  const res = await adminFetch(`${API_BASE}/admin/reservations?${query}`);
  return handleResponse<Reservation[]>(res);
}

export async function approveReservation(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/reservations/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  });
  return handleResponse<Reservation>(res);
}

export async function rejectReservation(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/reservations/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
  });
  return handleResponse<Reservation>(res);
}

export async function rescheduleReservation(id: string, reservationDate: string) {
  const res = await adminFetch(`${API_BASE}/admin/reservations/${encodeURIComponent(id)}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ reservationDate }),
  });
  return handleResponse<Reservation>(res);
}

// ---- Legacy Orders (general project tracking) ----
export async function fetchLegacyOrders() {
  const res = await adminFetch(`${API_BASE}/admin/legacy-orders`);
  return handleResponse<any[]>(res);
}

export async function fetchLegacyOrderSummary() {
  const res = await adminFetch(`${API_BASE}/admin/legacy-orders/summary`);
  return handleResponse<LegacyOrderSummary>(res);
}

export async function createLegacyOrder(data: any) {
  const res = await adminFetch(`${API_BASE}/admin/legacy-orders`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function updateLegacyOrderStatus(id: string, status: string, scheduledDate?: string) {
  const res = await adminFetch(`${API_BASE}/admin/legacy-orders/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, scheduledDate }),
  });
  return handleResponse<any>(res);
}

export async function updateLegacyOrderCost(id: string, approvedCost: number) {
  const res = await adminFetch(`${API_BASE}/admin/legacy-orders/${encodeURIComponent(id)}/cost`, {
    method: 'PUT',
    body: JSON.stringify({ approvedCost }),
  });
  return handleResponse<any>(res);
}

export async function markLegacyOrderPayment(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/legacy-orders/${encodeURIComponent(id)}/payment`, {
    method: 'PUT',
  });
  return handleResponse<any>(res);
}

export async function fetchCustomerLegacyOrders(_email: string) {
  const res = await fetch(`${API_BASE}/customer/legacy-orders`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<any[]>(res);
}

// ---- Customer Check Status API ----
export async function fetchCheckStatusQuotes() {
  const res = await fetch(`${API_BASE}/customer/check-status/quotes`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<Quote[]>(res);
}

export async function fetchCustomerPayment(quoteId: string) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(quoteId)}/payment`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<{
    quoteId: string;
    quoteStatus: string;
    payment: any | null;
    countdown: { deadline: string; remainingMs: number; expired: boolean };
  }>(res);
}

export async function setCustomerPaymentMethod(quoteId: string, paymentMethod: PaymentMethod) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(quoteId)}/payment/method`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    credentials: 'include',
    body: JSON.stringify({ paymentMethod }),
  });
  return handleResponse<any>(res);
}

export async function uploadCustomerPaymentProof(quoteId: string, file: File) {
  const form = new FormData();
  form.append('proof', file);
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(quoteId)}/payment/proof`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  return handleResponse<any>(res);
}

export async function deleteCustomerPaymentProof(quoteId: string) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(quoteId)}/payment/proof`, {
    method: 'DELETE',
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<any>(res);
}

export function getCustomerCashReceiptUrl(quoteId: string): string {
  return `${API_BASE}/customer/quotes/${encodeURIComponent(quoteId)}/payment/receipt`;
}

export async function fetchAdminPayments() {
  const res = await adminFetch(`${API_BASE}/admin/payments`);
  return handleResponse<any[]>(res);
}

export async function adminApprovePayment(quoteId: string) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(quoteId)}/payment/approve`, {
    method: 'POST',
  });
  return handleResponse<any>(res);
}

export async function adminRejectPayment(quoteId: string, reason: string) {
  const res = await adminFetch(`${API_BASE}/admin/quotes/${encodeURIComponent(quoteId)}/payment/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return handleResponse<any>(res);
}

export async function fetchQuoteUpdates(quoteId: string) {
  const res = await fetch(`${API_BASE}/customer/check-status/quotes/${encodeURIComponent(quoteId)}/updates`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<{ quote: Quote; updates: QuoteUpdate[] }>(res);
}

export function getCustomerQuotePDFUrl(id: string): string {
  return `${API_BASE}/customer/quotes/${encodeURIComponent(id)}/pdf`;
}

// ---- Notifications API ----
export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<{ notifications: SystemNotification[]; unreadCount: number }>(res);
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<null>(res);
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<{ marked: number }>(res);
}

export async function customerMarkPayment(id: string, _email: string) {
  const res = await fetch(`${API_BASE}/customer/legacy-orders/${encodeURIComponent(id)}/payment`, {
    method: 'PUT',
    headers: getCustomerHeaders(),
    credentials: 'include',
  });
  return handleResponse<any>(res);
}

export async function fetchAdminAnalyticsSummary() {
  const res = await adminFetch(`${API_BASE}/admin/analytics/summary`);
  return handleResponse<{
    totalQuotes: number;
    approvalRate: number;
    conversionRate: number;
    monthlyTrends: Array<{ month: string; total: number }>;
  }>(res);
}

export async function trackAnalyticsEvent(eventType: 'quote_started' | 'quote_submitted' | 'quote_approved' | 'quote_accepted', metadata?: Record<string, unknown>) {
  await fetch(`${API_BASE}/analytics/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ eventType, metadata: metadata || {} }),
  }).catch(() => {
    // Best-effort telemetry only.
  });
}
