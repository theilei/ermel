// ============================================================
// Admin Quote Details & Edit Page
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, Edit2, Save, X, CheckCircle, XCircle, FileText,
  User, Mail, Phone, MapPin, Package, Ruler, Palette,
  Clock, RefreshCw,
} from 'lucide-react';
import { useQuotes } from '../../context/QuoteContext';
import type { Quote } from '../../types/quotation';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../../types/quotation';

export default function QuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getQuoteById, updateQuote, approveQuote, rejectQuote, convertToOrder, activityLogs } = useQuotes();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Quote>>({});
  const [showPDF, setShowPDF] = useState(searchParams.get('tab') === 'pdf');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const quote = id ? getQuoteById(id) : undefined;

  useEffect(() => {
    if (quote && editing) {
      setEditData({
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        projectType: quote.projectType,
        glassType: quote.glassType,
        frameMaterial: quote.frameMaterial,
        width: quote.width,
        height: quote.height,
        quantity: quote.quantity,
        color: quote.color,
        estimatedCost: quote.estimatedCost,
        notes: quote.notes || '',
      });
    }
  }, [editing, quote]);

  if (!quote) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
        <Package size={48} color="#d9d9d9" />
        <div style={{ fontFamily: 'var(--font-heading)', color: '#aaa', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', marginTop: '16px' }}>
          Quote Not Found
        </div>
        <button
          onClick={() => navigate('/admin/quotations')}
          style={{ marginTop: '16px', fontFamily: 'var(--font-heading)', color: '#7a0000', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          ← Back to Quotations
        </button>
      </div>
    );
  }

  const statusColors = QUOTE_STATUS_COLORS[quote.status];
  const quoteLogs = activityLogs.filter((l) => l.quoteId === quote.id);

  const handleSave = () => {
    if (id) {
      updateQuote(id, editData);
      setEditing(false);
    }
  };

  const handleApprove = () => {
    if (id) approveQuote(id);
  };

  const handleReject = () => {
    if (id && rejectReason.trim()) {
      rejectQuote(id, rejectReason.trim());
      setRejectModal(false);
      setRejectReason('');
    }
  };

  const handleConvert = () => {
    if (id) convertToOrder(id);
  };

  const canApprove = quote.status === 'pending' || quote.status === 'draft';
  const canReject = quote.status === 'pending' || quote.status === 'draft' || quote.status === 'approved';
  const canConvert = quote.status === 'customer_accepted';

  // PDF Preview HTML (same logic as backend)
  const pdfHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #15263c; padding: 40px;">
      <div style="border-bottom: 3px solid #7a0000; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="font-size: 28px; font-weight: bold;">ERMEL</div>
        <div style="font-size: 12px; color: #54667d; letter-spacing: 2px; text-transform: uppercase;">Glass & Aluminum Works</div>
        <div style="font-size: 12px; color: #54667d; margin-top: 8px;">Metro Manila, Philippines | Phone: +63 917 123 4567 | Email: info@ermel.ph</div>
      </div>
      <div style="font-size: 22px; font-weight: bold; color: #7a0000; margin: 20px 0 10px;">QUOTATION</div>
      <div style="font-size: 14px; color: #54667d;">Quote ID: ${quote.id} | Issue Date: ${quote.approvedDate || new Date().toISOString().split('T')[0]}</div>
      <div style="margin: 24px 0;">
        <div style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: #7a0000; letter-spacing: 1px; border-bottom: 1px solid #e0e4ea; padding-bottom: 8px; margin-bottom: 12px;">Customer Information</div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Name:</span><span style="font-weight: bold;">${quote.customerName}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Email:</span><span style="font-weight: bold;">${quote.customerEmail}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Phone:</span><span style="font-weight: bold;">${quote.customerPhone}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Address:</span><span style="font-weight: bold;">${quote.customerAddress}</span></div>
      </div>
      <div style="margin: 24px 0;">
        <div style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: #7a0000; letter-spacing: 1px; border-bottom: 1px solid #e0e4ea; padding-bottom: 8px; margin-bottom: 12px;">Project Details</div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Project Type:</span><span style="font-weight: bold;">${quote.projectType}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Glass Type:</span><span style="font-weight: bold;">${quote.glassType}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Frame Material:</span><span style="font-weight: bold;">${quote.frameMaterial}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Dimensions:</span><span style="font-weight: bold;">${quote.width}cm × ${quote.height}cm × ${quote.quantity} unit(s)</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Color:</span><span style="font-weight: bold;">${quote.color}</span></div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0;"><span style="color: #54667d;">Reservation Date:</span><span style="font-weight: bold;">${quote.reservationDate || 'N/A'}</span></div>
      </div>
      <div style="background: #15263c; color: white; padding: 15px 20px; border-radius: 8px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Total Estimated Cost</span>
        <span style="font-size: 24px; font-weight: bold;">₱${quote.estimatedCost.toLocaleString()}</span>
      </div>
      <div style="background: #f5f7fa; padding: 15px 20px; border-radius: 8px; border: 1px solid #e0e4ea;">
        <strong>Validity:</strong> This quotation is valid for 30 days from the issue date.<br>
        ${quote.expiryDate ? `<strong>Expiry Date:</strong> ${quote.expiryDate}<br>` : ''}
        <strong>Note:</strong> Prices may change after the validity period.
      </div>
    </div>
  `;

  return (
    <div className="p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/quotations')}
        className="flex items-center gap-2 mb-4 transition-colors"
        style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontWeight: 600, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#7a0000'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#54667d'; }}
      >
        <ArrowLeft size={16} /> Back to Quotations
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>
            {quote.id}
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase' }}>
            {quote.projectType}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              border: `1px solid ${statusColors.border}`,
              fontSize: '12px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {QUOTE_STATUS_LABELS[quote.status]}
          </span>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowPDF(false)}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            border: !showPDF ? 'none' : '1px solid #e0e4ea',
            backgroundColor: !showPDF ? '#15263c' : 'white',
            color: !showPDF ? 'white' : '#54667d',
          }}
        >
          Details
        </button>
        <button
          onClick={() => setShowPDF(true)}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            border: showPDF ? 'none' : '1px solid #e0e4ea',
            backgroundColor: showPDF ? '#15263c' : 'white',
            color: showPDF ? 'white' : '#54667d',
          }}
        >
          <FileText size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          PDF Preview
        </button>
      </div>

      {showPDF ? (
        /* PDF Preview */
        <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700 }}>
              Quotation Document Preview
            </div>
            <button
              onClick={() => {
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(`<!DOCTYPE html><html><head><title>Quotation ${quote.id}</title></head><body>${pdfHtml}</body></html>`);
                  w.document.close();
                  w.print();
                }
              }}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Download / Print
            </button>
          </div>
          <div style={{ padding: '24px', backgroundColor: '#f5f7fa' }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div dangerouslySetInnerHTML={{ __html: pdfHtml }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '24px' }}>
              <div className="flex items-center justify-between mb-5">
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Customer Information
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                    style={{ border: '1px solid #e0e4ea', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  {[
                    { label: 'Name', icon: User, key: 'customerName' },
                    { label: 'Email', icon: Mail, key: 'customerEmail' },
                    { label: 'Phone', icon: Phone, key: 'customerPhone' },
                    { label: 'Address', icon: MapPin, key: 'customerAddress' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        <field.icon size={13} /> {field.label}
                      </label>
                      <input
                        type="text"
                        value={(editData as any)[field.key] || ''}
                        onChange={(e) => setEditData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: quote.customerName, icon: User },
                    { label: 'Email', value: quote.customerEmail, icon: Mail },
                    { label: 'Phone', value: quote.customerPhone, icon: Phone },
                    { label: 'Address', value: quote.customerAddress, icon: MapPin },
                  ].map((field) => (
                    <div key={field.label} className="flex items-start gap-3">
                      <field.icon size={16} color="#9ab0c4" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ab0c4', fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</div>
                        <div style={{ fontSize: '14px', color: '#15263c', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{field.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Project Info */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
                Project Information
              </div>

              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Project Type', key: 'projectType' },
                    { label: 'Glass Type', key: 'glassType' },
                    { label: 'Frame Material', key: 'frameMaterial' },
                    { label: 'Color', key: 'color' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={(editData as any)[field.key] || ''}
                        onChange={(e) => setEditData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>Width (cm)</label>
                    <input type="number" value={editData.width || ''} onChange={(e) => setEditData((prev) => ({ ...prev, width: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>Height (cm)</label>
                    <input type="number" value={editData.height || ''} onChange={(e) => setEditData((prev) => ({ ...prev, height: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>Quantity</label>
                    <input type="number" value={editData.quantity || ''} onChange={(e) => setEditData((prev) => ({ ...prev, quantity: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>Notes</label>
                    <input type="text" value={editData.notes || ''} onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Project Type', value: quote.projectType },
                    { label: 'Glass Type', value: quote.glassType },
                    { label: 'Frame Material', value: quote.frameMaterial },
                    { label: 'Dimensions', value: `${quote.width}cm × ${quote.height}cm` },
                    { label: 'Quantity', value: `${quote.quantity} unit(s)` },
                    { label: 'Color', value: quote.color },
                      { label: 'Reservation', value: quote.reservationDate || 'N/A' },
                  ].map((field) => (
                    <div key={field.label} className="p-3 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
                      <div style={{ fontSize: '10px', color: '#9ab0c4', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{field.label}</div>
                      <div style={{ fontSize: '14px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{field.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {quote.notes && !editing && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
                  <div style={{ fontSize: '10px', color: '#9ab0c4', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: '#54667d', fontFamily: 'var(--font-body)' }}>{quote.notes}</div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
                Pricing
              </div>
              {editing ? (
                <div>
                  <label style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700, color: '#54667d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>
                    Estimated Cost (₱)
                  </label>
                  <input
                    type="number"
                    value={editData.estimatedCost || ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '14px 16px', border: '2px solid #15263c', borderRadius: '8px', fontSize: '24px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#15263c', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ) : (
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#15263c', borderRadius: '8px' }}>
                  <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    Estimated Cost
                  </div>
                  <div style={{ color: 'white', fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                    ₱{quote.estimatedCost.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Edit save/cancel buttons */}
              {editing && (
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2"
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #1a5c1a, #2e7d2e)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <Save size={14} /> Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2"
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #e0e4ea',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#54667d',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                Actions
              </div>
              <div className="space-y-3">
                {canApprove && (
                  <button
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center gap-2"
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, #1a5c1a, #2e7d2e)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <CheckCircle size={16} /> Approve Quote
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => setRejectModal(true)}
                    className="w-full flex items-center justify-center gap-2"
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, #7a0000, #a50000)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <XCircle size={16} /> Reject Quote
                  </button>
                )}
                {canConvert && (
                  <button
                    onClick={handleConvert}
                    className="w-full flex items-center justify-center gap-2"
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, #15263c, #1e3655)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <RefreshCw size={16} /> Convert to Order
                  </button>
                )}
                <button
                  onClick={() => setShowPDF(true)}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    padding: '12px',
                    border: '1px solid #e0e4ea',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#54667d',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  <FileText size={16} /> View PDF
                </button>
              </div>
            </div>

            {/* Timeline / Dates */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                Timeline
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Submitted', date: quote.submissionDate, icon: Clock },
                  quote.approvedDate ? { label: 'Approved', date: quote.approvedDate, icon: CheckCircle } : null,
                  quote.expiryDate ? { label: 'Expires', date: quote.expiryDate, icon: Clock } : null,
                  quote.acceptedDate ? { label: 'Customer Accepted', date: quote.acceptedDate, icon: CheckCircle } : null,
                  quote.declinedDate ? { label: 'Customer Declined', date: quote.declinedDate, icon: XCircle } : null,
                  quote.convertedDate ? { label: 'Converted to Order', date: quote.convertedDate, icon: RefreshCw } : null,
                ].filter(Boolean).map((item) => {
                  const Icon = item!.icon;
                  return (
                  <div key={item!.label} className="flex items-center gap-3">
                    <Icon size={14} color="#9ab0c4" />
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ab0c4', fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item!.label}</div>
                      <div style={{ fontSize: '13px', color: '#15263c', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{item!.date}</div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Rejection Reason */}
            {quote.rejectionReason && (
              <div style={{ backgroundColor: '#fff0f0', border: '1px solid #7a000044', borderRadius: '8px', padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Rejection Reason
                </div>
                <div style={{ fontSize: '14px', color: '#7a0000', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                  {quote.rejectionReason}
                </div>
              </div>
            )}

            {/* Activity Log */}
            {quoteLogs.length > 0 && (
              <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '24px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                  Activity Log
                </div>
                <div className="space-y-3">
                  {quoteLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 pb-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: log.userRole === 'admin' ? '#15263c' : '#7a0000' }} />
                      <div>
                        <div style={{ fontSize: '13px', color: '#15263c', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{log.event}</div>
                        {log.details && <div style={{ fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)' }}>{log.details}</div>}
                        <div style={{ fontSize: '11px', color: '#9ab0c4', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                          {new Date(log.timestamp).toLocaleString()} · {log.userName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setRejectModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              Reject Quote
            </div>
            <div style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', marginBottom: '20px' }}>
              Please provide a reason for rejecting quote <strong>{quote.id}</strong>.
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              style={{ width: '100%', padding: '12px', border: '1px solid #e0e4ea', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', color: '#15263c', boxSizing: 'border-box' }}
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal(false)}
                style={{ padding: '10px 20px', border: '1px solid #e0e4ea', borderRadius: '8px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: '#54667d', backgroundColor: 'white', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: 'white', background: rejectReason.trim() ? 'linear-gradient(135deg, #7a0000, #a50000)' : '#ccc', cursor: rejectReason.trim() ? 'pointer' : 'default', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
