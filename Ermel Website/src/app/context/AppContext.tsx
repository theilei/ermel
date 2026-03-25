import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as api from '../services/api';

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
  // Extended fields from quotation module
  projectCategoryOther?: string | null;
  glassTypeOther?: string | null;
  colorOther?: string | null;
  widthM?: number;
  heightM?: number;
  widthCm?: number;
  heightCm?: number;
  widthFt?: number;
  heightFt?: number;
  address?: string;
  measurementUnit?: 'cm' | 'm' | 'ft' | 'in';
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
}

interface AppContextType {
  orders: Order[];
  orderSummary: OrderSummary;
  loading: boolean;
  updateOrderStatus: (id: string, status: OrderStatus, scheduledDate?: string) => void;
  updateOrderCost: (id: string, approvedCost: number) => void;
  addOrder: (order: Order) => void;
  markPaymentUploaded: (id: string) => void;
  refreshOrders: () => Promise<void>;
  refreshOrderSummary: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function mapApiOrder(o: any): Order {
  return {
    id: o.id || o.orderNumber,
    customer: o.customer,
    project: o.project,
    material: o.material,
    glassType: o.glassType || o.glass_type,
    dimensions: o.dimensions,
    width: o.width,
    height: o.height,
    estimatedCost: o.estimatedCost || o.estimated_cost,
    approvedCost: o.approvedCost || o.approved_cost || undefined,
    status: o.status as OrderStatus,
    createdDate: o.createdDate || o.createdAt?.split('T')[0] || '',
    scheduledDate: o.scheduledDate || o.scheduled_date || undefined,
    phone: o.phone,
    email: o.email,
    notes: o.notes || undefined,
    paid: o.paid ?? false,
    paymentUploaded: o.paymentUploaded || o.payment_uploaded || false,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({ totalOrders: 0, totalRevenue: 0, activeOrders: 0 });
  const [loading, setLoading] = useState(true);

  const refreshOrders = useCallback(async () => {
    try {
      const result = await api.fetchLegacyOrders();
      const data = (result as any).data || result;
      const list = Array.isArray(data) ? data : [];
      setOrders(list.map(mapApiOrder));
    } catch (err) {
      console.error('[AppContext] Failed to fetch orders:', err);
    }
  }, []);

  const refreshOrderSummary = useCallback(async () => {
    try {
      const result = await api.fetchLegacyOrderSummary();
      const data = (result as any).data || result;
      setOrderSummary({
        totalOrders: Number(data?.totalOrders || 0),
        totalRevenue: Number(data?.totalRevenue || 0),
        activeOrders: Number(data?.activeOrders || 0),
      });
    } catch (err) {
      console.error('[AppContext] Failed to fetch order summary:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshOrders(), refreshOrderSummary()]);
      setLoading(false);
    })();
  }, [refreshOrders, refreshOrderSummary]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus, scheduledDate?: string) => {
    try {
      await api.updateLegacyOrderStatus(id, status, scheduledDate);
      await Promise.all([refreshOrders(), refreshOrderSummary()]);
    } catch (err) {
      console.error('[AppContext] updateOrderStatus failed:', err);
    }
  }, [refreshOrders, refreshOrderSummary]);

  const updateOrderCost = useCallback(async (id: string, approvedCost: number) => {
    try {
      await api.updateLegacyOrderCost(id, approvedCost);
      await Promise.all([refreshOrders(), refreshOrderSummary()]);
    } catch (err) {
      console.error('[AppContext] updateOrderCost failed:', err);
    }
  }, [refreshOrders, refreshOrderSummary]);

  const addOrder = useCallback(async (order: Order) => {
    try {
      await api.createLegacyOrder({
        customer: order.customer,
        project: order.project,
        material: order.material,
        glassType: order.glassType,
        dimensions: order.dimensions,
        width: order.width,
        height: order.height,
        estimatedCost: order.estimatedCost,
        phone: order.phone,
        email: order.email,
        notes: order.notes,
      });
      await Promise.all([refreshOrders(), refreshOrderSummary()]);
    } catch (err) {
      console.error('[AppContext] addOrder failed:', err);
    }
  }, [refreshOrders, refreshOrderSummary]);

  const markPaymentUploaded = useCallback(async (id: string) => {
    try {
      await api.markLegacyOrderPayment(id);
      await Promise.all([refreshOrders(), refreshOrderSummary()]);
    } catch (err) {
      console.error('[AppContext] markPaymentUploaded failed:', err);
    }
  }, [refreshOrders, refreshOrderSummary]);

  return (
    <AppContext.Provider value={{ orders, orderSummary, loading, updateOrderStatus, updateOrderCost, addOrder, markPaymentUploaded, refreshOrders, refreshOrderSummary }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
