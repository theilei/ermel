// ============================================================
// API Service — Frontend API layer for quote system
// ============================================================
import type { Quote, QuoteStatus, InstallationOrder, InstallationStatus, ActivityLog } from '../types/quotation';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

function getAdminHeaders(): HeadersInit {
  const token = localStorage.getItem('ermel_admin_token') || '';
  const user = localStorage.getItem('ermel_admin_user') || 'Admin';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
    'x-admin-user': user,
  };
}

function getCustomerHeaders(email: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-customer-email': email,
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
  const res = await fetch(`${API_BASE}/admin/quotes?${query}`, { headers: getAdminHeaders(), credentials: 'include' });
  return handleResponse<{ quotes: Quote[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }>(res);
}

export async function fetchQuote(id: string) {
  const res = await fetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}`, { headers: getAdminHeaders(), credentials: 'include' });
  return handleResponse<Quote>(res);
}

export async function updateQuote(id: string, data: Partial<Quote>) {
  const res = await fetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<Quote>(res);
}

export async function approveQuote(id: string) {
  const res = await fetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  return handleResponse<Quote>(res);
}

export async function rejectQuote(id: string, reason: string) {
  const res = await fetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return handleResponse<Quote>(res);
}

export function getQuotePDFUrl(id: string): string {
  return `${API_BASE}/admin/quotes/${encodeURIComponent(id)}/pdf`;
}

export async function convertQuoteToOrder(id: string) {
  const res = await fetch(`${API_BASE}/admin/quotes/${encodeURIComponent(id)}/convert`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  return handleResponse<{ quote: Quote; order: InstallationOrder }>(res);
}

// ---- Admin Order API ----
export async function fetchOrders(params?: { status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await fetch(`${API_BASE}/admin/orders?${query}`, { headers: getAdminHeaders(), credentials: 'include' });
  return handleResponse<{ orders: InstallationOrder[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }>(res);
}

export async function updateInstallationStatus(id: string, status: InstallationStatus, installationSchedule?: string) {
  const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status, installationSchedule }),
  });
  return handleResponse<InstallationOrder>(res);
}

// ---- Customer API ----
export async function fetchCustomerQuotes(email: string) {
  const res = await fetch(`${API_BASE}/customer/quotes?email=${encodeURIComponent(email)}`, {
    headers: getCustomerHeaders(email),
    credentials: 'include',
  });
  return handleResponse<Quote[]>(res);
}

export async function customerAcceptQuote(id: string, email: string) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    headers: getCustomerHeaders(email),
    credentials: 'include',
  });
  return handleResponse<Quote>(res);
}

export async function customerDeclineQuote(id: string, email: string) {
  const res = await fetch(`${API_BASE}/customer/quotes/${encodeURIComponent(id)}/decline`, {
    method: 'POST',
    headers: getCustomerHeaders(email),
    credentials: 'include',
  });
  return handleResponse<Quote>(res);
}

// ---- Activity Logs ----
export async function fetchActivityLogs(params?: { quoteId?: string; orderId?: string }) {
  const query = new URLSearchParams();
  if (params?.quoteId) query.set('quoteId', params.quoteId);
  if (params?.orderId) query.set('orderId', params.orderId);
  const res = await fetch(`${API_BASE}/admin/activity-logs?${query}`, { headers: getAdminHeaders(), credentials: 'include' });
  return handleResponse<ActivityLog[]>(res);
}

// ---- Legacy Orders (general project tracking) ----
export async function fetchLegacyOrders() {
  const res = await fetch(`${API_BASE}/admin/legacy-orders`, { headers: getAdminHeaders(), credentials: 'include' });
  return handleResponse<any[]>(res);
}

export async function createLegacyOrder(data: any) {
  const res = await fetch(`${API_BASE}/admin/legacy-orders`, {
    method: 'POST',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function updateLegacyOrderStatus(id: string, status: string, scheduledDate?: string) {
  const res = await fetch(`${API_BASE}/admin/legacy-orders/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status, scheduledDate }),
  });
  return handleResponse<any>(res);
}

export async function updateLegacyOrderCost(id: string, approvedCost: number) {
  const res = await fetch(`${API_BASE}/admin/legacy-orders/${encodeURIComponent(id)}/cost`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
    body: JSON.stringify({ approvedCost }),
  });
  return handleResponse<any>(res);
}

export async function markLegacyOrderPayment(id: string) {
  const res = await fetch(`${API_BASE}/admin/legacy-orders/${encodeURIComponent(id)}/payment`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    credentials: 'include',
  });
  return handleResponse<any>(res);
}

export async function fetchCustomerLegacyOrders(email: string) {
  const res = await fetch(`${API_BASE}/customer/legacy-orders?email=${encodeURIComponent(email)}`, {
    headers: getCustomerHeaders(email),
    credentials: 'include',
  });
  return handleResponse<any[]>(res);
}

export async function customerMarkPayment(id: string, email: string) {
  const res = await fetch(`${API_BASE}/customer/legacy-orders/${encodeURIComponent(id)}/payment`, {
    method: 'PUT',
    headers: getCustomerHeaders(email),
    credentials: 'include',
  });
  return handleResponse<any>(res);
}
