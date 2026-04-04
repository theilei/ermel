import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Bell, FileDown, RefreshCw, Search } from 'lucide-react';
import qrCodeImage from '../../assets/qr-code.png';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import {
  deleteCustomerPaymentProof,
  fetchCheckStatusQuotes,
  fetchCustomerPayment,
  fetchNotifications,
  fetchQuoteUpdates,
  getCustomerCashReceiptUrl,
  getCustomerQuotePDFUrl,
  markAllNotificationsRead,
  markNotificationRead,
  setCustomerPaymentMethod,
  uploadCustomerPaymentProof,
} from '../services/api';
import type { Quote, QuoteUpdate, SystemNotification } from '../types/quotation';

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];
const ALLOWED_PROOF_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function formatCurrency(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return 'N/A';
  return `Php ${value.toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusColor(status?: string) {
  const key = (status || '').toLowerCase();
  if (key === 'approved') return '#1a5c1a';
  if (key === 'rejected') return '#7a0000';
  if (key === 'expired') return '#8a8a8a';
  if (key === 'pending') return '#7a5200';
  if (key === 'waiting_approval') return '#7a5200';
  return '#15263c';
}

function formatStatusLabel(status?: string) {
  if (!status) return 'N/A';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function validatePaymentProofFile(file: File): string | null {
  const fileName = file.name || '';
  const lowerName = fileName.toLowerCase();
  const ext = lowerName.includes('.') ? lowerName.split('.').pop() || '' : '';

  if (!ext || !ALLOWED_PROOF_EXTENSIONS.includes(ext)) {
    return 'Invalid file type. Allowed: jpg, jpeg, png, pdf.';
  }

  if (/\.(jpg|jpeg|png|pdf)\.[a-z0-9]+$/i.test(lowerName)) {
    return 'Invalid file name. Double extensions are not allowed.';
  }

  if (!ALLOWED_PROOF_MIME_TYPES.includes((file.type || '').toLowerCase())) {
    return 'Invalid file type. Allowed: jpg, jpeg, png, pdf.';
  }

  if (file.size > MAX_PROOF_FILE_SIZE) {
    return 'File exceeds 5MB limit.';
  }

  return null;
}

const DEFAULT_PROOF_LABEL = 'No file selected yet';
const API_ORIGIN = (((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

export default function CheckStatus() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [updatesByQuote, setUpdatesByQuote] = useState<Record<string, QuoteUpdate[]>>({});
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [paymentMetaByQuote, setPaymentMetaByQuote] = useState<Record<string, { quoteStatus: string; payment: any | null; countdown: { deadline: string; remainingMs: number; expired: boolean } }>>({});
  const [submittingProof, setSubmittingProof] = useState(false);
  const [selectedProofName, setSelectedProofName] = useState(DEFAULT_PROOF_LABEL);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [proofValidationError, setProofValidationError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [successPopupMessage, setSuccessPopupMessage] = useState('');
  const [localProofPreviewUrl, setLocalProofPreviewUrl] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const proofInputRef = useRef<HTMLInputElement | null>(null);
  const successPopupTimerRef = useRef<number | null>(null);
  const previousPaymentStatusRef = useRef<string | null>(null);

  const showSuccessPopup = useCallback((message: string) => {
    setSuccessPopupMessage(message);
    if (successPopupTimerRef.current) {
      window.clearTimeout(successPopupTimerRef.current);
    }
    successPopupTimerRef.current = window.setTimeout(() => {
      setSuccessPopupMessage('');
      successPopupTimerRef.current = null;
    }, 4000);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Notification panel should fail gracefully.
    }
  }, []);

  const loadUpdates = useCallback(async (quoteId: string) => {
    try {
      const data = await fetchQuoteUpdates(quoteId);
      setUpdatesByQuote((prev) => ({ ...prev, [quoteId]: data.updates || [] }));
    } catch {
      setUpdatesByQuote((prev) => ({ ...prev, [quoteId]: [] }));
    }
  }, []);

  const loadPaymentMeta = useCallback(async (quoteId: string) => {
    try {
      const data = await fetchCustomerPayment(quoteId);
      setPaymentMetaByQuote((prev) => ({
        ...prev,
        [quoteId]: {
          quoteStatus: data.quoteStatus,
          payment: data.payment,
          countdown: data.countdown,
        },
      }));
    } catch {
      // Keep payment panel resilient.
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    try {
      setError('');
      const data = await fetchCheckStatusQuotes();
      setQuotes(data);
      setSelectedQuoteId((prev) => {
        if (prev && data.some((q) => q.id === prev)) return prev;
        return data[0]?.id || null;
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load your quotes right now.');
      setQuotes([]);
      setSelectedQuoteId(null);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadQuotes(), loadNotifications()]);
    setLoading(false);
  }, [loadQuotes, loadNotifications]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (!selectedQuoteId) return;
    if (updatesByQuote[selectedQuoteId]) return;
    loadUpdates(selectedQuoteId);
    loadPaymentMeta(selectedQuoteId);
  }, [selectedQuoteId, loadUpdates, loadPaymentMeta, updatesByQuote]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedQuoteId) return;
    const poller = window.setInterval(() => {
      loadPaymentMeta(selectedQuoteId);
    }, 30000);
    return () => window.clearInterval(poller);
  }, [selectedQuoteId, loadPaymentMeta]);

  useEffect(() => {
    const activeQuote = quotes.find((q) => q.id === selectedQuoteId);
    setSelectedProofFile(null);
    setProofValidationError('');
    setPaymentMessage('');
    setSelectedProofName(activeQuote?.payment?.proofFile || DEFAULT_PROOF_LABEL);
    setLocalProofPreviewUrl(null);
  }, [quotes, selectedQuoteId]);

  useEffect(() => {
    return () => {
      if (localProofPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(localProofPreviewUrl);
      }
    };
  }, [localProofPreviewUrl]);

  useEffect(() => {
    return () => {
      if (successPopupTimerRef.current) {
        window.clearTimeout(successPopupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    previousPaymentStatusRef.current = null;
  }, [selectedQuoteId]);

  useEffect(() => {
    if (!supabase || !user) return;
    const client = supabase;

    const quoteChannel = client
      .channel('customer-check-status-quotes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, (payload) => {
        const row = payload.new as any;
        if (row?.customer_email && String(row.customer_email).toLowerCase() === user.email.toLowerCase()) {
          loadQuotes();
          if (selectedQuoteId) loadUpdates(selectedQuoteId);
        }
      })
      .subscribe();

    const updateChannel = client
      .channel('customer-check-status-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quote_updates' }, () => {
        loadQuotes();
        if (selectedQuoteId) loadUpdates(selectedQuoteId);
      })
      .subscribe();

    const paymentChannel = client
      .channel('customer-check-status-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadQuotes();
        if (selectedQuoteId) loadPaymentMeta(selectedQuoteId);
      })
      .subscribe();

    const notifChannel = client
      .channel('customer-check-status-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(quoteChannel);
      client.removeChannel(updateChannel);
      client.removeChannel(paymentChannel);
      client.removeChannel(notifChannel);
    };
  }, [loadNotifications, loadQuotes, loadUpdates, loadPaymentMeta, selectedQuoteId, user]);

  const filteredQuotes = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return quotes;
    return quotes.filter((q) => q.id.toLowerCase().includes(value));
  }, [quotes, search]);

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) || null,
    [quotes, selectedQuoteId]
  );

  const selectedUpdates = selectedQuote ? updatesByQuote[selectedQuote.id] || [] : [];
  const latestUpdate = selectedUpdates[0];
  const latestStatus = latestUpdate?.status || selectedQuote?.status;
  const paymentMeta = selectedQuote ? paymentMetaByQuote[selectedQuote.id] : undefined;
  const effectivePayment = paymentMeta?.payment || selectedQuote?.payment || null;
  const deadlineMs = paymentMeta?.countdown?.deadline ? new Date(paymentMeta.countdown.deadline).getTime() : 0;
  const countdownMs = deadlineMs > 0 ? Math.max(0, deadlineMs - nowMs) : 0;
  const isPaymentExpired = paymentMeta?.countdown?.expired || selectedQuote?.status === 'cancelled' || effectivePayment?.status === 'expired';
  const isPaymentPaid = effectivePayment?.status === 'paid';
  const canShowPaymentSection = selectedQuote?.status === 'approved' || selectedQuote?.status === 'cancelled';
  const hasProofForDelete = Boolean(effectivePayment?.proofFile) || selectedProofName !== DEFAULT_PROOF_LABEL;
  const uploadedProofUrl = useMemo(() => {
    const proofPath = effectivePayment?.proofFile;
    if (!proofPath) return null;
    if (/^https?:\/\//i.test(proofPath)) return proofPath;
    return `${API_ORIGIN}${proofPath.startsWith('/') ? '' : '/'}${proofPath}`;
  }, [effectivePayment?.proofFile]);
  const proofPreviewUrl = localProofPreviewUrl || uploadedProofUrl;
  const proofLabel = selectedProofName === DEFAULT_PROOF_LABEL
    ? (effectivePayment?.proofFile || DEFAULT_PROOF_LABEL)
    : selectedProofName;
  const lowerProofName = proofLabel.toLowerCase();
  const isPreviewPdf = lowerProofName.endsWith('.pdf');
  const isPreviewImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lowerProofName);
  const canModifyPayment = !isPaymentExpired && !isPaymentPaid;
  const hasPaymentProof = Boolean(effectivePayment?.proofFile) || Boolean(selectedProofFile);
  const canChangePaymentMethod = !isPaymentExpired && !isPaymentPaid && !hasPaymentProof;
  const canSubmitSelectedProof = Boolean(selectedProofFile) && !proofValidationError && canModifyPayment;
  const paymentStatusLabel = effectivePayment?.status === 'waiting_approval'
    ? (effectivePayment?.proofFile ? 'Waiting for approval' : 'No submission yet')
    : (effectivePayment?.status || 'No submission yet');
  const showProofSubmittedSuccess = effectivePayment?.status === 'waiting_approval'
    && Boolean(effectivePayment?.proofFile)
    && !effectivePayment?.adminRejectionReason;
  const paidOn = effectivePayment?.verifiedAt || null;
  const countdownLabel = (() => {
    if (!paymentMeta) return 'Loading...';
    const ms = Math.max(0, countdownMs);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  })();

  useEffect(() => {
    const currentStatus = effectivePayment?.status || null;
    if (previousPaymentStatusRef.current && previousPaymentStatusRef.current !== 'paid' && currentStatus === 'paid') {
      showSuccessPopup('Payment verified successfully');
      loadNotifications().catch(() => {});
    }
    previousPaymentStatusRef.current = currentStatus;
  }, [effectivePayment?.status, loadNotifications, showSuccessPopup]);

  const handleNotificationClick = async (notification: SystemNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id).catch(() => {});
      await loadNotifications();
    }

    const quoteNumber = notification.relatedQuoteNumber
      || notification.message.match(/Q-\d+/i)?.[0]
      || null;

    if (quoteNumber) {
      const found = quotes.find((q) => q.id.toLowerCase() === quoteNumber.toLowerCase());
      if (found) {
        setSelectedQuoteId(found.id);
        setNotifOpen(false);
      }
    }
  };

  const handleProofFileSelected = (file: File | null) => {
    setPaymentMessage('');
    if (!file) {
      setSelectedProofFile(null);
      setProofValidationError('');
      return;
    }

    const validationError = validatePaymentProofFile(file);
    if (validationError) {
      setSelectedProofFile(null);
      setProofValidationError(validationError);
      setSelectedProofName(DEFAULT_PROOF_LABEL);
      if (localProofPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localProofPreviewUrl);
      setLocalProofPreviewUrl(null);
      return;
    }

    setProofValidationError('');
    setSelectedProofFile(file);
    setSelectedProofName(file.name);
    if (localProofPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localProofPreviewUrl);
    setLocalProofPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmitPayment = async () => {
    if (!selectedQuote || !selectedProofFile) return;
    if (proofValidationError) return;

    setSubmittingProof(true);
    setPaymentMessage('');
    try {
      await uploadCustomerPaymentProof(selectedQuote.id, selectedProofFile);
      setSelectedProofFile(null);
      setPaymentMessage('Proof submitted successfully');
      showSuccessPopup('Proof submitted successfully');
      await reloadAll();
      await loadPaymentMeta(selectedQuote.id);
      await loadNotifications();
    } catch (err: any) {
      setPaymentMessage(err?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleSelectPaymentMethod = async (method: 'qrph' | 'cash') => {
    if (!selectedQuote || !canChangePaymentMethod) return;

    setPaymentMessage('');
    try {
      await setCustomerPaymentMethod(selectedQuote.id, method);
      await reloadAll();
      await loadPaymentMeta(selectedQuote.id);
    } catch (err: any) {
      setPaymentMessage(err?.message || 'Failed to set payment method. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingTop: '96px', paddingBottom: '40px', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', letterSpacing: '0.16em', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
              Customer Portal
            </div>
            <h1 style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.1, marginTop: '4px' }}>
              Check My Status
            </h1>
            <p style={{ color: '#54667d', marginTop: '10px', fontSize: '14px' }}>
              View your quote status, updated pricing, and admin remarks in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={reloadAll}
              className="inline-flex items-center gap-2"
              style={{
                border: '1px solid #d9dce3',
                backgroundColor: 'white',
                color: '#15263c',
                borderRadius: '8px',
                padding: '10px 14px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                style={{
                  border: '1px solid #d9dce3',
                  backgroundColor: 'white',
                  color: '#15263c',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  position: 'relative',
                }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '999px',
                      backgroundColor: '#7a0000',
                      color: 'white',
                      fontSize: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      padding: '0 5px',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '330px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #e0e4ea',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 25,
                  }}
                >
                  <div className="flex items-center justify-between" style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>
                    <strong style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', fontSize: '12px', textTransform: 'uppercase', color: '#15263c' }}>
                      Notifications
                    </strong>
                    <button
                      onClick={async () => {
                        await markAllNotificationsRead().catch(() => {});
                        await loadNotifications();
                      }}
                      style={{ background: 'none', border: 'none', color: '#7a0000', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                    >
                      Mark all read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '16px', color: '#9ab0c4', fontSize: '13px' }}>No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid #f0f2f5',
                          backgroundColor: n.read ? 'white' : '#fff8e1',
                          padding: '12px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#15263c', fontSize: '12px', marginBottom: '4px' }}>
                          {n.title}
                        </div>
                        <div style={{ color: '#54667d', fontSize: '12px', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ color: '#9ab0c4', fontSize: '11px', marginTop: '5px' }}>{formatDate(n.createdAt)}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '24px', color: '#54667d' }}>
            Loading status data...
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#fff0f0', border: '1px solid #7a000044', borderRadius: '10px', padding: '16px', color: '#7a0000' }}>
            {error}
          </div>
        ) : quotes.length === 0 ? (
          <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '28px', textAlign: 'center' }}>
            <div style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', textTransform: 'uppercase' }}>
              No Quote Requests Yet
            </div>
            <p style={{ color: '#54667d', marginTop: '8px' }}>You do not have any quote requests yet.</p>
            <Link
              to="/quote"
              style={{
                marginTop: '12px',
                display: 'inline-block',
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                borderRadius: '8px',
                padding: '11px 18px',
                textDecoration: 'none',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '12px',
              }}
            >
              Request a Quote
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px' }}>
              <div style={{ padding: '14px', borderBottom: '1px solid #f0f2f5' }}>
                <div className="relative">
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ab0c4' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Quote ID"
                    style={{
                      width: '100%',
                      border: '1px solid #e0e4ea',
                      borderRadius: '8px',
                      padding: '10px 10px 10px 34px',
                      fontSize: '13px',
                      color: '#15263c',
                      outline: 'none',
                    }}
                  />
                </div>

                <div className="lg:hidden" style={{ marginTop: '10px' }}>
                  <select
                    value={selectedQuote?.id || ''}
                    onChange={(e) => setSelectedQuoteId(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #e0e4ea',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#15263c',
                      backgroundColor: 'white',
                    }}
                  >
                    {filteredQuotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.id} | {q.projectType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden lg:block" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {filteredQuotes.length === 0 ? (
                  <div style={{ padding: '14px', color: '#9ab0c4', fontSize: '13px' }}>No quotes match your search.</div>
                ) : (
                  filteredQuotes.map((q) => {
                    const isSelected = selectedQuote?.id === q.id;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuoteId(q.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid #f0f2f5',
                          backgroundColor: isSelected ? '#f5f7fa' : 'white',
                          padding: '12px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '12px', color: '#7a0000', letterSpacing: '0.08em' }}>
                          {q.id}
                        </div>
                        <div style={{ color: '#15263c', fontWeight: 700, marginTop: '2px' }}>{q.projectType}</div>
                        <div style={{ color: statusColor(q.status), fontSize: '13px', marginTop: '3px' }}>{formatStatusLabel(q.status)}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-8" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px' }}>
              {!selectedQuote ? (
                <div style={{ padding: '24px', color: '#54667d' }}>Select a quote to view details.</div>
              ) : (
                <div style={{ padding: '18px' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3" style={{ marginBottom: '14px' }}>
                    <div>
                      <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.08em', fontSize: '12px' }}>
                        {selectedQuote.id}
                      </div>
                      <h2 style={{ marginTop: '3px', color: '#15263c', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 800, fontSize: '23px' }}>
                        {selectedQuote.projectType}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={getCustomerQuotePDFUrl(selectedQuote.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2"
                        style={{
                          border: '1px solid #d9dce3',
                          backgroundColor: 'white',
                          color: '#15263c',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '12px',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <FileDown size={14} /> Download Quote PDF
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
                    <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                      <div style={{ marginTop: '4px', color: statusColor(latestStatus), fontWeight: 800, fontSize: '20px' }}>
                        {formatStatusLabel(latestStatus || 'pending')}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Reservation Date</div>
                      <div style={{ marginTop: '4px', color: '#15263c', fontWeight: 700 }}>{selectedQuote.reservationDate || 'N/A'}</div>
                    </div>

                    <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Estimated Price</div>
                      <div style={{ marginTop: '4px', color: '#15263c', fontWeight: 800, fontSize: '18px' }}>
                        {formatCurrency(selectedQuote.originalEstimatedCost ?? selectedQuote.estimatedCost)}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Updated Price</div>
                      <div style={{ marginTop: '4px', color: '#7a0000', fontWeight: 800, fontSize: '18px' }}>
                        {formatCurrency(selectedQuote.updatedCost ?? latestUpdate?.updatedPrice)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px', color: '#54667d', fontSize: '13px' }}>
                    <strong>Last Updated:</strong> {formatDate(latestUpdate?.updatedAt || selectedQuote.submissionDate)}
                  </div>

                  {canShowPaymentSection && (
                    <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '14px', marginBottom: '16px' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '12px', marginBottom: '10px' }}>
                        Payment
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: '10px' }}>
                        <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ color: '#9ab0c4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Approved Price</div>
                          <div style={{ color: '#15263c', fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
                            {formatCurrency(selectedQuote.updatedCost ?? selectedQuote.estimatedCost)}
                          </div>
                        </div>
                        <div
                          style={{
                            backgroundColor: isPaymentPaid ? '#e8f5e9' : '#f5f7fa',
                            border: `1px solid ${isPaymentPaid ? '#1a5c1a44' : '#e0e4ea'}`,
                            borderRadius: '8px',
                            padding: '10px',
                          }}
                        >
                          <div style={{ color: '#9ab0c4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Payment Status</div>
                          <div style={{ color: isPaymentPaid ? '#1a5c1a' : '#15263c', fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
                            {formatStatusLabel(paymentStatusLabel)}
                          </div>
                          {isPaymentPaid && (
                            <div style={{ marginTop: '5px', color: '#1a5c1a', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                              Verified
                            </div>
                          )}
                          {effectivePayment?.adminRejectionReason && (
                            <div style={{ marginTop: '6px', color: '#7a0000', fontSize: '11px' }}>
                              Rejection reason: {effectivePayment.adminRejectionReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {isPaymentPaid && (
                        <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                          <div style={{ color: '#1a5c1a', fontSize: '12px', fontWeight: 800 }}>
                            Payment verified successfully
                          </div>
                          <div style={{ marginTop: '3px', color: '#2f5f2f', fontSize: '12px' }}>
                            Paid on {paidOn ? formatDate(paidOn) : 'N/A'}
                          </div>
                        </div>
                      )}

                      {showProofSubmittedSuccess && (
                        <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                          <div style={{ color: '#1a5c1a', fontSize: '12px', fontWeight: 700 }}>
                            Proof submitted successfully
                          </div>
                          <div style={{ marginTop: '3px', color: '#2f5f2f', fontSize: '11px' }}>
                            Your payment proof is under verification.
                          </div>
                        </div>
                      )}

                      {!isPaymentPaid && (
                        <div style={{ backgroundColor: isPaymentExpired ? '#fff0f0' : '#fff8e1', border: `1px solid ${isPaymentExpired ? '#7a000044' : '#f0c04066'}`, borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                          <div style={{ color: isPaymentExpired ? '#7a0000' : '#7a5200', fontSize: '12px', fontWeight: 700 }}>
                            {isPaymentExpired ? 'Payment window expired' : `Time left to pay: ${countdownLabel}`}
                          </div>
                        </div>
                      )}

                      <fieldset
                        style={{
                          border: '1px solid #e0e4ea',
                          borderRadius: '8px',
                          padding: '10px',
                          marginBottom: '10px',
                          opacity: canChangePaymentMethod ? 1 : 0.65,
                        }}
                        disabled={!canChangePaymentMethod}
                      >
                        <legend style={{ padding: '0 6px', color: '#54667d', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Select a Payment Method
                        </legend>
                        <div className="flex flex-wrap gap-3">
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              border: '1px solid #e0e4ea',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              backgroundColor: effectivePayment?.paymentMethod === 'qrph' ? '#f5f7fa' : 'white',
                              color: '#15263c',
                              cursor: canChangePaymentMethod ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="qrph"
                              checked={effectivePayment?.paymentMethod === 'qrph'}
                              onChange={() => {
                                void handleSelectPaymentMethod('qrph');
                              }}
                              disabled={!canChangePaymentMethod}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Pay Online</span>
                          </label>

                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              border: '1px solid #e0e4ea',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              backgroundColor: effectivePayment?.paymentMethod === 'cash' ? '#f5f7fa' : 'white',
                              color: '#15263c',
                              cursor: canChangePaymentMethod ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash"
                              checked={effectivePayment?.paymentMethod === 'cash'}
                              onChange={() => {
                                void handleSelectPaymentMethod('cash');
                              }}
                              disabled={!canChangePaymentMethod}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Cash</span>
                          </label>
                        </div>
                      </fieldset>

                      {effectivePayment?.paymentMethod === 'qrph' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                          <div className="lg:col-span-8" style={{ border: '1px dashed #d9dce3', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ color: '#54667d', fontSize: '12px', marginBottom: '8px' }}>Upload your payment proof (JPG, JPEG, PNG, or PDF, up to 5MB)</div>
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const f = e.dataTransfer.files?.[0];
                                if (!f || !canModifyPayment) return;
                                handleProofFileSelected(f);
                              }}
                              style={{ border: '1px dashed #c8cfdb', borderRadius: '8px', padding: '10px', marginBottom: '8px', backgroundColor: '#fcfdff' }}
                            >
                              <div style={{ color: '#54667d', fontSize: '12px' }}>Drag and drop file here</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={!canModifyPayment || submittingProof}
                                onClick={() => proofInputRef.current?.click()}
                                style={{
                                  border: '1px solid #e0e4ea',
                                  borderRadius: '8px',
                                  padding: '7px 12px',
                                  backgroundColor: 'white',
                                  color: '#15263c',
                                  cursor: !canModifyPayment || submittingProof ? 'not-allowed' : 'pointer',
                                }}
                              >
                                Choose File
                              </button>
                              <input
                                ref={proofInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                disabled={!canModifyPayment || submittingProof}
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  handleProofFileSelected(f);
                                  e.currentTarget.value = '';
                                }}
                              />
                              <button
                                onClick={handleSubmitPayment}
                                disabled={!canSubmitSelectedProof || submittingProof}
                                style={{
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '7px 12px',
                                  background: 'linear-gradient(135deg, #7a0000, #a50000)',
                                  color: 'white',
                                  cursor: !canSubmitSelectedProof || submittingProof ? 'not-allowed' : 'pointer',
                                  opacity: !canSubmitSelectedProof || submittingProof ? 0.6 : 1,
                                }}
                              >
                                {submittingProof ? 'Submitting...' : 'Submit Payment'}
                              </button>
                              {hasProofForDelete && (
                                <button
                                  onClick={async () => {
                                    await deleteCustomerPaymentProof(selectedQuote.id);
                                    setSelectedProofFile(null);
                                    setProofValidationError('');
                                    setPaymentMessage('Payment proof deleted. You can upload a new one.');
                                    setSelectedProofName(DEFAULT_PROOF_LABEL);
                                    if (localProofPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localProofPreviewUrl);
                                    setLocalProofPreviewUrl(null);
                                    await reloadAll();
                                  }}
                                  disabled={!canModifyPayment || submittingProof}
                                  style={{ border: '1px solid #e0e4ea', borderRadius: '8px', padding: '7px 12px', backgroundColor: 'white', color: '#15263c', cursor: 'pointer' }}
                                >
                                  Delete File
                                </button>
                              )}
                            </div>
                            <div style={{ marginTop: '6px', color: '#8aa0b8', fontSize: '11px' }}>{proofLabel}</div>
                            {proofValidationError && (
                              <div style={{ marginTop: '6px', color: '#7a0000', fontSize: '11px' }}>{proofValidationError}</div>
                            )}
                            {paymentMessage && (
                              <div style={{ marginTop: '6px', color: paymentMessage.toLowerCase().includes('failed') ? '#7a0000' : '#1a5c1a', fontSize: '11px' }}>
                                {paymentMessage}
                              </div>
                            )}

                            {proofPreviewUrl && hasProofForDelete && (
                              <div style={{ marginTop: '10px', border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: '#f8fafc', padding: '8px' }}>
                                <div style={{ color: '#54667d', fontSize: '11px', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Proof Preview
                                </div>
                                {isPreviewImage ? (
                                  <img
                                    src={proofPreviewUrl}
                                    alt="Uploaded payment proof preview"
                                    style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '6px', backgroundColor: 'white', border: '1px solid #e0e4ea' }}
                                  />
                                ) : isPreviewPdf ? (
                                  <iframe
                                    title="Uploaded payment proof preview"
                                    src={proofPreviewUrl}
                                    style={{ width: '100%', height: '260px', border: '1px solid #e0e4ea', borderRadius: '6px', backgroundColor: 'white' }}
                                  />
                                ) : (
                                  <a
                                    href={proofPreviewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#7a0000', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                                  >
                                    Open uploaded proof
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <aside
                            className="lg:col-span-4"
                            style={{
                              border: '1px solid #e0e4ea',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              backgroundColor: 'white',
                              alignSelf: 'start',
                            }}
                          >
                            <div
                              style={{
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                                color: 'white',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                fontSize: '11px',
                              }}
                            >
                              Official QR Payment
                            </div>

                            <div style={{ padding: '10px' }}>
                              <div
                                style={{
                                  border: '1px solid #e0e4ea',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  backgroundColor: '#f8fafc',
                                  display: 'flex',
                                  justifyContent: 'center',
                                }}
                              >
                                <img
                                  src={qrCodeImage}
                                  alt="QR payment code"
                                  style={{ width: '100%', maxWidth: '220px', height: 'auto', borderRadius: '6px' }}
                                />
                              </div>
                              <div style={{ marginTop: '8px', color: '#54667d', fontSize: '11px', lineHeight: 1.4 }}>
                                Scan this code with your e-wallet or banking app, then upload your payment proof.
                              </div>
                            </div>
                          </aside>
                        </div>
                      )}

                      {effectivePayment?.paymentMethod === 'cash' && (
                        <a
                          href={getCustomerCashReceiptUrl(selectedQuote.id)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-block', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '8px 12px', color: '#15263c', textDecoration: 'none' }}
                        >
                          Generate Receipt PDF
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '14px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '12px', marginBottom: '10px' }}>
                      Admin Remarks History
                    </div>

                    {selectedUpdates.length === 0 ? (
                      <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px', color: '#54667d', fontSize: '13px' }}>
                        No admin remarks yet for this quote.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedUpdates.map((u) => (
                          <div key={u.id} style={{ border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px', backgroundColor: 'white' }}>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ marginBottom: '6px' }}>
                              <span style={{ color: statusColor(u.status), fontSize: '12px', fontWeight: 700 }}>{formatStatusLabel(u.status || 'updated')}</span>
                              <span style={{ color: '#9ab0c4', fontSize: '11px' }}>{formatDate(u.createdAt)}</span>
                              <span style={{ color: '#54667d', fontSize: '11px' }}>{u.adminName || 'Admin'}</span>
                            </div>
                            <div style={{ color: '#15263c', fontSize: '13px', marginBottom: '5px' }}>
                              {u.adminRemark || 'No remark provided.'}
                            </div>
                            <div style={{ color: '#54667d', fontSize: '12px' }}>
                              Estimated: {formatCurrency(u.estimatedPrice)} | Updated: {formatCurrency(u.updatedPrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {successPopupMessage && (
        <div
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            maxWidth: '320px',
            zIndex: 60,
            backgroundColor: '#1a5c1a',
            color: 'white',
            borderRadius: '10px',
            border: '1px solid #144714',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            padding: '12px 14px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
          role="status"
          aria-live="polite"
        >
          {successPopupMessage}
        </div>
      )}

    </div>
  );
}
