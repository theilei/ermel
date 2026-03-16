// ============================================================
// Activity Log Service — PostgreSQL-backed
// ============================================================
import { addLog, getAllLogs, getLogsByQuote, getLogsByOrder, type ActivityLog } from '../models/ActivityLogDB';

export function logQuoteApproved(quoteId: string, adminName: string) {
  return addLog({ action: 'Admin approved quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'admin', userName: adminName });
}

export function logQuoteRejected(quoteId: string, adminName: string, reason: string) {
  return addLog({ action: 'Admin rejected quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'admin', userName: adminName, details: reason });
}

export function logQuotePriceEdited(quoteId: string, adminName: string, newPrice: number) {
  return addLog({ action: 'Admin edited quote price', entity: 'quote', entityId: quoteId, quoteId, userRole: 'admin', userName: adminName, details: `New price: ₱${newPrice.toLocaleString()}` });
}

export function logCustomerAccepted(quoteId: string, customerName: string) {
  return addLog({ action: 'Customer accepted quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'customer', userName: customerName });
}

export function logCustomerDeclined(quoteId: string, customerName: string) {
  return addLog({ action: 'Customer declined quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'customer', userName: customerName });
}

export function logConvertedToOrder(quoteId: string, orderId: string, adminName: string) {
  return addLog({ action: 'Quote converted to order', entity: 'order', entityId: orderId, quoteId, orderId, userRole: 'admin', userName: adminName });
}

export function logInstallationStatusUpdated(orderId: string, adminName: string, newStatus: string) {
  return addLog({ action: 'Installation status updated', entity: 'order', entityId: orderId, orderId, userRole: 'admin', userName: adminName, details: `Status: ${newStatus}` });
}

export { getAllLogs, getLogsByQuote, getLogsByOrder };
export type { ActivityLog };
