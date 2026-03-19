import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Bell, FileDown, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import {
  fetchCheckStatusQuotes,
  fetchNotifications,
  fetchQuoteUpdates,
  getCustomerQuotePDFUrl,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import type { Quote, QuoteUpdate, SystemNotification } from '../types/quotation';

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
  return '#15263c';
}

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
  const [adminBlocked, setAdminBlocked] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('ermel_admin_token');
    if (adminToken) setAdminBlocked(true);
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
  }, [selectedQuoteId, loadUpdates, updatesByQuote]);

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
      client.removeChannel(notifChannel);
    };
  }, [loadNotifications, loadQuotes, loadUpdates, selectedQuoteId, user]);

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

  if (adminBlocked) {
    return <Navigate to="/admin/dashboard" replace />;
  }

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
                        <div style={{ color: statusColor(q.status), fontSize: '13px', marginTop: '3px', textTransform: 'lowercase' }}>{q.status}</div>
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
                      <div style={{ marginTop: '4px', color: statusColor(latestStatus), fontWeight: 800, textTransform: 'lowercase', fontSize: '20px' }}>
                        {latestStatus || 'pending'}
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
                              <span style={{ color: statusColor(u.status), fontSize: '12px', fontWeight: 700, textTransform: 'lowercase' }}>{u.status || 'updated'}</span>
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
    </div>
  );
}
