// ============================================================
// Notification Service — creates notifications for users
// ============================================================
import * as NotificationModel from '../models/Notification';
import pool from '../config/database';

// Find user ID by email
async function findUserIdByEmail(email: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1`,
    [email]
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function notifyQuoteApproved(customerEmail: string, quoteNumber: string) {
  const userId = await findUserIdByEmail(customerEmail);
  if (!userId) return;
  await NotificationModel.createNotification(
    userId,
    'Quote Approved',
    `Your quotation ${quoteNumber} has been approved. Please review and accept or decline within 30 days.`
  );
}

export async function notifyQuoteRejected(customerEmail: string, quoteNumber: string, reason: string) {
  const userId = await findUserIdByEmail(customerEmail);
  if (!userId) return;
  await NotificationModel.createNotification(
    userId,
    'Quote Update',
    `Your quotation ${quoteNumber} has been declined. Reason: ${reason}`
  );
}

export async function notifyQuoteConverted(customerEmail: string, quoteNumber: string, orderNumber: string) {
  const userId = await findUserIdByEmail(customerEmail);
  if (!userId) return;
  await NotificationModel.createNotification(
    userId,
    'Order Created',
    `Your quotation ${quoteNumber} has been converted to order ${orderNumber}. Installation will begin soon.`
  );
}

export async function notifyInstallationStatusUpdate(customerEmail: string, orderNumber: string, status: string) {
  const userId = await findUserIdByEmail(customerEmail);
  if (!userId) return;
  const statusLabels: Record<string, string> = {
    materials_ordered: 'Materials Ordered',
    fabrication: 'Fabrication',
    installation: 'Installation',
    completed: 'Completed',
  };
  await NotificationModel.createNotification(
    userId,
    'Installation Update',
    `Order ${orderNumber}: status updated to "${statusLabels[status] || status}".`
  );
}

export async function notifyAdminsNewQuote(quoteNumber: string, customerName: string) {
  // Notify all admins about a new quote submission
  const admins = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL`
  );
  for (const admin of admins.rows) {
    await NotificationModel.createNotification(
      admin.id,
      'New Quote Request',
      `${customerName} submitted a new quote request (${quoteNumber}).`
    );
  }
}

export async function notifyAdminCustomerAction(quoteNumber: string, customerName: string, action: 'accepted' | 'declined') {
  const admins = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL`
  );
  for (const admin of admins.rows) {
    await NotificationModel.createNotification(
      admin.id,
      `Customer ${action === 'accepted' ? 'Accepted' : 'Declined'} Quote`,
      `${customerName} ${action} quotation ${quoteNumber}.`
    );
  }
}
