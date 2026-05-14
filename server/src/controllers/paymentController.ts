import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import multer from 'multer';
import pool from '../config/database';
import * as QuoteModel from '../models/QuoteDB';
import * as PaymentModel from '../models/PaymentDB';
import * as NotificationService from '../services/notificationService';
import * as ActivityLogService from '../services/activityLogService';
import { sendEmail } from '../services/emailService';
import { generateCashReceiptPdf } from '../services/paymentReceiptService';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const paymentUploadsDir = path.join(process.cwd(), 'uploads', 'payments');
if (!fs.existsSync(paymentUploadsDir)) {
  fs.mkdirSync(paymentUploadsDir, { recursive: true });
}

function hasDoubleExtension(filename: string): boolean {
  const base = path.basename(filename).toLowerCase();
  const parts = base.split('.').filter(Boolean);
  if (parts.length < 2) return true;
  if (parts.length > 2) return true;
  const ext = `.${parts[parts.length - 1]}`;
  return !ALLOWED_EXTENSIONS.has(ext);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, paymentUploadsDir),
  filename: (req, file, cb) => {
    const safe = sanitizeFilename(file.originalname);
    const ext = path.extname(safe).toLowerCase();
    const quoteId = String(req.params.id || 'quote').replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${quoteId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    if (hasDoubleExtension(file.originalname)) {
      cb(new Error('Invalid file name. Double extensions are not allowed.'));
      return;
    }

    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
      cb(new Error('Invalid file type. Allowed: jpg, jpeg, png, pdf.'));
      return;
    }

    cb(null, true);
  },
});

export const uploadPaymentProof: RequestHandler = (req, res, next) => {
  upload.single('proof')(req, res, (err: any) => {
    if (!err) return next();
    const message = err?.message || 'Upload failed.';
    return res.status(400).json({ success: false, message });
  });
};

async function getQuoteForCustomer(req: Request): Promise<QuoteModel.Quote | undefined> {
  const quote = await QuoteModel.getQuoteById(req.params.id);
  const email = req.session?.userEmail;
  if (!quote || !email) return undefined;
  if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) return undefined;
  return quote;
}

function paymentCountdown(quoteCreatedAt: string) {
  const created = new Date(quoteCreatedAt);
  const deadline = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
  const remainingMs = Math.max(0, deadline.getTime() - Date.now());
  return {
    deadline: deadline.toISOString(),
    remainingMs,
    expired: remainingMs <= 0,
  };
}

async function ensureNotExpired(quote: QuoteModel.Quote) {
  const countdown = paymentCountdown(quote.createdAt);
  if (!countdown.expired) return false;
  if (quote.status !== 'approved') return false;

  await QuoteModel.updateQuote(quote.id, { status: 'cancelled' as any });
  const existingPayment = await PaymentModel.getPaymentByQuoteId(quote.id);
  if (existingPayment && existingPayment.status !== 'paid') {
    await PaymentModel.expireOldPendingPayments();
  }
  await NotificationService.notifyPaymentExpired(quote.customerEmail, quote.quoteNumber).catch(() => {});
  await sendEmail({
    to: quote.customerEmail,
    subject: `Payment Expired (${quote.quoteNumber})`,
    html: `<p>Payment window for ${quote.quoteNumber} expired. Please create a new quote request.</p>`,
  }).catch(() => {});
  return true;
}

export async function getCustomerPayment(req: Request, res: Response) {
  try {
    await PaymentModel.expireOldPendingPayments();

    const quote = await getQuoteForCustomer(req);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const expiredAndCancelled = await ensureNotExpired(quote);
    const freshQuote = expiredAndCancelled ? await QuoteModel.getQuoteById(quote.id) : quote;
    const payment = await PaymentModel.getPaymentByQuoteId(quote.id);

    const countdown = paymentCountdown(quote.createdAt);

    return res.json({
      success: true,
      data: {
        quoteId: quote.quoteNumber,
        quoteStatus: freshQuote?.status || quote.status,
        payment: payment || null,
        countdown,
      },
    });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] getCustomerPayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function setPaymentMethod(req: Request, res: Response) {
  try {
    const quote = await getQuoteForCustomer(req);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    if (quote.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Payment is available only for approved quotes.' });
    }

    const method = String(req.body?.paymentMethod || '').toLowerCase();
    if (method !== 'qrph' && method !== 'cash') {
      return res.status(400).json({ success: false, message: 'Invalid payment method.' });
    }

    const expired = await ensureNotExpired(quote);
    if (expired) {
      return res.status(400).json({ success: false, message: 'Payment period expired. Please create a new quote.' });
    }

    const payment = await PaymentModel.createPayment(quote.id, method as 'qrph' | 'cash');
    return res.json({ success: true, data: payment });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] setPaymentMethod error:', err.message);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : (err?.message || 'Internal server error.'),
    });
  }
}

export async function submitQrphProof(req: Request, res: Response) {
  try {
    const quote = await getQuoteForCustomer(req);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    if (quote.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Payment is available only for approved quotes.' });
    }

    const payment = await PaymentModel.getPaymentByQuoteId(quote.id);
    if (!payment || payment.paymentMethod !== 'qrph') {
      return res.status(400).json({ success: false, message: 'Please select QRPH payment method first.' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is already verified.' });
    }

    const expired = await ensureNotExpired(quote);
    if (expired) {
      return res.status(400).json({ success: false, message: 'Payment period expired. Please create a new quote.' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Proof file is required.' });
    }

    if (payment.proofFile) {
      const previousPath = path.join(process.cwd(), payment.proofFile.replace(/^\//, ''));
      if (fs.existsSync(previousPath)) {
        try {
          fs.unlinkSync(previousPath);
        } catch {
          // Ignore stale file cleanup errors and continue persisting latest proof.
        }
      }
    }

    const saved = await PaymentModel.markPaymentSubmitted(quote.id, {
      proofFile: `/uploads/payments/${path.basename(file.path)}`,
      proofMime: file.mimetype,
    });

    await ActivityLogService.logCustomerPaymentProofSubmitted(quote.id, quote.quoteNumber, quote.customerName).catch(() => {});

    await NotificationService.notifyPaymentSubmitted(quote.customerEmail, quote.quoteNumber);
    await NotificationService.notifyAdminsPaymentSubmitted(quote.quoteNumber, quote.customerName);

    const companyEmail = process.env.COMPANY_EMAIL || process.env.GMAIL_USER;
    if (companyEmail) {
      await sendEmail({
        to: companyEmail,
        subject: `Payment Submitted: ${quote.quoteNumber}`,
        html: `<p>${quote.customerName} submitted payment proof for ${quote.quoteNumber}.</p>`,
      }).catch(() => {});
    }

    return res.json({ success: true, data: saved });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] submitQrphProof error:', err.message);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : (err?.message || 'Internal server error.'),
    });
  }
}

export async function deleteQrphProof(req: Request, res: Response) {
  try {
    const quote = await getQuoteForCustomer(req);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const payment = await PaymentModel.getPaymentByQuoteId(quote.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });
    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Verified payments cannot be modified.' });
    }

    if (payment.proofFile) {
      const diskPath = path.join(process.cwd(), payment.proofFile.replace(/^\//, ''));
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    }

    const updated = await PaymentModel.clearPaymentProof(quote.id);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] deleteQrphProof error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function downloadCashReceipt(req: Request, res: Response) {
  try {
    const quote = await getQuoteForCustomer(req);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    if (quote.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Receipt available only for approved quotes.' });
    }

    const payment = await PaymentModel.getPaymentByQuoteId(quote.id);
    if (!payment || payment.paymentMethod !== 'cash') {
      return res.status(400).json({ success: false, message: 'Please select cash payment method first.' });
    }

    const pdf = await generateCashReceiptPdf(quote);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cash-receipt-${quote.quoteNumber}.pdf"`);
    return res.send(pdf);
  } catch (err: any) {
    console.error('[PAYMENT CTRL] downloadCashReceipt error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function adminListPayments(_req: Request, res: Response) {
  try {
    await PaymentModel.expireOldPendingPayments();
    const rows = await PaymentModel.listPaymentsForAdmin();
    return res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] adminListPayments error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function adminApprovePayment(req: Request, res: Response) {
  try {
    const quote = await QuoteModel.getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const payment = await PaymentModel.getPaymentByQuoteId(quote.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.paymentMethod !== 'qrph' && payment.paymentMethod !== 'cash') {
      return res.status(400).json({ success: false, message: 'Unsupported payment method for approval.' });
    }
    if (payment.paymentMethod === 'qrph' && !payment.proofFile) {
      return res.status(400).json({ success: false, message: 'Payment proof is required before approval.' });
    }
    if (payment.status === 'expired') {
      return res.status(400).json({ success: false, message: 'Expired payments cannot be approved.' });
    }

    const updated = await PaymentModel.markPaymentPaid(quote.id);
    const adminName = req.session?.userName || 'Admin';

    await ActivityLogService.logAdminPaymentVerified(quote.id, quote.quoteNumber, adminName).catch(() => {});

    await pool.query(
      `UPDATE reservations
       SET status = 'approved'
       WHERE quote_id = $1`,
      [quote.id]
    );

    await NotificationService.notifyPaymentVerified(quote.customerEmail, quote.quoteNumber);

    await sendEmail({
      to: quote.customerEmail,
      subject: `Payment Verified (${quote.quoteNumber})`,
      html: `<p>Your payment for ${quote.quoteNumber} has been verified. Your reservation date is now locked.</p>`,
    }).catch(() => {});

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] adminApprovePayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function adminRejectPayment(req: Request, res: Response) {
  try {
    const quote = await QuoteModel.getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const payment = await PaymentModel.getPaymentByQuoteId(quote.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.paymentMethod !== 'qrph') {
      return res.status(400).json({ success: false, message: 'Only QRPH payments can be rejected from this panel.' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Verified payments cannot be rejected.' });
    }

    const updated = await PaymentModel.rejectPayment(quote.id, reason);

    await NotificationService.notifyPaymentRejected(quote.customerEmail, quote.quoteNumber, reason).catch(() => {});

    await sendEmail({
      to: quote.customerEmail,
      subject: `Payment Rejected (${quote.quoteNumber})`,
      html: `<p>Your payment proof for ${quote.quoteNumber} was rejected.</p><p>Reason: ${reason}</p><p>You may re-upload your proof.</p>`,
    }).catch(() => {});

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[PAYMENT CTRL] adminRejectPayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
