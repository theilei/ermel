// ============================================================
// Customer Controller — Customer-facing quote actions
// ============================================================
import { Request, Response } from 'express';
import * as QuoteModel from '../models/Quote';
import * as ActivityLogService from '../services/activityLogService';

// GET /api/customer/quotes — Get quotes for a customer by email
export function getMyQuotes(req: Request, res: Response) {
  const email = req.query.email as string || req.headers['x-customer-email'] as string;
  if (!email) return res.status(400).json({ error: 'Customer email is required.' });

  QuoteModel.expireOldQuotes();
  const quotes = QuoteModel.getQuotesByEmail(email);

  return res.json(quotes);
}

// GET /api/customer/quotes/:id — Get single quote (if owned by customer)
export function getMyQuote(req: Request, res: Response) {
  const email = req.query.email as string || req.headers['x-customer-email'] as string;
  const quote = QuoteModel.getQuoteById(req.params.id);

  if (!quote) return res.status(404).json({ error: 'Quote not found.' });
  if (email && quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  return res.json(quote);
}

// POST /api/customer/quotes/:id/accept — Customer accepts an approved quote
export function acceptQuote(req: Request, res: Response) {
  const quote = QuoteModel.getQuoteById(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found.' });

  if (quote.status !== 'approved') {
    return res.status(400).json({ error: 'Only approved quotes can be accepted.' });
  }

  // Check expiry
  if (quote.expiryDate && new Date() > new Date(quote.expiryDate)) {
    QuoteModel.updateQuote(req.params.id, { status: 'expired' });
    return res.status(400).json({ error: 'This quote has expired and can no longer be accepted.' });
  }

  const updated = QuoteModel.updateQuote(req.params.id, {
    status: 'customer_accepted',
    acceptedDate: new Date().toISOString().split('T')[0],
  });

  ActivityLogService.logCustomerAccepted(req.params.id, quote.customerName);

  return res.json(updated);
}

// POST /api/customer/quotes/:id/decline — Customer declines an approved quote
export function declineQuote(req: Request, res: Response) {
  const quote = QuoteModel.getQuoteById(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found.' });

  if (quote.status !== 'approved') {
    return res.status(400).json({ error: 'Only approved quotes can be declined.' });
  }

  const updated = QuoteModel.updateQuote(req.params.id, {
    status: 'customer_declined',
    declinedDate: new Date().toISOString().split('T')[0],
  });

  ActivityLogService.logCustomerDeclined(req.params.id, quote.customerName);

  return res.json(updated);
}
