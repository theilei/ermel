// ============================================================
// Admin Quotation Approval Page
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Filter, Eye, CheckCircle, XCircle, FileText,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useQuotes } from '../../context/QuoteContext';
import type { Quote, QuoteStatus } from '../../types/quotation';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../../types/quotation';
import * as api from '../../services/api';
import { supabase } from '../../services/supabaseClient';

const ITEMS_PER_PAGE = 10;

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'approved', label: 'Approved' },
];

export default function QuotationApproval() {
  const navigate = useNavigate();
  const { quotes, approveQuote, rejectQuote } = useQuotes();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<Quote[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectModalQuoteId, setRejectModalQuoteId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchQuotes({
        search: search.trim() || undefined,
        status: statusFilter,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setRows(Array.isArray(data.quotes) ? data.quotes : []);
      setTotalItems(data.pagination?.totalItems || 0);
      setTotalPages(Math.max(1, data.pagination?.totalPages || 1));
      setError('');
    } catch (err: any) {
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(err?.message || 'Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const channel = client
      .channel('admin-quotation-approval-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, () => loadPage())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, () => loadPage())
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [loadPage]);

  const canApprove = (status: QuoteStatus) => status === 'pending' || status === 'draft';
  const canReject = (status: QuoteStatus) => status === 'pending' || status === 'draft' || status === 'approved';

  const handleApprove = (id: string) => {
    approveQuote(id);
    setTimeout(() => {
      loadPage();
    }, 120);
  };

  const handleRejectConfirm = () => {
    if (rejectModalQuoteId && rejectReason.trim()) {
      rejectQuote(rejectModalQuoteId, rejectReason.trim());
      setRejectModalQuoteId(null);
      setRejectReason('');
      setTimeout(() => {
        loadPage();
      }, 120);
    }
  };

  const pendingCount = quotes.filter((q) => q.status === 'pending').length;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
          OPERATIONS
        </div>
        <div className="flex items-center justify-between">
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quotation Approval
          </h1>
          {pendingCount > 0 && (
            <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c04066', borderRadius: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', color: '#7a5200', fontSize: '13px', fontWeight: 700 }}>
                {pendingCount} Pending Review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} color="#9ab0c4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Customer Name or Quote ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              border: '1px solid #e0e4ea',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              backgroundColor: 'white',
              color: '#15263c',
              outline: 'none',
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} color="#54667d" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '10px 32px 10px 12px',
              border: '1px solid #e0e4ea',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              backgroundColor: 'white',
              color: '#15263c',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'auto',
            }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e4ea' }}>
                {['Quote ID', 'Customer Name', 'Project Type', 'Dimensions', 'Color', 'Est. Cost', 'Submitted', 'Status', 'Actions'].map((h) => (
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
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                    Loading quotations...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#7a0000', fontFamily: 'var(--font-body)' }}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontFamily: 'var(--font-body)' }}>
                    No quotes found.
                  </td>
                </tr>
              ) : (
                rows.map((quote) => {
                  const statusColors = QUOTE_STATUS_COLORS[quote.status];
                  return (
                    <tr
                      key={quote.id}
                      style={{ borderBottom: '1px solid #f0f2f5' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafbfc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: '#7a0000', letterSpacing: '0.04em' }}>
                        {quote.id}
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
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                        {quote.color}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: '#15263c' }}>
                        ₱{quote.estimatedCost.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                        {quote.submissionDate}
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
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-1">
                          {/* View / Edit */}
                          <button
                            onClick={() => navigate(`/admin/quotations/${quote.id}`)}
                            title="View / Edit"
                            className="p-1.5 rounded transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f2f5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Eye size={15} color="#54667d" />
                          </button>

                          {/* Approve */}
                          {canApprove(quote.status) && (
                            <button
                              onClick={() => handleApprove(quote.id)}
                              title="Approve"
                              className="p-1.5 rounded transition-colors"
                              style={{ backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f5e9'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <CheckCircle size={15} color="#1a5c1a" />
                            </button>
                          )}

                          {/* Reject */}
                          {canReject(quote.status) && (
                            <button
                              onClick={() => { setRejectModalQuoteId(quote.id); setRejectReason(''); }}
                              title="Reject"
                              className="p-1.5 rounded transition-colors"
                              style={{ backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff0f0'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <XCircle size={15} color="#7a0000" />
                            </button>
                          )}

                          {/* Generate PDF */}
                          <button
                            onClick={() => navigate(`/admin/quotations/${quote.id}?tab=pdf`)}
                            title="Generate Quote PDF"
                            className="p-1.5 rounded transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f2f5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <FileText size={15} color="#54667d" />
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
                className="p-2 rounded transition-colors"
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
                  className="px-3 py-1.5 rounded transition-colors"
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
                className="p-2 rounded transition-colors"
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

      {/* Reject Modal */}
      {rejectModalQuoteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setRejectModalQuoteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '28px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              Reject Quote
            </div>
            <div style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', marginBottom: '20px' }}>
              Please provide a reason for rejecting quote <strong>{rejectModalQuoteId}</strong>. The customer will see this reason in their dashboard.
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e4ea',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                resize: 'vertical',
                outline: 'none',
                color: '#15263c',
                boxSizing: 'border-box',
              }}
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModalQuoteId(null)}
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
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'white',
                  background: rejectReason.trim() ? 'linear-gradient(135deg, #7a0000, #a50000)' : '#ccc',
                  cursor: rejectReason.trim() ? 'pointer' : 'default',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
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
