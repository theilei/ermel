// ============================================================
// Admin Installation Queue Page
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Calendar,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { Quote } from '../../types/quotation';
import { QUOTE_STATUS_COLORS, QUOTE_STATUS_LABELS } from '../../types/quotation';
import * as api from '../../services/api';
import { supabase } from '../../services/supabaseClient';

const ITEMS_PER_PAGE = 10;

export default function InstallationQueue() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchQuotes({
        status: 'converted_to_order',
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
      setTotalItems(data.pagination?.totalItems || 0);
      setTotalPages(Math.max(1, data.pagination?.totalPages || 1));
      setError('');
    } catch (err: any) {
      setQuotes([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(err?.message || 'Failed to load installation queue.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const channel = client
      .channel('admin-installation-queue-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, () => loadPage())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, () => loadPage())
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [loadPage]);

  const scheduledCount = quotes.filter((q) => !!q.reservationDate).length;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
          OPERATIONS
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Installation Queue
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: 'white' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#f3e8ff' }}>
              <Truck size={18} color="#6b21a8" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', color: '#6b21a8', fontSize: '24px', fontWeight: 800 }}>
              {totalItems}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#6b21a8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Converted to Order
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: 'white' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
              <Calendar size={18} color="#0369a1" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', color: '#0369a1', fontSize: '24px', fontWeight: 800 }}>
              {scheduledCount}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#0369a1', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            With Preferred Date
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e4ea' }}>
                {['Quote ID', 'Customer Name', 'Project Type', 'Dimensions', 'Submitted', 'Preferred Date', 'Status'].map((h) => (
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
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                    Loading installation queue...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#7a0000', fontFamily: 'var(--font-body)' }}>
                    {error}
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-3">
                      <Truck size={40} color="#d9d9d9" />
                      <div style={{ color: '#aaa', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase' }}>
                        No converted quotes in queue
                      </div>
                      <div style={{ color: '#aaa', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                        Orders will appear here once quotes are converted.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const statusColors = QUOTE_STATUS_COLORS[quote.status];

                  return (
                    <tr
                      key={quote.id}
                      style={{ borderBottom: '1px solid #f0f2f5' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafbfc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: '#15263c', letterSpacing: '0.04em' }}>
                          {quote.id}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, color: '#15263c' }}>
                        {quote.customerName}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                        {quote.projectType}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {quote.width}cm × {quote.height}cm × {quote.quantity}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {quote.submissionDate}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {quote.reservationDate || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className="px-2 py-1 rounded-md"
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            border: `1px solid ${statusColors.border}`,
                            fontSize: '11px',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {QUOTE_STATUS_LABELS[quote.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f0f2f5' }}>
            <div style={{ fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e4ea',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={14} color="#54667d" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className="px-3 py-1.5 rounded"
                  style={{
                    backgroundColor: p === currentPage ? '#15263c' : 'transparent',
                    color: p === currentPage ? 'white' : '#54667d',
                    border: p === currentPage ? 'none' : '1px solid #e0e4ea',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #e0e4ea',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight size={14} color="#54667d" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
