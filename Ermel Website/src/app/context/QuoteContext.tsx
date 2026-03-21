// ============================================================
// Quote Context — Manages quotation system state via API
// ============================================================
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  Quote,
  QuoteStatus,
  InstallationOrder,
  InstallationStatus,
  ActivityLog,
} from '../types/quotation';
import * as api from '../services/api';
import { supabase } from '../services/supabaseClient';

// ---- Context Interface ----
interface QuoteContextType {
  quotes: Quote[];
  installationOrders: InstallationOrder[];
  activityLogs: ActivityLog[];
  loading: boolean;
  // Admin actions
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  approveQuote: (id: string) => void;
  rejectQuote: (id: string, reason: string) => void;
  convertToOrder: (id: string) => void;
  updateInstallationStatus: (orderId: string, status: InstallationStatus) => void;
  // Customer actions
  customerAcceptQuote: (id: string) => void;
  customerDeclineQuote: (id: string) => void;
  // Helpers
  getQuoteById: (id: string) => Quote | undefined;
  getQuotesByEmail: (email: string) => Quote[];
  // Refresh
  refreshQuotes: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshLogs: () => Promise<void>;
}

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [installationOrders, setInstallationOrders] = useState<InstallationOrder[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Fetch from API ----
  const refreshQuotes = useCallback(async () => {
    try {
      const result = await api.fetchQuotes({ limit: 50 });
      const data = (result as any).data || result;
      const fetchedQuotes = data.quotes || data;
      // Auto-expire old quotes locally
      const processed = (fetchedQuotes as Quote[]).map((q: Quote) => {
        if (q.status === 'approved' && q.expiryDate && new Date(q.expiryDate) < new Date()) {
          return { ...q, status: 'expired' as QuoteStatus };
        }
        return q;
      });
      setQuotes(processed);
    } catch (err) {
      console.error('[QuoteContext] Failed to fetch quotes:', err);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const result = await api.fetchOrders({ limit: 50 });
      const data = (result as any).data || result;
      setInstallationOrders(data.orders || data);
    } catch (err) {
      console.error('[QuoteContext] Failed to fetch orders:', err);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      const result = await api.fetchActivityLogs();
      const data = (result as any).data || result;
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[QuoteContext] Failed to fetch logs:', err);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([refreshQuotes(), refreshOrders(), refreshLogs()]);
      setLoading(false);
    }
    loadAll();
  }, [refreshQuotes, refreshOrders, refreshLogs]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const queueRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        Promise.all([refreshQuotes(), refreshOrders(), refreshLogs()]).catch(() => {
          // Keep UI alive if one request fails.
        });
      }, 120);
    };

    const quoteChannel = client
      .channel('quote-context-qq-quotes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, queueRefresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, queueRefresh)
      .subscribe();

    const paymentChannel = client
      .channel('quote-context-payments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, queueRefresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, queueRefresh)
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      client.removeChannel(quoteChannel);
      client.removeChannel(paymentChannel);
    };
  }, [refreshLogs, refreshOrders, refreshQuotes]);

  // ---- Admin actions ----
  const updateQuoteFn = useCallback(async (id: string, updates: Partial<Quote>) => {
    try {
      await api.updateQuote(id, updates);
      await refreshQuotes();
      await refreshLogs();
    } catch (err) {
      console.error('[QuoteContext] updateQuote failed:', err);
    }
  }, [refreshQuotes, refreshLogs]);

  const approveQuoteFn = useCallback(async (id: string) => {
    try {
      await api.approveQuote(id);
      await refreshQuotes();
      await refreshLogs();
    } catch (err) {
      console.error('[QuoteContext] approveQuote failed:', err);
    }
  }, [refreshQuotes, refreshLogs]);

  const rejectQuoteFn = useCallback(async (id: string, reason: string) => {
    try {
      await api.rejectQuote(id, reason);
      await refreshQuotes();
      await refreshLogs();
    } catch (err) {
      console.error('[QuoteContext] rejectQuote failed:', err);
    }
  }, [refreshQuotes, refreshLogs]);

  const convertToOrderFn = useCallback(async (id: string) => {
    try {
      await api.convertQuoteToOrder(id);
      await Promise.all([refreshQuotes(), refreshOrders(), refreshLogs()]);
    } catch (err) {
      console.error('[QuoteContext] convertToOrder failed:', err);
    }
  }, [refreshQuotes, refreshOrders, refreshLogs]);

  const updateInstallationStatusFn = useCallback(async (orderId: string, status: InstallationStatus) => {
    try {
      await api.updateInstallationStatus(orderId, status);
      await refreshOrders();
      await refreshLogs();
    } catch (err) {
      console.error('[QuoteContext] updateInstallationStatus failed:', err);
    }
  }, [refreshOrders, refreshLogs]);

  // ---- Customer actions ----
  const customerAcceptQuoteFn = useCallback(async (id: string) => {
    try {
      // Determine email from the quote
      const quote = quotes.find((q) => q.id === id);
      const email = quote?.customerEmail || '';
      await api.customerAcceptQuote(id, email);
      await refreshQuotes();
      await refreshLogs();
    } catch (err) {
      console.error('[QuoteContext] customerAcceptQuote failed:', err);
    }
  }, [quotes, refreshQuotes, refreshLogs]);

  const customerDeclineQuoteFn = useCallback(async (id: string) => {
    try {
      const quote = quotes.find((q) => q.id === id);
      const email = quote?.customerEmail || '';
      await api.customerDeclineQuote(id, email);
      await refreshQuotes();
      await refreshLogs();
    } catch (err) {
      console.error('[QuoteContext] customerDeclineQuote failed:', err);
    }
  }, [quotes, refreshQuotes, refreshLogs]);

  // ---- Helpers ----
  const getQuoteByIdFn = useCallback((id: string) => quotes.find((q) => q.id === id), [quotes]);

  const getQuotesByEmailFn = useCallback(
    (email: string) => quotes.filter((q) => q.customerEmail.toLowerCase() === email.toLowerCase()),
    [quotes]
  );

  return (
    <QuoteContext.Provider
      value={{
        quotes,
        installationOrders,
        activityLogs,
        loading,
        updateQuote: updateQuoteFn,
        approveQuote: approveQuoteFn,
        rejectQuote: rejectQuoteFn,
        convertToOrder: convertToOrderFn,
        updateInstallationStatus: updateInstallationStatusFn,
        customerAcceptQuote: customerAcceptQuoteFn,
        customerDeclineQuote: customerDeclineQuoteFn,
        getQuoteById: getQuoteByIdFn,
        getQuotesByEmail: getQuotesByEmailFn,
        refreshQuotes,
        refreshOrders,
        refreshLogs,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuotes must be used within QuoteProvider');
  return ctx;
}
