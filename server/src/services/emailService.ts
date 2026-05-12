// ============================================================
// Email Service — Brevo/Resend API with SMTP fallback
// ============================================================
// Configure Brevo/Resend via environment variables. If not configured,
// falls back to Gmail SMTP or dev console logs.

import { Quote } from '../models/QuoteDB';
import { sendTransactionalEmail } from './smtpClient';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachmentHtml?: string; // PDF HTML content
}

/**
 * Send an email. In development, logs to console.
 * In production, configure nodemailer with Gmail SMTP.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html } = options;
  const hasBrevo = Boolean((process.env.BREVO_API_KEY || '').trim());
  const hasResend = Boolean((process.env.RESEND_API_KEY || '').trim());
  const hasSmtp = Boolean(
    (process.env.GMAIL_USER || '').trim()
    && (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim()
  );

  if (!hasBrevo && !hasResend && !hasSmtp) {
    // Development fallback — log to console
    console.log(`[EMAIL-DEV] Would send to: ${to}`);
    console.log(`[EMAIL-DEV] Subject: ${subject}`);
    console.log(`[EMAIL-DEV] Body length: ${html.length} chars`);
    if (options.attachmentHtml) {
      console.log(`[EMAIL-DEV] PDF attachment: ${options.attachmentHtml.length} chars`);
    }
    return true;
  }

  try {
    const attachments = options.attachmentHtml
      ? [{ filename: 'quotation.html', content: options.attachmentHtml, contentType: 'text/html' }]
      : undefined;

    await sendTransactionalEmail({
      to,
      subject,
      html,
      attachments,
    });

    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
    return false;
  }
}

/**
 * Send quote approval notification to customer.
 */
export async function sendQuoteApprovalEmail(quote: Quote, pdfHtml: string): Promise<boolean> {
  const dashboardUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/dashboard`
    : 'http://localhost:5173/dashboard';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #15263c;">
      <div style="background: #15263c; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; font-size: 24px; margin: 0;">ERMEL</h1>
        <p style="color: #9ab0c4; font-size: 12px; margin: 4px 0 0; letter-spacing: 2px; text-transform: uppercase;">Glass & Aluminum Works</p>
      </div>
      
      <div style="background: white; padding: 32px; border: 1px solid #e0e4ea; border-top: none;">
        <h2 style="color: #15263c; font-size: 20px; margin: 0 0 16px;">Your Quotation is Ready</h2>
        
        <p style="color: #54667d; line-height: 1.6;">
          Dear <strong>${quote.customerName}</strong>,
        </p>
        
        <p style="color: #54667d; line-height: 1.6;">
          We are pleased to inform you that your quotation has been approved. Please find the details below:
        </p>

        <div style="background: #f5f7fa; border: 1px solid #e0e4ea; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #54667d; font-size: 13px;">Quote ID:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quote.quoteNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #54667d; font-size: 13px;">Project:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quote.projectType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #54667d; font-size: 13px;">Description:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quote.glassType} · ${quote.frameMaterial}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #54667d; font-size: 13px;">Dimensions:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quote.width}cm × ${quote.height}cm × ${quote.quantity} unit(s)</td>
            </tr>
            <tr style="border-top: 2px solid #15263c;">
              <td style="padding: 12px 0; color: #15263c; font-size: 16px; font-weight: bold;">Total Price:</td>
              <td style="padding: 12px 0; color: #7a0000; font-size: 20px; font-weight: bold; text-align: right;">₱${quote.estimatedCost.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fff8e1; border: 1px solid #f0c04066; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <strong style="color: #7a5200;">⏰ Validity Period:</strong>
          <span style="color: #7a5200;"> This quotation is valid for 30 days from ${quote.approvedDate || 'the approval date'}.</span>
        </div>

        <p style="color: #54667d; line-height: 1.6;">
          Please review the attached quotation document. You can accept or decline this quote through your customer dashboard:
        </p>

        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7a0000, #a50000); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0;">
          View in Dashboard →
        </a>

        <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
          If you have any questions, please don't hesitate to contact us.
        </p>
      </div>

      <div style="background: #f5f7fa; padding: 16px 32px; border-radius: 0 0 8px 8px; border: 1px solid #e0e4ea; border-top: none; text-align: center;">
        <p style="color: #54667d; font-size: 11px; margin: 0;">
          ERMEL Glass & Aluminum Works | Metro Manila, Philippines<br>
          Phone: +63 917 123 4567 | Email: info@ermel.ph
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: quote.customerEmail,
    subject: `Your Quotation ${quote.quoteNumber} is Ready — ERMEL Glass & Aluminum`,
    html,
    attachmentHtml: pdfHtml,
  });
}

export async function sendQuoteSubmissionEmails(quote: Quote): Promise<void> {
  const companyEmail = process.env.COMPANY_EMAIL || process.env.GMAIL_USER;

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #15263c;">
      <h2 style="margin: 0 0 12px;">Quote Request Received</h2>
      <p>Hello ${quote.customerName},</p>
      <p>We received your quote request <strong>${quote.quoteNumber}</strong>. Our team will review it and follow up soon.</p>
      <p><strong>Project:</strong> ${quote.projectType}<br>
      <strong>Material:</strong> ${quote.frameMaterial}<br>
      <strong>Dimensions:</strong> ${quote.width}cm × ${quote.height}cm</p>
      <p style="color:#54667d;">Thank you for choosing Ermel Glass & Aluminum Works.</p>
    </div>
  `;

  const companyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #15263c;">
      <h2 style="margin: 0 0 12px;">New Quote Submitted</h2>
      <p><strong>Quote:</strong> ${quote.quoteNumber}</p>
      <p><strong>Customer:</strong> ${quote.customerName} (${quote.customerEmail})</p>
      <p><strong>Phone:</strong> ${quote.customerPhone}</p>
      <p><strong>Project:</strong> ${quote.projectType}</p>
      <p><strong>Material:</strong> ${quote.frameMaterial}</p>
      <p><strong>Dimensions:</strong> ${quote.width}cm × ${quote.height}cm</p>
      <p><strong>Estimated Cost:</strong> ₱${quote.estimatedCost.toLocaleString()}</p>
      <p><strong>Notes:</strong> ${quote.notes || 'N/A'}</p>
    </div>
  `;

  await sendEmail({
    to: quote.customerEmail,
    subject: `Quote Request Received (${quote.quoteNumber})`,
    html: customerHtml,
  });

  if (companyEmail) {
    await sendEmail({
      to: companyEmail,
      subject: `New Quote Request ${quote.quoteNumber}`,
      html: companyHtml,
    });
  }
}

export async function sendQuoteStatusUpdateEmail(
  quote: Quote,
  payload: { status?: string; estimatedPrice?: number; updatedPrice?: number; adminRemark?: string }
): Promise<boolean> {
  const dashboardUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/check-status`
    : 'http://localhost:5173/check-status';

  const statusLine = payload.status ? `<p style="margin: 0 0 8px;"><strong>Status:</strong> ${payload.status}</p>` : '';
  const estimatedLine = payload.estimatedPrice !== undefined
    ? `<p style="margin: 0 0 8px;"><strong>Estimated Price:</strong> Php ${payload.estimatedPrice.toLocaleString()}</p>`
    : '';
  const updatedLine = payload.updatedPrice !== undefined
    ? `<p style="margin: 0 0 8px;"><strong>Updated Price:</strong> Php ${payload.updatedPrice.toLocaleString()}</p>`
    : '';
  const remarkLine = payload.adminRemark
    ? `<p style="margin: 0;"><strong>Admin Remark:</strong> ${payload.adminRemark}</p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #15263c;">
      <h2 style="margin: 0 0 12px;">Your Quote Has Been Updated</h2>
      <p>Hello ${quote.customerName},</p>
      <p>Your quote <strong>${quote.quoteNumber}</strong> has new updates from our admin team.</p>

      <div style="background: #f5f7fa; border: 1px solid #e0e4ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
        ${statusLine}
        ${estimatedLine}
        ${updatedLine}
        ${remarkLine}
      </div>

      <p>Please open your status page to review the latest details.</p>
      <a href="${dashboardUrl}" style="display:inline-block; background:#7a0000; color:white; text-decoration:none; padding:10px 18px; border-radius:8px; font-weight:700;">
        Open Check My Status
      </a>
    </div>
  `;

  return sendEmail({
    to: quote.customerEmail,
    subject: `Quote Update (${quote.quoteNumber})`,
    html,
  });
}
