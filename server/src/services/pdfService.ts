// ============================================================
// PDF Service — Generates quote PDF content
// ============================================================
// Uses a simple HTML-to-text approach for now.
// In production, integrate pdfkit or puppeteer for real PDF generation.

import { Quote } from '../models/QuoteDB';

export interface QuotePDFData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  quote: Quote;
  validityDays: number;
  issueDate: string;
}

/**
 * Generates a simple HTML representation of the quote PDF.
 * In production, this would generate an actual PDF buffer using pdfkit.
 */
export function generateQuotePDFHtml(data: QuotePDFData): string {
  const { quote, validityDays, issueDate } = data;
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(expiryDate.getDate() + validityDays);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${quote.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #15263c; }
    .header { border-bottom: 3px solid #7a0000; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 28px; font-weight: bold; color: #15263c; }
    .company-subtitle { font-size: 12px; color: #54667d; letter-spacing: 2px; text-transform: uppercase; }
    .quote-title { font-size: 22px; font-weight: bold; color: #7a0000; margin: 20px 0 10px; }
    .quote-id { font-size: 14px; color: #54667d; }
    .section { margin: 20px 0; }
    .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #7a0000; letter-spacing: 1px; border-bottom: 1px solid #e0e4ea; padding-bottom: 8px; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .label { color: #54667d; font-size: 13px; }
    .value { font-weight: bold; font-size: 13px; }
    .total-row { background: #15263c; color: white; padding: 15px 20px; border-radius: 8px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .total-value { font-size: 24px; font-weight: bold; }
    .validity { background: #f5f7fa; padding: 15px 20px; border-radius: 8px; border: 1px solid #e0e4ea; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e4ea; font-size: 11px; color: #54667d; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${data.companyName}</div>
    <div class="company-subtitle">Glass & Aluminum Works</div>
    <div style="font-size: 12px; color: #54667d; margin-top: 8px;">
      ${data.companyAddress}<br>
      Phone: ${data.companyPhone} | Email: ${data.companyEmail}
    </div>
  </div>

  <div class="quote-title">QUOTATION</div>
  <div class="quote-id">Quote ID: ${quote.quoteNumber} | Issue Date: ${issueDate}</div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="row"><span class="label">Name:</span><span class="value">${quote.customerName}</span></div>
    <div class="row"><span class="label">Email:</span><span class="value">${quote.customerEmail}</span></div>
    <div class="row"><span class="label">Phone:</span><span class="value">${quote.customerPhone}</span></div>
    <div class="row"><span class="label">Address:</span><span class="value">${quote.customerAddress}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Project Details</div>
    <div class="row"><span class="label">Project Type:</span><span class="value">${quote.projectType}</span></div>
    <div class="row"><span class="label">Glass Type:</span><span class="value">${quote.glassType}</span></div>
    <div class="row"><span class="label">Frame Material:</span><span class="value">${quote.frameMaterial}</span></div>
    <div class="row"><span class="label">Dimensions:</span><span class="value">${quote.width}cm × ${quote.height}cm × ${quote.quantity} unit(s)</span></div>
    <div class="row"><span class="label">Color:</span><span class="value">${quote.color}</span></div>
  </div>

  <div class="total-row">
    <span class="total-label">Total Estimated Cost</span>
    <span class="total-value">₱${quote.estimatedCost.toLocaleString()}</span>
  </div>

  <div class="validity">
    <strong>Validity:</strong> This quotation is valid for ${validityDays} days from the issue date (${issueDate}).<br>
    <strong>Expiry Date:</strong> ${expiryDate.toISOString().split('T')[0]}<br>
    <strong>Note:</strong> Prices may change after the validity period. Please confirm your acceptance within the validity period.
  </div>

  <div class="footer">
    This is a computer-generated quotation. For questions, contact us at ${data.companyEmail} or ${data.companyPhone}.
  </div>
</body>
</html>`;
}

/**
 * Returns PDF-ready data object for the quote.
 * In production, this would return a Buffer from pdfkit/puppeteer.
 */
export function getQuotePDFData(quote: Quote): QuotePDFData {
  return {
    companyName: 'ERMEL',
    companyAddress: 'Metro Manila, Philippines',
    companyPhone: '+63 917 123 4567',
    companyEmail: 'info@ermel.ph',
    quote,
    validityDays: 30,
    issueDate: quote.approvedDate || new Date().toISOString().split('T')[0],
  };
}
