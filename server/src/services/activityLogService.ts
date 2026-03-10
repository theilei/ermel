// ============================================================
// Activity Log Service
// ============================================================
import { addLog, getAllLogs, getLogsByQuote, getLogsByOrder, ActivityLog } from '../models/ActivityLog';

export function logQuoteApproved(quoteId: string, adminName: string) {
  return addLog({ event: 'Admin approved quote', quoteId, userRole: 'admin', userName: adminName });
}

export function logQuoteRejected(quoteId: string, adminName: string, reason: string) {
  return addLog({ event: 'Admin rejected quote', quoteId, userRole: 'admin', userName: adminName, details: reason });
}

export function logQuotePriceEdited(quoteId: string, adminName: string, newPrice: number) {
  return addLog({ event: 'Admin edited quote price', quoteId, userRole: 'admin', userName: adminName, details: `New price: ₱${newPrice.toLocaleString()}` });
}

export function logCustomerAccepted(quoteId: string, customerName: string) {
  return addLog({ event: 'Customer accepted quote', quoteId, userRole: 'customer', userName: customerName });
}

export function logCustomerDeclined(quoteId: string, customerName: string) {
  return addLog({ event: 'Customer declined quote', quoteId, userRole: 'customer', userName: customerName });
}

export function logConvertedToOrder(quoteId: string, orderId: string, adminName: string) {
  return addLog({ event: 'Quote converted to order', quoteId, orderId, userRole: 'admin', userName: adminName });
}

export function logInstallationStatusUpdated(orderId: string, adminName: string, newStatus: string) {
  return addLog({ event: 'Installation status updated', orderId, userRole: 'admin', userName: adminName, details: `Status: ${newStatus}` });
}

export { getAllLogs, getLogsByQuote, getLogsByOrder };
export type { ActivityLog };
