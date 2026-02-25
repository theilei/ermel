import React, { createContext, useContext, useState } from 'react';
import { MOCK_ORDERS, Order, OrderStatus } from '../data/mockData';

interface AppContextType {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus, scheduledDate?: string) => void;
  updateOrderCost: (id: string, approvedCost: number) => void;
  addOrder: (order: Order) => void;
  markPaymentUploaded: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const updateOrderStatus = (id: string, status: OrderStatus, scheduledDate?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status, ...(scheduledDate ? { scheduledDate } : {}) }
          : o
      )
    );
  };

  const updateOrderCost = (id: string, approvedCost: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, approvedCost, paid: false } : o))
    );
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const markPaymentUploaded = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, paymentUploaded: true } : o))
    );
  };

  return (
    <AppContext.Provider value={{ orders, updateOrderStatus, updateOrderCost, addOrder, markPaymentUploaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
