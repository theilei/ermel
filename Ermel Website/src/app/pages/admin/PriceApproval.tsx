import { useState, useEffect, useCallback } from 'react';
import { Edit2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import { useQuotes } from '../../context/QuoteContext';
import type { Quote } from '../../types/quotation';

const ITEMS_PER_PAGE = 10;

export default function PriceApproval() {
  const { updateQuote, approveQuote } = useQuotes();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCost, setEditedCost] = useState<number>(0);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchQuotes({ status: 'pending', page: currentPage, limit: ITEMS_PER_PAGE });
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
      setTotalItems(data.pagination?.totalItems || 0);
      setTotalPages(Math.max(1, data.pagination?.totalPages || 1));
      setError('');
    } catch (err: any) {
      setQuotes([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(err?.message || 'Failed to load pending quotations.');
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
      .channel('admin-price-approval-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qq_quotes' }, () => loadPage())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'qq_quotes' }, () => loadPage())
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [loadPage]);

  const handleEdit = (id: string, cost: number) => {
    setEditingId(id);
    setEditedCost(cost);
  };

  const handleSave = async (id: string) => {
    await updateQuote(id, { estimatedCost: editedCost });
    setEditingId(null);
    await loadPage();
  };

  const handleApprove = async (id: string) => {
    await approveQuote(id);
    setTimeout(() => {
      loadPage();
    }, 120);
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100%', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="p-6" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Price Approval Queue
              </div>
              <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
                {totalItems} pending quotations awaiting review
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e4ea' }}>
                  <th className="text-left py-3 px-4" style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quote ID
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Customer
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Project
                  </th>
                  <th className="text-left py-3 px-4" style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Dimensions
                  </th>
                  <th className="text-right py-3 px-4" style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Estimated Cost
                  </th>
                  <th className="text-center py-3 px-4" style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center" style={{ color: '#54667d', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                      Loading pending quotations...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center" style={{ color: '#7a0000', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && quotes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center" style={{ color: '#54667d', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                      No pending quotations.
                    </td>
                  </tr>
                )}
                {quotes.map((quote) => {
                  const isEditing = editingId === quote.id;
                  const customerName = (quote as any).customerName || (quote as any).customer || 'N/A';
                  const projectType = (quote as any).projectType || (quote as any).project || 'N/A';
                  const dimensions =
                    typeof (quote as any).dimensions === 'string' && (quote as any).dimensions.trim().length > 0
                      ? (quote as any).dimensions
                      : `${quote.width}cm × ${quote.height}cm × ${quote.quantity}`;

                  return (
                    <tr key={quote.id} style={{ borderBottom: '1px solid #e0e4ea' }}>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>
                          {quote.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '14px' }}>
                          {customerName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>
                          {projectType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>
                          {dimensions}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedCost}
                            onChange={(e) => setEditedCost(Number(e.target.value))}
                            className="px-2 py-1 border rounded"
                            style={{ width: '100px', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}
                          />
                        ) : (
                          <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700 }}>
                            ₱{quote.estimatedCost.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(quote.id)}
                                className="px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                                style={{ backgroundColor: '#1a5c1a', color: 'white', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                              >
                                <Save size={14} />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                                style={{ backgroundColor: '#54667d', color: 'white', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(quote.id, quote.estimatedCost)}
                                className="px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                                style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', color: '#15263c', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleApprove(quote.id)}
                                className="px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                                style={{ backgroundColor: '#1a5c1a', color: 'white', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                              >
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-4">
              <div style={{ fontSize: '13px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded"
                  style={{ border: '1px solid #e0e4ea', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'default' : 'pointer' }}
                >
                  <ChevronLeft size={14} color="#54667d" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="px-3 py-1.5 rounded"
                    style={{
                      border: page === currentPage ? 'none' : '1px solid #e0e4ea',
                      backgroundColor: page === currentPage ? '#15263c' : 'white',
                      color: page === currentPage ? 'white' : '#54667d',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded"
                  style={{ border: '1px solid #e0e4ea', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'default' : 'pointer' }}
                >
                  <ChevronRight size={14} color="#54667d" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}