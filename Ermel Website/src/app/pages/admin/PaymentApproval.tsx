import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, CreditCard, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { useQuotes } from '../../context/QuoteContext';
import { adminApprovePayment, adminRejectPayment, fetchAdminPayments } from '../../services/api';
import { supabase } from '../../services/supabaseClient';

type AdminPayment = {
  id: string;
  quoteId: string;
  quoteNumber?: string;
  quoteStatus?: string;
  customerName?: string;
  projectType?: string;
  amountDue?: number;
  proofFile?: string;
  status: 'waiting_approval' | 'paid' | 'expired' | string;
  createdAt: string;
  adminRejectionReason?: string;
};

const API_ORIGIN = (((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

function toProofUrl(proofFile?: string): string | null {
  if (!proofFile) return null;
  if (/^https?:\/\//i.test(proofFile)) return proofFile;
  return `${API_ORIGIN}${proofFile.startsWith('/') ? '' : '/'}${proofFile}`;
}

export default function PaymentApproval() {
  const { quotes, refreshQuotes } = useQuotes();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [activeActionQuote, setActiveActionQuote] = useState<string | null>(null);
  const [rejectingQuoteId, setRejectingQuoteId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      setError('');
      const rows = await fetchAdminPayments();
      setPayments(rows as AdminPayment[]);
    } catch (err: any) {
      setError(err?.message || 'Unable to load payment records.');
    }
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPayments(), refreshQuotes()]);
    setLoading(false);
  }, [loadPayments, refreshQuotes]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const paymentChannel = client
      .channel('admin-payment-approval-payments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, () => {
        loadPayments();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, () => {
        loadPayments();
      })
      .subscribe();

    const quoteChannel = client
      .channel('admin-payment-approval-quotes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, () => {
        refreshQuotes();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, () => {
        refreshQuotes();
      })
      .subscribe();

    return () => {
      client.removeChannel(paymentChannel);
      client.removeChannel(quoteChannel);
    };
  }, [loadPayments, refreshQuotes]);

  const toDisplayStatus = useCallback((payment: AdminPayment) => {
    const quoteStatus = String(payment.quoteStatus || '').toLowerCase();
    if (quoteStatus === 'cancelled' || quoteStatus === 'expired') return 'expired';
    return payment.status;
  }, []);

  const waitingApprovalCount = useMemo(
    () => payments.filter((p) => toDisplayStatus(p) === 'waiting_approval').length,
    [payments, toDisplayStatus]
  );

  const verifiedPaymentsCount = useMemo(
    () => payments.filter((p) => toDisplayStatus(p) === 'paid').length,
    [payments, toDisplayStatus]
  );

  const noPaymentProofCount = useMemo(
    () => quotes.filter((q) => q.status === 'approved' && !q.payment).length,
    [quotes]
  );

  const cancelledExpiredCount = useMemo(
    () => quotes.filter((q) => q.status === 'cancelled' || q.status === 'expired').length,
    [quotes]
  );

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...payments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (!q) return sorted;

    return sorted.filter((p) =>
      String(p.quoteNumber || '').toLowerCase().includes(q)
      || String(p.customerName || '').toLowerCase().includes(q)
      || String(p.projectType || '').toLowerCase().includes(q)
    );
  }, [payments, search]);

  const submitApprove = async (quoteId: string) => {
    setActiveActionQuote(quoteId);
    try {
      await adminApprovePayment(quoteId);
      await Promise.all([loadPayments(), refreshQuotes()]);
    } finally {
      setActiveActionQuote(null);
    }
  };

  const submitReject = async () => {
    if (!rejectingQuoteId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError('Rejection reason is required.');
      return;
    }

    setActiveActionQuote(rejectingQuoteId);
    try {
      await adminRejectPayment(rejectingQuoteId, reason);
      setRejectingQuoteId(null);
      setRejectReason('');
      await Promise.all([loadPayments(), refreshQuotes()]);
    } finally {
      setActiveActionQuote(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
          OPERATIONS
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Payment Approval
        </h1>
        <p style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
          Review QRPH payment submissions and monitor verification progress in real time.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '12px', backgroundColor: '#fff0f0', border: '1px solid #7a000044', borderRadius: '8px', color: '#7a0000', padding: '10px 12px', fontSize: '12px' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: '8px', backgroundColor: '#fff8e6' }}>
              <Clock3 size={18} color="#7a5200" />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{waitingApprovalCount}</div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Waiting Approval
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: '8px', backgroundColor: '#e8f5e9' }}>
              <CheckCircle2 size={18} color="#1a5c1a" />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{verifiedPaymentsCount}</div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Verified Payments
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: '8px', backgroundColor: '#e6f4f8' }}>
              <CreditCard size={18} color="#005c7a" />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{noPaymentProofCount}</div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            No Payment Proof
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: '8px', backgroundColor: '#fff0f0' }}>
              <AlertTriangle size={18} color="#7a0000" />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{cancelledExpiredCount}</div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Cancelled / Expired
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', overflow: 'hidden' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #e0e4ea' }}>
          <div className="relative max-w-md">
            <Search size={16} color="#9ab0c4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by quote ID, customer, or project..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '1px solid #e0e4ea',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                color: '#15263c',
                backgroundColor: 'white',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e4ea' }}>
                {['Quote ID', 'Customer', 'Project', 'Amount', 'Proof', 'Status', 'Created', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#54667d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                    No QRPH payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const proofUrl = toProofUrl(payment.proofFile);
                  const displayStatus = toDisplayStatus(payment);
                  const isBusy = activeActionQuote === payment.quoteId;
                  const canTakeAction = displayStatus === 'waiting_approval' && Boolean(proofUrl);
                  return (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <td style={{ padding: '12px 16px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{payment.quoteNumber || payment.quoteId}</td>
                      <td style={{ padding: '12px 16px', color: '#15263c', fontSize: '13px' }}>{payment.customerName || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#54667d', fontSize: '13px' }}>{payment.projectType || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>
                        ₱{Number(payment.amountDue || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#1a5c1a',
                              backgroundColor: '#e8f5e9',
                              border: '1px solid #1a5c1a44',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              textDecoration: 'none',
                            }}
                          >
                            View Proof
                          </a>
                        ) : (
                          <span
                            style={{
                              color: '#7a0000',
                              backgroundColor: '#fff0f0',
                              border: '1px solid #7a000044',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Missing
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            color: displayStatus === 'paid' ? '#1a5c1a' : displayStatus === 'expired' ? '#7a0000' : '#7a5200',
                            backgroundColor: displayStatus === 'paid' ? '#e8f5e9' : displayStatus === 'expired' ? '#fff0f0' : '#fff8e6',
                            border: `1px solid ${displayStatus === 'paid' ? '#1a5c1a44' : displayStatus === 'expired' ? '#7a000044' : '#f0c04066'}`,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {displayStatus === 'waiting_approval' ? 'Waiting Approval' : displayStatus}
                        </span>
                        {payment.adminRejectionReason && (
                          <div style={{ marginTop: '6px', color: '#7a0000', fontSize: '11px', maxWidth: '220px' }}>
                            Reason: {payment.adminRejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#54667d', fontSize: '13px' }}>
                        {new Date(payment.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => submitApprove(payment.quoteId)}
                            disabled={!canTakeAction || isBusy}
                            style={{ border: 'none', borderRadius: '8px', padding: '7px 10px', backgroundColor: '#1a5c1a', color: 'white', cursor: !canTakeAction || isBusy ? 'not-allowed' : 'pointer', opacity: !canTakeAction || isBusy ? 0.6 : 1 }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setError('');
                              setRejectingQuoteId(payment.quoteId);
                              setRejectReason('');
                            }}
                            disabled={!canTakeAction || isBusy}
                            style={{ border: 'none', borderRadius: '8px', padding: '7px 10px', backgroundColor: '#7a0000', color: 'white', cursor: !canTakeAction || isBusy ? 'not-allowed' : 'pointer', opacity: !canTakeAction || isBusy ? 0.6 : 1 }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectingQuoteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '520px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e0e4ea', padding: '16px' }}>
            <div style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '13px', marginBottom: '8px' }}>
              Reject Payment Submission
            </div>
            <div style={{ color: '#54667d', fontSize: '13px', marginBottom: '10px' }}>
              Rejection reason is required. Customer will be notified and can resubmit.
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{ width: '100%', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '10px', outline: 'none', fontSize: '13px', color: '#15263c', resize: 'vertical' }}
              placeholder="Enter rejection reason"
            />
            <div className="flex items-center justify-end gap-2" style={{ marginTop: '12px' }}>
              <button
                onClick={() => {
                  setRejectingQuoteId(null);
                  setRejectReason('');
                }}
                style={{ border: '1px solid #e0e4ea', borderRadius: '8px', padding: '8px 12px', backgroundColor: 'white', color: '#15263c', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim() || activeActionQuote === rejectingQuoteId}
                style={{ border: 'none', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#7a0000', color: 'white', cursor: !rejectReason.trim() || activeActionQuote === rejectingQuoteId ? 'not-allowed' : 'pointer', opacity: !rejectReason.trim() || activeActionQuote === rejectingQuoteId ? 0.6 : 1 }}
              >
                {activeActionQuote === rejectingQuoteId ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
