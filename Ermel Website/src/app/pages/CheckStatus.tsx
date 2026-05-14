import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, Bell, CheckCircle2, ChevronDown, Clock3, FileDown, RefreshCw, Search, XCircle } from 'lucide-react';
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

function formatStatusLabel(status?: string) {
  if (!status) return 'N/A';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const STATUS_TONE_STYLES: Record<StatusTone, { color: string; bg: string; border: string }> = {
  success: { color: '#1a5c1a', bg: '#e8f5e9', border: '#1a5c1a44' },
  warning: { color: '#7a5200', bg: '#fff8e1', border: '#f0c04066' },
  danger: { color: '#7a0000', bg: '#fff0f0', border: '#7a000044' },
  neutral: { color: '#54667d', bg: '#f5f7fa', border: '#e0e4ea' },
  info: { color: '#005c7a', bg: '#e6f4f8', border: '#005c7a44' },
};

function getStatusMeta(status?: string) {
  const key = (status || '').toLowerCase();
  let tone: StatusTone = 'neutral';
  let Icon = Clock3;

  if (['approved', 'paid', 'customer_accepted', 'converted_to_order'].includes(key)) {
    tone = 'success';
    Icon = CheckCircle2;
  } else if (['pending', 'draft', 'waiting_approval', 'no_submission_yet', 'cash_payment_pending'].includes(key)) {
    tone = 'warning';
    Icon = Clock3;
  } else if (['rejected', 'customer_declined'].includes(key)) {
    tone = 'danger';
    Icon = XCircle;
  } else if (['expired', 'cancelled'].includes(key)) {
    tone = 'danger';
    Icon = AlertTriangle;
  } else if (['inquiry', 'quotation', 'ordering', 'fabrication', 'installation'].includes(key)) {
    tone = 'info';
    Icon = Clock3;
  }

  return {
    label: formatStatusLabel(status),
    tone,
    Icon,
    ...STATUS_TONE_STYLES[tone],
  };
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
const API_ORIGIN = (((import.meta as any).env?.VITE_API_URL as string | undefined) || '/api').replace(/\/api\/?$/, '');

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
  const [cashConfirmOpen, setCashConfirmOpen] = useState(false);
  const [cashConfirmBusy, setCashConfirmBusy] = useState(false);
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
  const isCashLocked = effectivePayment?.paymentMethod === 'cash' && !isPaymentExpired && !isPaymentPaid;
  const canChangePaymentMethod = !isPaymentExpired && !isPaymentPaid && !hasPaymentProof && !isCashLocked;
  const canSubmitSelectedProof = Boolean(selectedProofFile) && !proofValidationError && canModifyPayment;
  const paymentStatusLabel = effectivePayment?.status === 'waiting_approval'
    ? (effectivePayment?.paymentMethod === 'cash'
      ? 'cash_payment_pending'
      : (effectivePayment?.proofFile ? 'waiting_approval' : 'no_submission_yet'))
    : (effectivePayment?.status || 'no_submission_yet');
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
  const quoteStatusMeta = getStatusMeta(latestStatus || selectedQuote?.status || 'pending');
  const paymentStatusMeta = getStatusMeta(paymentStatusLabel);
  const QuoteStatusIcon = quoteStatusMeta.Icon;
  const PaymentStatusIcon = paymentStatusMeta.Icon;

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

  const persistPaymentMethod = async (method: 'qrph' | 'cash') => {
    if (!selectedQuote) return;
    await setCustomerPaymentMethod(selectedQuote.id, method);
    await reloadAll();
    await loadPaymentMeta(selectedQuote.id);
  };

  const handleSelectPaymentMethod = async (method: 'qrph' | 'cash') => {
    if (!selectedQuote || !canChangePaymentMethod) return;

    setPaymentMessage('');
    try {
      await persistPaymentMethod(method);
    } catch (err: any) {
      setPaymentMessage(err?.message || 'Failed to set payment method. Please try again.');
    }
  };

  const handleConfirmCashMethod = async () => {
    if (!selectedQuote || !canChangePaymentMethod) {
      setCashConfirmOpen(false);
      return;
    }

    setCashConfirmBusy(true);
    setPaymentMessage('');
    try {
      await persistPaymentMethod('cash');
      showSuccessPopup('Cash payment selected. Please bring your receipt to the shop.');
    } catch (err: any) {
      setPaymentMessage(err?.message || 'Failed to set cash payment. Please try again.');
    } finally {
      setCashConfirmBusy(false);
      setCashConfirmOpen(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f7 60%, #fafafa 100%)',
        paddingTop: '96px',
        paddingBottom: '60px',
        fontFamily: 'var(--font-body)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 12% 8%, rgba(122,0,0,0.08), transparent 45%), radial-gradient(circle at 92% 0%, rgba(21,38,60,0.12), transparent 35%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #15263c, #1e3655)',
            borderRadius: '14px',
            boxShadow: '0 18px 40px rgba(21,38,60,0.25)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              borderRadius: '14px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-120px',
                right: '-80px',
                width: '280px',
                height: '280px',
                borderRadius: '999px',
                opacity: 0.15,
                background: 'radial-gradient(circle, #7a0000, transparent)',
              }}
            />
          </div>
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div style={{ color: '#ffbdbd', fontFamily: 'var(--font-heading)', letterSpacing: '0.2em', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                  Customer Portal
                </div>
                <h1 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: 1.1, marginTop: '6px' }}>
                  Check My Status
                </h1>
                <p style={{ color: '#9ab0c4', marginTop: '10px', fontSize: '14px', maxWidth: '520px' }}>
                  View your quote status, updated pricing, and admin remarks in real time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={reloadAll}
                  className="inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <RefreshCw size={15} /> Refresh
                </button>

                <div className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'white',
                      borderRadius: '999px',
                      padding: '10px 14px',
                      position: 'relative',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                    }}
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-2px',
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
                          border: '1px solid rgba(255,255,255,0.4)',
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
                        borderRadius: '12px',
                        boxShadow: '0 18px 32px rgba(21,38,60,0.2)',
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
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className="lg:col-span-4"
              style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '18px', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}
            >
              <div className="animate-pulse space-y-4">
                <div style={{ height: '40px', backgroundColor: '#eef2f6', borderRadius: '10px' }} />
                <div style={{ height: '14px', backgroundColor: '#eef2f6', borderRadius: '999px', width: '70%' }} />
                <div style={{ height: '70px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
                <div style={{ height: '70px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
                <div style={{ height: '70px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
              </div>
            </div>
            <div
              className="lg:col-span-8"
              style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '20px', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}
            >
              <div className="animate-pulse space-y-4">
                <div style={{ height: '18px', backgroundColor: '#eef2f6', borderRadius: '999px', width: '40%' }} />
                <div style={{ height: '30px', backgroundColor: '#eef2f6', borderRadius: '10px', width: '60%' }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div style={{ height: '90px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
                  <div style={{ height: '90px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
                  <div style={{ height: '90px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
                  <div style={{ height: '90px', backgroundColor: '#eef2f6', borderRadius: '12px' }} />
                </div>
                <div style={{ height: '160px', backgroundColor: '#eef2f6', borderRadius: '14px' }} />
              </div>
            </div>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#fff0f0', border: '1px solid #7a000044', borderRadius: '12px', padding: '18px', color: '#7a0000', boxShadow: '0 12px 24px rgba(122,0,0,0.08)' }}>
            {error}
          </div>
        ) : quotes.length === 0 ? (
          <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '32px', textAlign: 'center', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}>
            <div style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', textTransform: 'uppercase' }}>
              No Quote Requests Yet
            </div>
            <p style={{ color: '#54667d', marginTop: '8px' }}>You do not have any quote requests yet.</p>
            <Link
              to="/quote"
              className="inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                borderRadius: '8px',
                padding: '12px 22px',
                textDecoration: 'none',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '12px',
                boxShadow: '0 8px 20px rgba(122,0,0,0.35)',
              }}
            >
              Request a Quote
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className="lg:col-span-4 order-2 lg:order-1"
              style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}
            >
              <div style={{ padding: '18px', borderBottom: '1px solid #f0f2f5' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Your Quotes
                    </div>
                    <div style={{ color: '#9ab0c4', fontSize: '12px' }}>Select a quote to view details</div>
                  </div>
                  <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: '#15263c' }}>
                    {filteredQuotes.length}
                  </div>
                </div>

                <div className="relative" style={{ marginTop: '14px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ab0c4' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Quote ID"
                    style={{
                      width: '100%',
                      border: '1px solid #e0e4ea',
                      borderRadius: '10px',
                      padding: '12px 12px 12px 36px',
                      fontSize: '13px',
                      color: '#15263c',
                      outline: 'none',
                      backgroundColor: '#f8fafc',
                    }}
                  />
                </div>
              </div>

              <div className="lg:hidden" style={{ padding: '16px', borderBottom: '1px solid #f0f2f5' }}>
                <details style={{ border: '1px solid #e0e4ea', borderRadius: '10px', backgroundColor: 'white', padding: '12px' }}>
                  <summary
                    style={{
                      listStyle: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      color: '#15263c',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Select Quote
                    <ChevronDown size={16} />
                  </summary>
                  <div className="mt-3 space-y-3">
                    {filteredQuotes.map((q) => {
                      const isSelected = selectedQuote?.id === q.id;
                      const paymentStatus = paymentMetaByQuote[q.id]?.payment?.status || q.payment?.status;
                      const listStatus = paymentStatus === 'paid' ? 'paid' : q.status;
                      const statusMeta = getStatusMeta(listStatus);
                      const StatusIcon = statusMeta.Icon;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuoteId(q.id)}
                          className="w-full text-left transition-all duration-200"
                          style={{
                            border: `1px solid ${isSelected ? '#7a0000' : '#e0e4ea'}`,
                            borderRadius: '12px',
                            padding: '12px',
                            backgroundColor: 'white',
                            boxShadow: isSelected ? '0 10px 24px rgba(122,0,0,0.18)' : '0 6px 16px rgba(21,38,60,0.06)',
                          }}
                        >
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '11px', color: '#7a0000', letterSpacing: '0.08em' }}>
                            {q.id}
                          </div>
                          <div style={{ color: '#15263c', fontWeight: 700, marginTop: '4px' }}>{q.projectType}</div>
                          <div
                            className="inline-flex items-center gap-1"
                            style={{
                              marginTop: '8px',
                              color: statusMeta.color,
                              backgroundColor: statusMeta.bg,
                              border: `1px solid ${statusMeta.border}`,
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <StatusIcon size={12} /> {statusMeta.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </details>
              </div>

              <div className="hidden lg:block" style={{ maxHeight: '64vh', overflowY: 'auto', padding: '16px' }}>
                {filteredQuotes.length === 0 ? (
                  <div style={{ padding: '6px', color: '#9ab0c4', fontSize: '13px' }}>No quotes match your search.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuotes.map((q) => {
                      const isSelected = selectedQuote?.id === q.id;
                      const paymentStatus = paymentMetaByQuote[q.id]?.payment?.status || q.payment?.status;
                      const listStatus = paymentStatus === 'paid' ? 'paid' : q.status;
                      const statusMeta = getStatusMeta(listStatus);
                      const StatusIcon = statusMeta.Icon;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuoteId(q.id)}
                          className="w-full text-left transition-all duration-200 hover:-translate-y-0.5"
                          style={{
                            border: `1px solid ${isSelected ? '#7a0000' : '#e0e4ea'}`,
                            borderRadius: '12px',
                            padding: '14px',
                            backgroundColor: 'white',
                            boxShadow: isSelected ? '0 10px 24px rgba(122,0,0,0.18)' : '0 6px 16px rgba(21,38,60,0.06)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '11px', color: '#7a0000', letterSpacing: '0.08em' }}>
                                {q.id}
                              </div>
                              <div style={{ color: '#15263c', fontWeight: 700, marginTop: '4px' }}>{q.projectType}</div>
                              <div
                                className="inline-flex items-center gap-1"
                                style={{
                                  marginTop: '8px',
                                  color: statusMeta.color,
                                  backgroundColor: statusMeta.bg,
                                  border: `1px solid ${statusMeta.border}`,
                                  padding: '3px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                <StatusIcon size={12} /> {statusMeta.label}
                              </div>
                            </div>
                            <div style={{ color: '#9ab0c4', fontSize: '11px', textAlign: 'right' }}>
                              {formatDate(q.submissionDate)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 order-1 lg:order-2">
              {!selectedQuote ? (
                <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '24px', color: '#54667d', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}>
                  Select a quote to view details.
                </div>
              ) : (
                <div className="space-y-6">
                  <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '22px', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.08em', fontSize: '12px' }}>
                          {selectedQuote.id}
                        </div>
                        <h2 style={{ marginTop: '4px', color: '#15263c', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 800, fontSize: '24px' }}>
                          {selectedQuote.projectType}
                        </h2>
                        <div
                          className="inline-flex items-center gap-2"
                          style={{
                            marginTop: '10px',
                            color: quoteStatusMeta.color,
                            backgroundColor: quoteStatusMeta.bg,
                            border: `1px solid ${quoteStatusMeta.border}`,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <QuoteStatusIcon size={14} /> {quoteStatusMeta.label}
                        </div>
                        <div style={{ marginTop: '8px', color: '#9ab0c4', fontSize: '12px' }}>
                          Last updated: {formatDate(latestUpdate?.updatedAt || selectedQuote.submissionDate)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={getCustomerQuotePDFUrl(selectedQuote.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                          style={{
                            border: '1px solid #d9dce3',
                            backgroundColor: 'white',
                            color: '#15263c',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            textDecoration: 'none',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            boxShadow: '0 6px 16px rgba(21,38,60,0.08)',
                          }}
                        >
                          <FileDown size={14} /> Download Quote PDF
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: '18px' }}>
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e4ea', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 16px rgba(21,38,60,0.06)' }}>
                        <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                        <div
                          className="inline-flex items-center gap-2"
                          style={{
                            marginTop: '8px',
                            color: quoteStatusMeta.color,
                            backgroundColor: quoteStatusMeta.bg,
                            border: `1px solid ${quoteStatusMeta.border}`,
                            padding: '5px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <QuoteStatusIcon size={14} /> {quoteStatusMeta.label}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e4ea', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 16px rgba(21,38,60,0.06)' }}>
                        <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Reservation Date</div>
                        <div style={{ marginTop: '6px', color: '#15263c', fontWeight: 700 }}>{selectedQuote.reservationDate || 'N/A'}</div>
                      </div>

                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e4ea', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 16px rgba(21,38,60,0.06)' }}>
                        <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Estimated Price</div>
                        <div style={{ marginTop: '6px', color: '#15263c', fontWeight: 800, fontSize: '18px' }}>
                          {formatCurrency(selectedQuote.originalEstimatedCost ?? selectedQuote.estimatedCost)}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e4ea', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 16px rgba(21,38,60,0.06)' }}>
                        <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700 }}>Updated Price</div>
                        <div style={{ marginTop: '6px', color: '#7a0000', fontWeight: 800, fontSize: '18px' }}>
                          {formatCurrency(selectedQuote.updatedCost ?? latestUpdate?.updatedPrice)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {canShowPaymentSection && (
                    <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '22px', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '12px' }}>
                            Payment
                          </div>
                          <div style={{ color: '#9ab0c4', fontSize: '12px', marginTop: '4px' }}>
                            Secure payment tracking and verification.
                          </div>
                        </div>
                        <div
                          className="inline-flex items-center gap-2"
                          style={{
                            color: paymentStatusMeta.color,
                            backgroundColor: paymentStatusMeta.bg,
                            border: `1px solid ${paymentStatusMeta.border}`,
                            padding: '6px 12px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <PaymentStatusIcon size={14} /> {paymentStatusMeta.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '12px' }}>
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e4ea', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ color: '#9ab0c4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Approved Price</div>
                          <div style={{ color: '#15263c', fontSize: '20px', fontWeight: 800, marginTop: '6px' }}>
                            {formatCurrency(selectedQuote.updatedCost ?? selectedQuote.estimatedCost)}
                          </div>
                        </div>
                        <div style={{ backgroundColor: paymentStatusMeta.bg, border: `1px solid ${paymentStatusMeta.border}`, borderRadius: '12px', padding: '14px' }}>
                          <div style={{ color: '#9ab0c4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Payment Status</div>
                          <div style={{ color: paymentStatusMeta.color, fontSize: '16px', fontWeight: 800, marginTop: '6px' }}>
                            {paymentStatusMeta.label}
                          </div>
                          {isPaymentPaid && (
                            <div style={{ marginTop: '6px', color: '#1a5c1a', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
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
                        <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ color: '#1a5c1a', fontSize: '12px', fontWeight: 800 }}>
                            Payment verified successfully
                          </div>
                          <div style={{ marginTop: '4px', color: '#2f5f2f', fontSize: '12px' }}>
                            Paid on {paidOn ? formatDate(paidOn) : 'N/A'}
                          </div>
                        </div>
                      )}

                      {showProofSubmittedSuccess && (
                        <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #1a5c1a44', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ color: '#1a5c1a', fontSize: '12px', fontWeight: 700 }}>
                            Proof submitted successfully
                          </div>
                          <div style={{ marginTop: '4px', color: '#2f5f2f', fontSize: '11px' }}>
                            Your payment proof is under verification.
                          </div>
                        </div>
                      )}

                      {!isPaymentPaid && (
                        <div style={{ backgroundColor: isPaymentExpired ? '#fff0f0' : '#fff8e1', border: `1px solid ${isPaymentExpired ? '#7a000044' : '#f0c04066'}`, borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ color: isPaymentExpired ? '#7a0000' : '#7a5200', fontSize: '12px', fontWeight: 700 }}>
                            {isPaymentExpired ? 'Payment window expired' : `Time left to pay: ${countdownLabel}`}
                          </div>
                        </div>
                      )}

                      <fieldset
                        style={{
                          border: '1px solid #e0e4ea',
                          borderRadius: '12px',
                          padding: '14px',
                          marginBottom: '12px',
                          backgroundColor: '#f8fafc',
                          opacity: canChangePaymentMethod ? 1 : 0.65,
                        }}
                        disabled={!canChangePaymentMethod}
                      >
                        <legend style={{ padding: '0 6px', color: '#54667d', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Select a Payment Method
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              border: `1px solid ${effectivePayment?.paymentMethod === 'qrph' ? '#7a0000' : '#e0e4ea'}`,
                              borderRadius: '10px',
                              padding: '10px 12px',
                              backgroundColor: 'white',
                              color: '#15263c',
                              cursor: canChangePaymentMethod ? 'pointer' : 'not-allowed',
                              boxShadow: effectivePayment?.paymentMethod === 'qrph' ? '0 8px 20px rgba(122,0,0,0.12)' : 'none',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Pay Online</span>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="qrph"
                              checked={effectivePayment?.paymentMethod === 'qrph'}
                              onChange={() => {
                                void handleSelectPaymentMethod('qrph');
                              }}
                              disabled={!canChangePaymentMethod}
                              style={{ accentColor: '#7a0000' }}
                            />
                          </label>

                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              border: `1px solid ${effectivePayment?.paymentMethod === 'cash' ? '#7a0000' : '#e0e4ea'}`,
                              borderRadius: '10px',
                              padding: '10px 12px',
                              backgroundColor: 'white',
                              color: '#15263c',
                              cursor: canChangePaymentMethod ? 'pointer' : 'not-allowed',
                              boxShadow: effectivePayment?.paymentMethod === 'cash' ? '0 8px 20px rgba(122,0,0,0.12)' : 'none',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Cash</span>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash"
                              checked={effectivePayment?.paymentMethod === 'cash'}
                              onChange={() => {
                                if (!canChangePaymentMethod) return;
                                setCashConfirmOpen(true);
                              }}
                              disabled={!canChangePaymentMethod}
                              style={{ accentColor: '#7a0000' }}
                            />
                          </label>
                        </div>
                      </fieldset>

                      {isCashLocked && (
                        <div style={{ marginBottom: '10px', color: '#7a5200', fontSize: '12px' }}>
                          Cash payment confirmed. This choice is locked and cannot be changed.
                        </div>
                      )}

                      {effectivePayment?.paymentMethod === 'qrph' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-8" style={{ border: '1px solid #e0e4ea', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                            <div style={{ color: '#15263c', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Upload Payment Proof</div>
                            <div style={{ color: '#54667d', fontSize: '12px', marginBottom: '10px' }}>
                              Upload your payment proof (JPG, JPEG, PNG, or PDF, up to 5MB).
                            </div>
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const f = e.dataTransfer.files?.[0];
                                if (!f || !canModifyPayment) return;
                                handleProofFileSelected(f);
                              }}
                              style={{ border: '1px dashed #c8cfdb', borderRadius: '10px', padding: '12px', marginBottom: '10px', backgroundColor: 'white' }}
                            >
                              <div style={{ color: '#54667d', fontSize: '12px' }}>Drag and drop file here</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={!canModifyPayment || submittingProof}
                                onClick={() => proofInputRef.current?.click()}
                                className="transition-all duration-200"
                                style={{
                                  border: '1px solid #e0e4ea',
                                  borderRadius: '8px',
                                  padding: '8px 14px',
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
                                className="transition-all duration-200"
                                style={{
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px 14px',
                                  background: 'linear-gradient(135deg, #7a0000, #a50000)',
                                  color: 'white',
                                  cursor: !canSubmitSelectedProof || submittingProof ? 'not-allowed' : 'pointer',
                                  opacity: !canSubmitSelectedProof || submittingProof ? 0.6 : 1,
                                  boxShadow: '0 6px 16px rgba(122,0,0,0.25)',
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
                                  className="transition-all duration-200"
                                  style={{ border: '1px solid #e0e4ea', borderRadius: '8px', padding: '8px 12px', backgroundColor: 'white', color: '#15263c', cursor: 'pointer' }}
                                >
                                  Delete File
                                </button>
                              )}
                            </div>
                            <div style={{ marginTop: '8px', color: '#8aa0b8', fontSize: '11px' }}>{proofLabel}</div>
                            {proofValidationError && (
                              <div style={{ marginTop: '6px', color: '#7a0000', fontSize: '11px' }}>{proofValidationError}</div>
                            )}
                            {paymentMessage && (
                              <div style={{ marginTop: '6px', color: paymentMessage.toLowerCase().includes('failed') ? '#7a0000' : '#1a5c1a', fontSize: '11px' }}>
                                {paymentMessage}
                              </div>
                            )}

                            {proofPreviewUrl && hasProofForDelete && (
                              <div style={{ marginTop: '12px', border: '1px solid #e0e4ea', borderRadius: '12px', backgroundColor: 'white', padding: '10px' }}>
                                <div style={{ color: '#54667d', fontSize: '11px', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Proof Preview
                                </div>
                                {isPreviewImage ? (
                                  <img
                                    src={proofPreviewUrl}
                                    alt="Uploaded payment proof preview"
                                    style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e0e4ea' }}
                                  />
                                ) : isPreviewPdf ? (
                                  <iframe
                                    title="Uploaded payment proof preview"
                                    src={proofPreviewUrl}
                                    style={{ width: '100%', height: '260px', border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: 'white' }}
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
                              borderRadius: '12px',
                              overflow: 'hidden',
                              backgroundColor: 'white',
                              alignSelf: 'start',
                              boxShadow: '0 10px 24px rgba(21,38,60,0.08)',
                            }}
                          >
                            <div
                              style={{
                                padding: '12px 14px',
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

                            <div style={{ padding: '12px' }}>
                              <div
                                style={{
                                  border: '1px solid #e0e4ea',
                                  borderRadius: '10px',
                                  padding: '10px',
                                  backgroundColor: '#f8fafc',
                                  display: 'flex',
                                  justifyContent: 'center',
                                }}
                              >
                                <img
                                  src={qrCodeImage}
                                  alt="QR payment code"
                                  style={{ width: '100%', maxWidth: '220px', height: 'auto', borderRadius: '8px' }}
                                />
                              </div>
                              <div style={{ marginTop: '10px', color: '#54667d', fontSize: '11px', lineHeight: 1.5 }}>
                                Scan this code with your e-wallet or banking app, then upload your payment proof.
                              </div>
                            </div>
                          </aside>
                        </div>
                      )}

                      {effectivePayment?.paymentMethod === 'cash' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-8" style={{ border: '1px solid #e0e4ea', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                            <div style={{ color: '#15263c', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                              Cash payment selected
                            </div>
                            <div style={{ color: '#54667d', fontSize: '12px', marginBottom: '12px' }}>
                              Download your receipt and present it at the shop to complete payment.
                            </div>
                            <a
                              href={getCustomerCashReceiptUrl(selectedQuote.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                              style={{ border: '1px solid #e0e4ea', borderRadius: '10px', padding: '10px 14px', color: '#15263c', textDecoration: 'none', backgroundColor: 'white', boxShadow: '0 6px 16px rgba(21,38,60,0.08)' }}
                            >
                              <FileDown size={16} /> Download Cash Receipt PDF
                            </a>
                            <div style={{ marginTop: '12px', color: '#7a5200', fontSize: '12px' }}>
                              Once confirmed, cash payments cannot be switched to online payment.
                            </div>
                          </div>

                          <aside
                            className="lg:col-span-4"
                            style={{ border: '1px solid #e0e4ea', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', alignSelf: 'start', boxShadow: '0 10px 24px rgba(21,38,60,0.08)' }}
                          >
                            <div
                              style={{
                                padding: '12px 14px',
                                background: 'linear-gradient(135deg, #15263c, #1e3655)',
                                color: 'white',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                fontSize: '11px',
                              }}
                            >
                              Cash Payment Guide
                            </div>
                            <div style={{ padding: '12px', color: '#54667d', fontSize: '12px', lineHeight: 1.6 }}>
                              <ol style={{ paddingLeft: '16px', margin: 0 }}>
                                <li>Download or print your receipt PDF.</li>
                                <li>Visit the ERMEL shop and pay in cash.</li>
                                <li>Complete payment within 3 days to avoid expiration.</li>
                                <li>Wait for admin approval and track status here.</li>
                              </ol>
                            </div>
                          </aside>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '14px', padding: '22px', boxShadow: '0 12px 30px rgba(21,38,60,0.08)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ marginBottom: '12px' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '12px' }}>
                        Admin Remarks History
                      </div>
                      <div style={{ color: '#9ab0c4', fontSize: '12px' }}>Realtime updates enabled</div>
                    </div>

                    {selectedUpdates.length === 0 ? (
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0e4ea', borderRadius: '12px', padding: '16px', color: '#54667d', fontSize: '13px' }}>
                        No admin remarks yet for this quote.
                      </div>
                    ) : (
                      <div style={{ maxHeight: '360px', overflowY: 'auto', paddingLeft: '14px', borderLeft: '2px solid #f0f2f5' }}>
                        <div className="space-y-4">
                          {selectedUpdates.map((u) => {
                            const updateMeta = getStatusMeta(u.status || 'updated');
                            const UpdateIcon = updateMeta.Icon;
                            return (
                              <div key={u.id} style={{ position: 'relative' }}>
                                <span
                                  style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '16px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '999px',
                                    backgroundColor: updateMeta.color,
                                    boxShadow: '0 0 0 4px #f5f7fa',
                                  }}
                                />
                                <div style={{ border: '1px solid #e0e4ea', borderRadius: '12px', padding: '14px', backgroundColor: 'white', boxShadow: '0 6px 16px rgba(21,38,60,0.06)' }}>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ marginBottom: '6px' }}>
                                    <span
                                      className="inline-flex items-center gap-1"
                                      style={{ color: updateMeta.color, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                    >
                                      <UpdateIcon size={12} /> {updateMeta.label}
                                    </span>
                                    <span style={{ color: '#9ab0c4', fontSize: '11px' }}>{formatDate(u.createdAt)}</span>
                                    <span style={{ color: '#54667d', fontSize: '11px' }}>{u.adminName || 'Admin'}</span>
                                  </div>
                                  <div style={{ color: '#15263c', fontSize: '13px', marginBottom: '6px' }}>
                                    {u.adminRemark || 'No remark provided.'}
                                  </div>
                                  <div style={{ color: '#54667d', fontSize: '12px' }}>
                                    Estimated: {formatCurrency(u.estimatedPrice)} | Updated: {formatCurrency(u.updatedPrice)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {cashConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 15, 25, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
            padding: '16px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '520px', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e0e4ea', overflow: 'hidden', boxShadow: '0 18px 40px rgba(21,38,60,0.3)' }}>
            <div
              style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, #15263c, #1e3655)',
                color: 'white',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '12px',
              }}
            >
              Confirm Cash Payment
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ color: '#54667d', fontSize: '13px', marginBottom: '12px' }}>
                Are you sure you want to proceed with cash payment? You will need to pay in person using your receipt PDF.
              </div>
              <div style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c04066', borderRadius: '10px', padding: '12px', color: '#7a5200', fontSize: '12px' }}>
                Once confirmed, you cannot switch to online payment for this quote.
              </div>
              <div className="flex items-center justify-end gap-2" style={{ marginTop: '16px' }}>
                <button
                  onClick={() => setCashConfirmOpen(false)}
                  disabled={cashConfirmBusy}
                  style={{ border: '1px solid #e0e4ea', borderRadius: '10px', padding: '8px 14px', backgroundColor: 'white', color: '#15263c', cursor: cashConfirmBusy ? 'not-allowed' : 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCashMethod}
                  disabled={cashConfirmBusy}
                  style={{ border: 'none', borderRadius: '10px', padding: '8px 14px', backgroundColor: '#7a0000', color: 'white', cursor: cashConfirmBusy ? 'not-allowed' : 'pointer', opacity: cashConfirmBusy ? 0.6 : 1, boxShadow: '0 8px 18px rgba(122,0,0,0.35)' }}
                >
                  {cashConfirmBusy ? 'Confirming...' : 'Confirm Cash Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            borderRadius: '12px',
            border: '1px solid #144714',
            boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
            padding: '12px 16px',
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
