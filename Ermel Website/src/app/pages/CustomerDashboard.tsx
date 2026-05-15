import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle, Clock, Package, Hammer, Truck, Upload, QrCode,
  ChevronRight, Eye, FileImage, X, AlertCircle, FileText,
  ThumbsUp, ThumbsDown, Ban
} from 'lucide-react';
import { useApp, type Order, type OrderStatus } from '../context/AppContext';
import { useQuotes } from '../context/QuoteContext';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../types/quotation';
import type { Quote } from '../types/quotation';
import { uploadCustomerPaymentProof } from '../services/api';

const STAGE_CONFIG: { status: OrderStatus; label: string; icon: any; desc: string }[] = [
  { status: 'inquiry', label: 'Inquiry Received', icon: Clock, desc: 'Your quote request has been submitted and is awaiting admin review.' },
  { status: 'quotation', label: 'Quote Approved', icon: CheckCircle, desc: 'Admin has reviewed and approved your project quote.' },
  { status: 'ordering', label: 'Materials Ordered', icon: Package, desc: 'Materials have been procured and are being prepared.' },
  { status: 'fabrication', label: 'Fabrication', icon: Hammer, desc: 'Your project is being fabricated in our workshop.' },
  { status: 'installation', label: 'Installation', icon: Truck, desc: 'Scheduled for on-site installation.' },
];

const STATUS_ORDER: OrderStatus[] = ['inquiry', 'quotation', 'ordering', 'fabrication', 'installation'];

function MockQRCode() {
  // SVG-based mock QR code
  const cells: { x: number; y: number }[] = [];
  const size = 21;
  // Simulate a QR code pattern
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,1,1,1,0,0,1,1,0,1,1,1,0,1,0,1,1,0],
    [0,1,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1],
    [1,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [0,0,1,1,0,1,0,1,1,0,0,1,0,1,0,1,0,1,1,0,0],
    [1,0,0,0,1,0,1,0,0,1,1,0,1,0,0,1,1,0,0,1,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1,1,0,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,1,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,1,1,0,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,0,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1],
  ];

  return (
    <div className="flex flex-col items-center">
      <svg width="168" height="168" viewBox="0 0 168 168" style={{ imageRendering: 'pixelated' }}>
        <rect width="168" height="168" fill="white" />
        {pattern.map((row, y) =>
          row.map((cell, x) =>
            cell === 1 ? (
              <rect
                key={`${x}-${y}`}
                x={x * 8}
                y={y * 8}
                width="8"
                height="8"
                fill="#15263c"
              />
            ) : null
          )
        )}
      </svg>
      <div className="mt-2 text-center" style={{ fontSize: '10px', color: '#54667d', fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>
        SCAN WITH GCASH / MAYA / INSTAPAY
      </div>
    </div>
  );
}

function ProgressBar({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="relative">
      {/* Horizontal line */}
      <div className="hidden sm:block absolute top-5 left-0 right-0 h-0.5" style={{ backgroundColor: '#d9d9d9', zIndex: 0 }} />
      <div
        className="hidden sm:block absolute top-5 left-0 h-0.5 transition-all duration-700"
        style={{
          backgroundColor: '#15263c',
          zIndex: 0,
          width: currentIdx === 0 ? '0%' : `${(currentIdx / (STAGE_CONFIG.length - 1)) * 100}%`,
        }}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 relative z-10">
        {STAGE_CONFIG.map((stage, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const pending = idx > currentIdx;

          return (
            <div key={stage.status} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 sm:flex-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: done ? '#15263c' : active ? '#7a0000' : 'white',
                  border: `2px solid ${done ? '#15263c' : active ? '#7a0000' : '#d9d9d9'}`,
                  boxShadow: active ? '0 0 0 4px rgba(122,0,0,0.15)' : 'none',
                }}
              >
                {done ? (
                  <CheckCircle size={18} color="white" strokeWidth={2.5} />
                ) : (
                  <stage.icon size={16} color={active ? 'white' : '#aaa'} />
                )}
              </div>
              <div className="sm:mt-3 sm:text-center">
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px',
                    fontWeight: active ? 700 : done ? 600 : 500,
                    color: active ? '#7a0000' : done ? '#15263c' : '#aaa',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    lineHeight: 1.2,
                  }}
                >
                  {stage.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quote Detail View for Customer Portal ──
function QuoteDetailView({
  quote,
  onAccept,
  onDecline,
  showPdf,
  onTogglePdf,
}: {
  quote: Quote;
  onAccept: () => void;
  onDecline: () => void;
  showPdf: boolean;
  onTogglePdf: () => void;
}) {
  const statusColors = QUOTE_STATUS_COLORS[quote.status];
  const canAct = quote.status === 'approved';
  const isExpired = quote.status === 'expired';

  return (
    <>
      {/* Quote info card */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '4px' }}>
              {quote.id}
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 800, textTransform: 'uppercase' }}>
              {quote.projectType}
            </h2>
            <div style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
              {quote.glassType || 'Glass'} · {quote.frameMaterial || 'Aluminum'} · {quote.width}mm x {quote.height}mm
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              border: `1px solid ${statusColors.border}`,
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {QUOTE_STATUS_LABELS[quote.status]}
          </span>
        </div>

        {/* Quote details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Quantity', value: `${quote.quantity} unit(s)` },
            { label: 'Color', value: quote.color },
            { label: 'Submitted', value: quote.submissionDate },
            ...(quote.approvedDate ? [{ label: 'Approved', value: quote.approvedDate }] : []),
            ...(quote.expiryDate ? [{ label: 'Expires', value: quote.expiryDate }] : []),
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
              <div style={{ color: '#54667d', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '4px', textTransform: 'uppercase' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Rejection reason */}
        {quote.status === 'customer_declined' && quote.rejectionReason && (
          <div className="p-4 rounded-lg mb-5 flex items-start gap-3" style={{ backgroundColor: '#fff0f0', border: '1px solid #7a000033' }}>
            <Ban size={18} color="#7a0000" className="flex-shrink-0 mt-0.5" />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Quote Declined
              </div>
              <div style={{ color: '#7a0000', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                {quote.rejectionReason}
              </div>
            </div>
          </div>
        )}

        {/* Admin rejection reason */}
        {quote.rejectionReason && quote.status !== 'customer_declined' && (
          <div className="p-4 rounded-lg mb-5 flex items-start gap-3" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c04044' }}>
            <AlertCircle size={18} color="#7a5200" className="flex-shrink-0 mt-0.5" />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#7a5200', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Admin Note
              </div>
              <div style={{ color: '#7a5200', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                {quote.rejectionReason}
              </div>
            </div>
          </div>
        )}

        {/* Expired notice */}
        {isExpired && (
          <div className="p-4 rounded-lg mb-5 flex items-start gap-3" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
            <Clock size={18} color="#54667d" className="flex-shrink-0 mt-0.5" />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Quote Expired
              </div>
              <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                This quotation has expired. Please submit a new quote request.
              </div>
            </div>
          </div>
        )}

        {quote.notes && (
          <div className="p-3 rounded-lg mb-5" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
            <div style={{ color: '#54667d', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '4px', textTransform: 'uppercase' }}>
              Notes
            </div>
            <div style={{ color: '#15263c', fontSize: '13px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              {quote.notes}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Card */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
          QUOTATION PRICING
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#15263c' }}>
            <div style={{ color: '#9ab0c4', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
              QUOTED PRICE
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '26px', fontWeight: 800 }}>
              ₱{quote.estimatedCost.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
            <div style={{ color: '#54667d', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
              STATUS
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', color: statusColors.text, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
              {QUOTE_STATUS_LABELS[quote.status]}
            </div>
          </div>
        </div>

        {/* View PDF button */}
        {quote.status !== 'pending' && (
          <button
            onClick={onTogglePdf}
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2 mb-4"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e0e4ea',
              fontFamily: 'var(--font-heading)',
              color: '#15263c',
              fontWeight: 700,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            <FileText size={16} /> {showPdf ? 'Hide' : 'View'} Quotation PDF
          </button>
        )}

        {/* PDF Preview */}
        {showPdf && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '4px', padding: '32px', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#333' }}>
              <div className="text-center mb-6">
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: '#15263c', textTransform: 'uppercase' }}>
                  ERMEL GLASS & ALUMINUM WORKS
                </div>
                <div style={{ fontSize: '11px', color: '#54667d', marginTop: '4px' }}>Official Quotation Document</div>
                <div style={{ width: '60px', height: '3px', backgroundColor: '#7a0000', margin: '8px auto' }} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4" style={{ fontSize: '12px' }}>
                <div><strong>Quote ID:</strong> {quote.id}</div>
                <div><strong>Date:</strong> {quote.submissionDate}</div>
                <div><strong>Customer:</strong> {quote.customerName}</div>
                <div><strong>Email:</strong> {quote.customerEmail}</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #15263c' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Description</th>
                    <th style={{ textAlign: 'center', padding: '6px 4px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px' }}>
                      {quote.projectType} — {quote.glassType || 'Glass'} / {quote.frameMaterial || 'Aluminum'}<br />
                      <span style={{ color: '#54667d', fontSize: '11px' }}>{quote.width}mm x {quote.height}mm · {quote.color}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 4px' }}>{quote.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 700 }}>₱{quote.estimatedCost.toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #15263c' }}>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>TOTAL:</td>
                    <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 800, fontSize: '14px', color: '#7a0000' }}>₱{quote.estimatedCost.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ fontSize: '10px', color: '#9ab0c4', textAlign: 'center' }}>
                This quotation is valid for 30 days from the date of approval.
              </div>
            </div>
          </div>
        )}

        {/* Accept / Decline buttons */}
        {canAct && (
          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1a5c1a, #2e7d2e)',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(26,92,26,0.3)',
              }}
            >
              <ThumbsUp size={16} /> Accept Quote
            </button>
            <button
              onClick={onDecline}
              className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(122,0,0,0.3)',
              }}
            >
              <ThumbsDown size={16} /> Decline Quote
            </button>
          </div>
        )}

        {/* Already accepted / declined notices */}
        {quote.status === 'customer_accepted' && (
          <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44' }}>
            <CheckCircle size={20} color="#1a5c1a" />
            <div style={{ color: '#1a5c1a', fontSize: '14px', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase' }}>
              Quote Accepted — Awaiting conversion to order
            </div>
          </div>
        )}

        {quote.status === 'converted_to_order' && (
          <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44' }}>
            <Package size={20} color="#1a5c1a" />
            <div style={{ color: '#1a5c1a', fontSize: '14px', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase' }}>
              Converted to Order — Check your orders tab
            </div>
          </div>
        )}

        {/* Pending review notice */}
        {quote.status === 'pending' && (
          <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c04044' }}>
            <AlertCircle size={20} color="#7a5200" />
            <div style={{ color: '#7a5200', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              Your quote is being reviewed. You will be notified once admin approves or updates the pricing.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function CustomerDashboard() {
  const { orders, markPaymentUploaded } = useApp();
  const { getQuotesByEmail, customerAcceptQuote, customerDeclineQuote } = useQuotes();
  const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id || null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes'>('orders');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Demo customer email - in production this would come from auth
  const customerEmail = 'maria.santos@email.com';
  const customerQuotes = getQuotesByEmail(customerEmail);

  const selectedOrder = orders.find((o) => o.id === selectedId);
  const selectedQuote = customerQuotes.find((q) => q.id === selectedQuoteId);
  const currentStageIdx = selectedOrder ? STATUS_ORDER.indexOf(selectedOrder.status) : 0;

  const canPay = selectedOrder && !!selectedOrder.approvedCost && !selectedOrder.paid;
  const isPaid = selectedOrder?.paid || selectedOrder?.paymentUploaded;

  useEffect(() => {
    if (!selectedQuoteId && customerQuotes.length > 0) {
      setSelectedQuoteId(customerQuotes[0].id);
    }
  }, [customerQuotes, selectedQuoteId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetQuoteId = selectedQuote?.id || selectedQuoteId;
    setUploading(true);
    setUploadError('');
    if (!targetQuoteId) {
      setUploading(false);
      setUploadError('Select a quote before uploading payment proof.');
      return;
    }

    try {
      await uploadCustomerPaymentProof(targetQuoteId, file);
      setUploadedFile(URL.createObjectURL(file));
      if (selectedId) markPaymentUploaded(selectedId);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingTop: '76px', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            CUSTOMER PORTAL
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1 }}>
            MY PROJECTS
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects list */}
          <div className="lg:col-span-1">
            {/* Tabs for Orders / Quotes */}
            <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ backgroundColor: '#f0f2f5' }}>
              <button
                onClick={() => setActiveTab('orders')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'orders' ? 'white' : 'transparent',
                  color: activeTab === 'orders' ? '#15263c' : '#54667d',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'orders' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'quotes' ? 'white' : 'transparent',
                  color: activeTab === 'quotes' ? '#15263c' : '#54667d',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'quotes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Quotes ({customerQuotes.length})
              </button>
            </div>

            {activeTab === 'orders' && (
              <>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              YOUR ORDERS ({orders.length})
            </div>
            <div className="space-y-3">
              {orders.map((order) => {
                const stageIdx = STATUS_ORDER.indexOf(order.status);
                const isSelected = order.id === selectedId;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? '#15263c' : 'white',
                      border: `2px solid ${isSelected ? '#15263c' : '#e0e4ea'}`,
                      borderRadius: '8px',
                      boxShadow: isSelected ? '0 4px 20px rgba(21,38,60,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span style={{ fontFamily: 'var(--font-heading)', color: isSelected ? '#ff8888' : '#7a0000', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
                        {order.id}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : '#f0f2f5',
                          color: isSelected ? '#d9d9d9' : '#54667d',
                          fontSize: '10px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', color: isSelected ? 'white' : '#15263c', fontSize: '15px', fontWeight: 700, marginBottom: '3px' }}>
                      {order.project}
                    </div>
                    <div style={{ color: isSelected ? '#9ab0c4' : '#54667d', fontSize: '12px', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
                      {order.glassType} · {order.dimensions}
                    </div>
                    {/* Mini progress */}
                    <div className="flex gap-1">
                      {STATUS_ORDER.map((s, i) => (
                        <div
                          key={s}
                          className="flex-1 h-1 rounded-full"
                          style={{
                            backgroundColor:
                              i <= stageIdx
                                ? isSelected ? '#ff8888' : '#15263c'
                                : isSelected ? 'rgba(255,255,255,0.15)' : '#d9d9d9',
                          }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Link
                to="/quote"
                style={{
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(135deg, #7a0000, #a50000)',
                  color: 'white',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  fontSize: '14px',
                  padding: '11px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 12px rgba(122,0,0,0.3)',
                }}
              >
                + Request New Quote <ChevronRight size={14} />
              </Link>
            </div>
              </>
            )}

            {activeTab === 'quotes' && (
              <>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  YOUR QUOTATIONS ({customerQuotes.length})
                </div>
                <div className="space-y-3">
                  {customerQuotes.length === 0 ? (
                    <div className="p-6 text-center rounded-lg" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea' }}>
                      <FileText size={32} color="#d9d9d9" style={{ margin: '0 auto 8px' }} />
                      <div style={{ color: '#aaa', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                        No quotations yet
                      </div>
                    </div>
                  ) : (
                    customerQuotes.map((quote) => {
                      const isSelected = quote.id === selectedQuoteId;
                      const statusColors = QUOTE_STATUS_COLORS[quote.status];
                      return (
                        <button
                          key={quote.id}
                          onClick={() => { setSelectedQuoteId(quote.id); setSelectedId(null); }}
                          className="w-full text-left p-4 rounded-xl transition-all duration-200"
                          style={{
                            backgroundColor: isSelected ? '#15263c' : 'white',
                            border: `2px solid ${isSelected ? '#15263c' : '#e0e4ea'}`,
                            borderRadius: '8px',
                            boxShadow: isSelected ? '0 4px 20px rgba(21,38,60,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span style={{ fontFamily: 'var(--font-heading)', color: isSelected ? '#ff8888' : '#7a0000', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
                              {quote.id}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : statusColors.bg,
                                color: isSelected ? '#d9d9d9' : statusColors.text,
                                border: isSelected ? 'none' : `1px solid ${statusColors.border}`,
                                fontSize: '10px',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {QUOTE_STATUS_LABELS[quote.status]}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', color: isSelected ? 'white' : '#15263c', fontSize: '15px', fontWeight: 700, marginBottom: '3px' }}>
                            {quote.projectType}
                          </div>
                          <div style={{ color: isSelected ? '#9ab0c4' : '#54667d', fontSize: '12px', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
                            {quote.glassType || 'Glass'} · {quote.width}mm x {quote.height}mm
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', color: isSelected ? 'white' : '#15263c', fontSize: '14px', fontWeight: 700 }}>
                            ₱{quote.estimatedCost.toLocaleString()}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    to="/quote"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      background: 'linear-gradient(135deg, #7a0000, #a50000)',
                      color: 'white',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      fontSize: '14px',
                      padding: '11px 20px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 12px rgba(122,0,0,0.3)',
                    }}
                  >
                    + Request New Quote <ChevronRight size={14} />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Project Detail */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quote Detail View */}
            {activeTab === 'quotes' && selectedQuote ? (
              <QuoteDetailView
                quote={selectedQuote}
                onAccept={() => customerAcceptQuote(selectedQuote.id)}
                onDecline={() => customerDeclineQuote(selectedQuote.id)}
                showPdf={showPdfPreview}
                onTogglePdf={() => setShowPdfPreview(!showPdfPreview)}
              />
            ) : activeTab === 'quotes' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText size={48} color="#d9d9d9" />
                <div style={{ fontFamily: 'var(--font-heading)', color: '#aaa', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', marginTop: '16px' }}>
                  NO QUOTE SELECTED
                </div>
                <p style={{ color: '#aaa', fontSize: '14px', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
                  Select a quotation from the list to view details
                </p>
              </div>
            ) : selectedOrder ? (
              <>
                {/* Order info */}
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        {selectedOrder.id}
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {selectedOrder.project}
                      </h2>
                      <div style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                        {selectedOrder.glassType} · {selectedOrder.material} · {selectedOrder.dimensions}
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg"
                      style={{
                        backgroundColor:
                          selectedOrder.status === 'installation' ? '#e8f5e9' :
                          selectedOrder.status === 'fabrication' ? '#e8ecf0' :
                          '#fff0f0',
                        border: `1px solid ${
                          selectedOrder.status === 'installation' ? '#1a5c1a44' :
                          selectedOrder.status === 'fabrication' ? '#15263c44' :
                          '#7a000044'
                        }`,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color:
                          selectedOrder.status === 'installation' ? '#1a5c1a' :
                          selectedOrder.status === 'fabrication' ? '#15263c' :
                          '#7a0000',
                      }}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar currentStatus={selectedOrder.status} />

                  {/* Stage description */}
                  <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
                    <div style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                      {STAGE_CONFIG.find((s) => s.status === selectedOrder.status)?.desc}
                    </div>
                    {selectedOrder.scheduledDate && (
                      <div className="mt-2 flex items-center gap-2" style={{ color: '#15263c', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                        📅 Scheduled: {selectedOrder.scheduledDate}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost & Payment */}
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}
                >
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                    PAYMENT
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
                      <div style={{ color: '#54667d', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>ESTIMATED</div>
                      <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '22px', fontWeight: 700 }}>
                        ₱{selectedOrder.estimatedCost.toLocaleString()}
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: selectedOrder.approvedCost ? '#15263c' : '#f5f7fa',
                        border: `1px solid ${selectedOrder.approvedCost ? '#15263c' : '#e0e4ea'}`,
                      }}
                    >
                      <div style={{ color: selectedOrder.approvedCost ? '#9ab0c4' : '#aaa', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
                        APPROVED PRICE
                      </div>
                      {selectedOrder.approvedCost ? (
                        <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '26px', fontWeight: 800 }}>
                          ₱{selectedOrder.approvedCost.toLocaleString()}
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-heading)', color: '#aaa', fontSize: '14px', fontWeight: 500 }}>
                          Pending review
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QRPH Section */}
                  {canPay && !isPaid && (
                    <div
                      className="rounded-xl p-5"
                      style={{ backgroundColor: '#f0f4f8', border: '2px solid #15263c22' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                            QRPH PAYMENT
                          </div>
                          <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                            Scan the QR code below using your preferred mobile banking app
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: '#e8f0fe', border: '1px solid #4285f4' }}
                        >
                          <span style={{ color: '#1a73e8', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.08em' }}>
                            INSTAPAY ENABLED
                          </span>
                        </div>
                      </div>

                      {!showQR ? (
                        <button
                          onClick={() => setShowQR(true)}
                          style={{
                            fontFamily: 'var(--font-heading)',
                            background: 'linear-gradient(135deg, #15263c, #1e3655)',
                            color: 'white',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            fontSize: '15px',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textTransform: 'uppercase',
                          }}
                        >
                          <QrCode size={18} /> Show QR Code
                        </button>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                          <div
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: 'white', border: '2px solid #15263c', borderRadius: '8px', display: 'inline-block' }}
                          >
                            <MockQRCode />
                            <div className="mt-3 text-center">
                              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em' }}>
                                ERMEL GLASS & ALUMINUM
                              </div>
                              <div style={{ color: '#7a0000', fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: 800, marginTop: '2px' }}>
                                ₱{selectedOrder.approvedCost?.toLocaleString()}
                              </div>
                              <div style={{ color: '#54667d', fontSize: '11px', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                                Ref: {selectedOrder.id}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              PAYMENT INSTRUCTIONS
                            </div>
                            {[
                              '1. Open your GCash, Maya, or any InstaPay-enabled app',
                              '2. Go to "Send Money" or "Pay QR"',
                              '3. Scan the QR code on the left',
                              '4. Enter the exact amount shown',
                              `5. Use reference: ${selectedOrder.id}`,
                              '6. Take a screenshot of the success screen',
                              '7. Upload your proof of payment below',
                            ].map((s) => (
                              <div key={s} style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                                {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload proof */}
                  {(canPay || isPaid) && showQR && (
                    <div className="mt-4">
                      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                        UPLOAD TRANSACTION SCREENSHOT
                      </div>

                      {uploadError && (
                        <div className="mb-3" style={{ color: '#7a0000', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                          {uploadError}
                        </div>
                      )}

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      {uploadedFile || selectedOrder.paymentUploaded ? (
                        <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: '#e8f5e9', border: '2px solid #1a5c1a44' }}>
                          <CheckCircle size={24} color="#1a5c1a" />
                          <div>
                            <div style={{ fontFamily: 'var(--font-heading)', color: '#1a5c1a', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>
                              PROOF UPLOADED
                            </div>
                            <div style={{ color: '#2e7d32', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                              Your payment proof has been submitted. Admin will verify within 24 hours.
                            </div>
                          </div>
                          {uploadedFile && (
                            <img src={uploadedFile} alt="proof" className="w-14 h-14 rounded-lg object-cover ml-auto" style={{ border: '1px solid #1a5c1a44' }} />
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="w-full py-4 rounded-xl border-dashed border-2 flex flex-col items-center gap-2 cursor-pointer transition-all"
                          style={{
                            borderColor: '#54667d',
                            backgroundColor: 'transparent',
                            opacity: uploading ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => { if (!uploading) (e.currentTarget.style.backgroundColor = '#f0f4f8'); }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {uploading ? (
                            <>
                              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#15263c', borderTopColor: 'transparent' }} />
                              <span style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={24} color="#54667d" />
                              <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Upload Transaction Screenshot
                              </span>
                              <span style={{ color: '#aaa', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                                JPG, PNG, or PDF · Max 5MB
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {!canPay && !selectedOrder.approvedCost && (
                    <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c04044' }}>
                      <AlertCircle size={20} color="#7a5200" />
                      <div style={{ color: '#7a5200', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                        Your quote is being reviewed. Payment will be enabled once admin approves the final price.
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={48} color="#d9d9d9" />
                <div style={{ fontFamily: 'var(--font-heading)', color: '#aaa', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', marginTop: '16px' }}>
                  NO PROJECT SELECTED
                </div>
                <p style={{ color: '#aaa', fontSize: '14px', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
                  Select a project from the list to view details
                </p>
                <Link
                  to="/quote"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: 'linear-gradient(135deg, #7a0000, #a50000)',
                    color: 'white',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontSize: '15px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    marginTop: '20px',
                  }}
                >
                  Request a Quote
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
