import PDFDocument from 'pdfkit';
import type { Quote } from '../models/QuoteDB';

export function generateCashReceiptPdf(quote: Quote): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('ERMEL Glass & Aluminum Works', { align: 'left' });
    doc.fontSize(12).fillColor('#666666').text('Cash Payment Receipt', { align: 'left' });
    doc.moveDown(1.5);

    doc.fillColor('#000000').fontSize(11);
    doc.text(`Quote Number: ${quote.quoteNumber}`);
    doc.text(`Customer Name: ${quote.customerName}`);
    doc.text(`Customer Email: ${quote.customerEmail}`);
    doc.text(`Project Type: ${quote.projectType}`);
    doc.text(`Reservation Date: ${quote.reservationDate || 'N/A'}`);
    doc.text(`Issued Date: ${new Date().toISOString().split('T')[0]}`);
    doc.moveDown(1);

    const amount = Number(quote.updatedCost ?? quote.estimatedCost ?? 0);
    doc.fontSize(14).text(`Amount Due: PHP ${amount.toLocaleString()}`, { underline: true });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#444444');
    doc.text('Instructions:');
    doc.text('1. Print this receipt and present it to ERMEL office for cash payment.');
    doc.text('2. Keep a copy for your records.');
    doc.text('3. Reservation date is locked only after payment verification.');

    doc.moveDown(2);
    doc.text('Authorized Signature: ________________________________');

    doc.end();
  });
}
