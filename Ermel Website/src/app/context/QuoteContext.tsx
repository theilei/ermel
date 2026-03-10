// ============================================================
// Quote Context — Manages quotation system state
// Works with local mock data, with API integration ready
// ============================================================
import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  Quote,
  QuoteStatus,
  InstallationOrder,
  InstallationStatus,
  ActivityLog,
} from '../types/quotation';
import { generateQuoteId, generateOrderId, getExpiryDate } from '../types/quotation';

// ---- Mock Data ----
const MOCK_QUOTES: Quote[] = [
  {
    id: 'Q-0001',
    customerName: 'Maria Santos',
    customerEmail: 'maria.santos@email.com',
    customerPhone: '09171234567',
    customerAddress: '123 Rizal Ave, Makati City, Metro Manila',
    projectType: 'Storefront',
    glassType: 'Clear Glass',
    frameMaterial: 'Aluminum Frame',
    width: 240,
    height: 180,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 45000,
    status: 'pending',
    submissionDate: '2026-02-28',
  },
  {
    id: 'Q-0002',
    customerName: 'Jose Reyes',
    customerEmail: 'jose.reyes@email.com',
    customerPhone: '09281234567',
    customerAddress: '456 Bonifacio St, Taguig City, Metro Manila',
    projectType: 'Sliding Window',
    glassType: 'Bronze Glass',
    frameMaterial: 'Aluminum Frame',
    width: 180,
    height: 120,
    quantity: 2,
    color: 'Bronze',
    estimatedCost: 28000,
    status: 'draft',
    submissionDate: '2026-02-25',
  },
  {
    id: 'Q-0003',
    customerName: 'Ana Dela Cruz',
    customerEmail: 'ana.delacruz@email.com',
    customerPhone: '09351234567',
    customerAddress: '789 Mabini Blvd, Pasig City, Metro Manila',
    projectType: 'Glass Partition',
    glassType: 'Frosted Glass',
    frameMaterial: 'Steel Frame',
    width: 300,
    height: 250,
    quantity: 1,
    color: 'Frosted',
    estimatedCost: 62000,
    status: 'approved',
    submissionDate: '2026-02-20',
    approvedDate: '2026-02-22',
    expiryDate: '2026-03-24',
  },
  {
    id: 'Q-0004',
    customerName: 'Roberto Lim',
    customerEmail: 'roberto.lim@email.com',
    customerPhone: '09451234567',
    customerAddress: '321 Luna St, Quezon City, Metro Manila',
    projectType: 'Glass Door',
    glassType: 'Tempered Glass',
    frameMaterial: 'Stainless Frame',
    width: 100,
    height: 220,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 35000,
    status: 'customer_accepted',
    submissionDate: '2026-02-15',
    approvedDate: '2026-02-17',
    expiryDate: '2026-03-19',
    acceptedDate: '2026-02-19',
  },
  {
    id: 'Q-0005',
    customerName: 'Carla Mendoza',
    customerEmail: 'carla.mendoza@email.com',
    customerPhone: '09561234567',
    customerAddress: '654 Aguinaldo Hwy, Cavite City, Cavite',
    projectType: 'Awning Window',
    glassType: 'Clear Glass',
    frameMaterial: 'Aluminum Frame',
    width: 120,
    height: 90,
    quantity: 3,
    color: 'Clear',
    estimatedCost: 18000,
    status: 'converted_to_order',
    submissionDate: '2026-02-10',
    approvedDate: '2026-02-12',
    expiryDate: '2026-03-14',
    acceptedDate: '2026-02-14',
    convertedDate: '2026-02-16',
  },
  {
    id: 'Q-0006',
    customerName: 'Pedro Garcia',
    customerEmail: 'pedro.garcia@email.com',
    customerPhone: '09671234567',
    customerAddress: '987 Del Pilar St, Manila City, Metro Manila',
    projectType: 'Fixed Window',
    glassType: 'Bronze Glass',
    frameMaterial: 'Aluminum Frame',
    width: 200,
    height: 150,
    quantity: 2,
    color: 'Bronze',
    estimatedCost: 32000,
    status: 'customer_declined',
    submissionDate: '2026-02-08',
    approvedDate: '2026-02-10',
    expiryDate: '2026-03-12',
    declinedDate: '2026-02-12',
  },
  {
    id: 'Q-0007',
    customerName: 'Linda Torres',
    customerEmail: 'linda.torres@email.com',
    customerPhone: '09781234567',
    customerAddress: '147 Quezon Ave, Caloocan City, Metro Manila',
    projectType: 'Glass Partition',
    glassType: 'Tempered Glass',
    frameMaterial: 'Aluminum Frame',
    width: 400,
    height: 280,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 85000,
    status: 'pending',
    submissionDate: '2026-03-01',
  },
  {
    id: 'Q-0008',
    customerName: 'Ricardo Tan',
    customerEmail: 'ricardo.tan@email.com',
    customerPhone: '09891234567',
    customerAddress: '258 Osmena Blvd, Cebu City, Cebu',
    projectType: 'Sliding Window',
    glassType: 'Clear Glass',
    frameMaterial: 'Aluminum Frame',
    width: 150,
    height: 100,
    quantity: 4,
    color: 'Clear',
    estimatedCost: 42000,
    status: 'approved',
    submissionDate: '2026-01-15',
    approvedDate: '2026-01-18',
    expiryDate: '2026-02-17', // Already expired
  },
  {
    id: 'Q-0009',
    customerName: 'Sofia Villanueva',
    customerEmail: 'sofia.villanueva@email.com',
    customerPhone: '09121234567',
    customerAddress: '369 Roxas Blvd, Paranaque City, Metro Manila',
    projectType: 'Glass Door',
    glassType: 'Tempered Glass',
    frameMaterial: 'Stainless Frame',
    width: 90,
    height: 210,
    quantity: 2,
    color: 'Clear',
    estimatedCost: 58000,
    status: 'pending',
    submissionDate: '2026-03-05',
  },
  {
    id: 'Q-0010',
    customerName: 'Manuel Cruz',
    customerEmail: 'manuel.cruz@email.com',
    customerPhone: '09231234567',
    customerAddress: '741 Magsaysay Ave, Davao City, Davao del Sur',
    projectType: 'Storefront',
    glassType: 'Clear Glass',
    frameMaterial: 'Aluminum Frame',
    width: 500,
    height: 300,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 120000,
    status: 'draft',
    submissionDate: '2026-03-02',
  },
  {
    id: 'Q-0011',
    customerName: 'Elena Ramos',
    customerEmail: 'elena.ramos@email.com',
    customerPhone: '09341234567',
    customerAddress: '852 Laurel St, Batangas City, Batangas',
    projectType: 'Awning Window',
    glassType: 'Bronze Glass',
    frameMaterial: 'Aluminum Frame',
    width: 100,
    height: 80,
    quantity: 6,
    color: 'Bronze',
    estimatedCost: 36000,
    status: 'customer_accepted',
    submissionDate: '2026-02-05',
    approvedDate: '2026-02-07',
    expiryDate: '2026-03-09',
    acceptedDate: '2026-02-09',
  },
  {
    id: 'Q-0012',
    customerName: 'David Aquino',
    customerEmail: 'david.aquino@email.com',
    customerPhone: '09451234568',
    customerAddress: '963 Quezon Ave, Baguio City, Benguet',
    projectType: 'Fixed Window',
    glassType: 'Frosted Glass',
    frameMaterial: 'Steel Frame',
    width: 180,
    height: 160,
    quantity: 3,
    color: 'Frosted',
    estimatedCost: 54000,
    status: 'pending',
    submissionDate: '2026-03-06',
    rejectionReason: 'Budget exceeds project allocation. Please resubmit with revised specifications.',
  },
];

const MOCK_ORDERS: InstallationOrder[] = [
  {
    id: 'ORD-0001',
    quoteId: 'Q-0005',
    customerName: 'Carla Mendoza',
    projectType: 'Awning Window',
    dimensions: '120cm × 90cm × 3 units',
    installationStatus: 'fabrication',
    orderDate: '2026-02-16',
    installationSchedule: '2026-03-15',
  },
];

const MOCK_LOGS: ActivityLog[] = [
  {
    id: 'LOG-00001',
    event: 'Admin approved quote',
    quoteId: 'Q-0003',
    userRole: 'admin',
    userName: 'Admin',
    timestamp: '2026-02-22T10:30:00Z',
  },
  {
    id: 'LOG-00002',
    event: 'Customer accepted quote',
    quoteId: 'Q-0004',
    userRole: 'customer',
    userName: 'Roberto Lim',
    timestamp: '2026-02-19T14:15:00Z',
  },
  {
    id: 'LOG-00003',
    event: 'Quote converted to order',
    quoteId: 'Q-0005',
    orderId: 'ORD-0001',
    userRole: 'admin',
    userName: 'Admin',
    timestamp: '2026-02-16T09:00:00Z',
  },
  {
    id: 'LOG-00004',
    event: 'Installation status updated',
    orderId: 'ORD-0001',
    userRole: 'admin',
    userName: 'Admin',
    timestamp: '2026-02-20T11:00:00Z',
    details: 'Status: fabrication',
  },
];

// ---- Context Interface ----
interface QuoteContextType {
  quotes: Quote[];
  installationOrders: InstallationOrder[];
  activityLogs: ActivityLog[];
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
}

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    // Auto-expire old quotes on load
    return MOCK_QUOTES.map((q) => {
      if (q.status === 'approved' && q.expiryDate && new Date(q.expiryDate) < new Date()) {
        return { ...q, status: 'expired' as QuoteStatus };
      }
      return q;
    });
  });
  const [installationOrders, setInstallationOrders] = useState<InstallationOrder[]>(MOCK_ORDERS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(MOCK_LOGS);
  const [nextQuoteSeq, setNextQuoteSeq] = useState(13);
  const [nextOrderSeq, setNextOrderSeq] = useState(2);

  const addLog = useCallback((entry: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const log: ActivityLog = {
      ...entry,
      id: `LOG-${String(Date.now()).slice(-5)}`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [log, ...prev]);
  }, []);

  const updateQuoteFn = useCallback((id: string, updates: Partial<Quote>) => {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...updates };
        // Auto-move to draft if editing a pending quote's cost
        if (q.status === 'pending' && updates.estimatedCost !== undefined) {
          updated.status = 'draft';
        }
        return updated;
      })
    );
    if (updates.estimatedCost !== undefined) {
      addLog({ event: 'Admin edited quote price', quoteId: id, userRole: 'admin', userName: 'Admin', details: `New price: ₱${updates.estimatedCost.toLocaleString()}` });
    }
  }, [addLog]);

  const approveQuoteFn = useCallback((id: string) => {
    const approvedDate = new Date().toISOString().split('T')[0];
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, status: 'approved' as QuoteStatus, approvedDate, expiryDate: getExpiryDate(approvedDate) }
          : q
      )
    );
    addLog({ event: 'Admin approved quote', quoteId: id, userRole: 'admin', userName: 'Admin' });
  }, [addLog]);

  const rejectQuoteFn = useCallback((id: string, reason: string) => {
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: 'customer_declined' as QuoteStatus, rejectionReason: reason } : q
      )
    );
    addLog({ event: 'Admin rejected quote', quoteId: id, userRole: 'admin', userName: 'Admin', details: reason });
  }, [addLog]);

  const convertToOrderFn = useCallback((id: string) => {
    setQuotes((prev) => {
      const quote = prev.find((q) => q.id === id);
      if (!quote || quote.status !== 'customer_accepted') return prev;

      const orderId = generateOrderId(nextOrderSeq);
      setNextOrderSeq((s) => s + 1);

      const order: InstallationOrder = {
        id: orderId,
        quoteId: id,
        customerName: quote.customerName,
        projectType: quote.projectType,
        dimensions: `${quote.width}cm × ${quote.height}cm × ${quote.quantity} unit(s)`,
        installationStatus: 'materials_ordered',
        orderDate: new Date().toISOString().split('T')[0],
      };
      setInstallationOrders((prev) => [order, ...prev]);

      addLog({ event: 'Quote converted to order', quoteId: id, orderId, userRole: 'admin', userName: 'Admin' });

      return prev.map((q) =>
        q.id === id
          ? { ...q, status: 'converted_to_order' as QuoteStatus, convertedDate: new Date().toISOString().split('T')[0] }
          : q
      );
    });
  }, [addLog, nextOrderSeq]);

  const updateInstallationStatusFn = useCallback((orderId: string, status: InstallationStatus) => {
    setInstallationOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, installationStatus: status } : o))
    );
    addLog({ event: 'Installation status updated', orderId, userRole: 'admin', userName: 'Admin', details: `Status: ${status}` });
  }, [addLog]);

  const customerAcceptQuoteFn = useCallback((id: string) => {
    setQuotes((prev) => {
      const quote = prev.find((q) => q.id === id);
      if (!quote) return prev;
      // Check expiry
      if (quote.expiryDate && new Date(quote.expiryDate) < new Date()) {
        return prev.map((q) => (q.id === id ? { ...q, status: 'expired' as QuoteStatus } : q));
      }
      addLog({ event: 'Customer accepted quote', quoteId: id, userRole: 'customer', userName: quote.customerName });
      return prev.map((q) =>
        q.id === id
          ? { ...q, status: 'customer_accepted' as QuoteStatus, acceptedDate: new Date().toISOString().split('T')[0] }
          : q
      );
    });
  }, [addLog]);

  const customerDeclineQuoteFn = useCallback((id: string) => {
    setQuotes((prev) => {
      const quote = prev.find((q) => q.id === id);
      if (!quote) return prev;
      addLog({ event: 'Customer declined quote', quoteId: id, userRole: 'customer', userName: quote.customerName });
      return prev.map((q) =>
        q.id === id
          ? { ...q, status: 'customer_declined' as QuoteStatus, declinedDate: new Date().toISOString().split('T')[0] }
          : q
      );
    });
  }, [addLog]);

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
        updateQuote: updateQuoteFn,
        approveQuote: approveQuoteFn,
        rejectQuote: rejectQuoteFn,
        convertToOrder: convertToOrderFn,
        updateInstallationStatus: updateInstallationStatusFn,
        customerAcceptQuote: customerAcceptQuoteFn,
        customerDeclineQuote: customerDeclineQuoteFn,
        getQuoteById: getQuoteByIdFn,
        getQuotesByEmail: getQuotesByEmailFn,
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
