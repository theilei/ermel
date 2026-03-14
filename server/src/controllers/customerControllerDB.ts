// ============================================================
// Customer Controller — Customer-facing quote actions (PostgreSQL-backed)
// ============================================================
import { Request, Response } from 'express';
import * as QuoteModel from '../models/QuoteDB';
import * as ActivityLogService from '../services/activityLogService';
import * as NotificationService from '../services/notificationService';

function toFrontendQuote(q: QuoteModel.Quote) {
  return {
    id: q.quoteNumber,
    customerName: q.customerName,
    customerEmail: q.customerEmail,
    customerPhone: q.customerPhone,
    customerAddress: q.customerAddress,
    projectType: q.projectType,
    glassType: q.glassType,
    frameMaterial: q.frameMaterial,
    width: q.width,
    height: q.height,
    quantity: q.quantity,
    color: q.color,
    estimatedCost: q.estimatedCost,
    status: q.status,
    submissionDate: q.submissionDate,
    rejectionReason: q.rejectionReason,
    approvedDate: q.approvedDate,
    expiryDate: q.expiryDate,
    acceptedDate: q.acceptedDate,
    declinedDate: q.declinedDate,
    convertedDate: q.convertedDate,
    notes: q.notes,
  };
}

// GET /api/customer/quotes
export async function getMyQuotes(req: Request, res: Response) {
  try {
    const email = req.session?.userEmail;

    if (!email) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    await QuoteModel.expireOldQuotes();
    const quotes = await QuoteModel.getQuotesByEmail(email);

    return res.json({ success: true, data: quotes.map(toFrontendQuote) });
  } catch (err: any) {
    console.error('[CUSTOMER CTRL] getMyQuotes error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// GET /api/customer/quotes/:id
export async function getMyQuote(req: Request, res: Response) {
  try {
    const email = req.session?.userEmail;

    if (!email) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const quote = await QuoteModel.getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, data: toFrontendQuote(quote) });
  } catch (err: any) {
    console.error('[CUSTOMER CTRL] getMyQuote error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/customer/quotes/:id/accept
export async function acceptQuote(req: Request, res: Response) {
  try {
    const quote = await QuoteModel.getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    if (quote.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved quotes can be accepted.' });
    }

    // Check expiry
    if (quote.expiryDate && new Date() > new Date(quote.expiryDate)) {
      await QuoteModel.updateQuote(quote.id, { status: 'expired' });
      return res.status(400).json({ success: false, message: 'This quote has expired and can no longer be accepted.' });
    }

    const updated = await QuoteModel.updateQuote(quote.id, {
      status: 'customer_accepted',
      acceptedDate: new Date().toISOString().split('T')[0],
    });

    await ActivityLogService.logCustomerAccepted(quote.id, quote.customerName);
    await NotificationService.notifyAdminCustomerAction(quote.quoteNumber, quote.customerName, 'accepted');

    return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
  } catch (err: any) {
    console.error('[CUSTOMER CTRL] acceptQuote error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/customer/quotes/:id/decline
export async function declineQuote(req: Request, res: Response) {
  try {
    const quote = await QuoteModel.getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    if (quote.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved quotes can be declined.' });
    }

    const updated = await QuoteModel.updateQuote(quote.id, {
      status: 'customer_declined',
      declinedDate: new Date().toISOString().split('T')[0],
    });

    await ActivityLogService.logCustomerDeclined(quote.id, quote.customerName);
    await NotificationService.notifyAdminCustomerAction(quote.quoteNumber, quote.customerName, 'declined');

    return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
  } catch (err: any) {
    console.error('[CUSTOMER CTRL] declineQuote error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
