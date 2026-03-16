import { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';

// Pending quotes for price approval
const INITIAL_QUOTES = [
  { id: 'EGA-2026-015', customer: 'Maria Santos', project: 'Storefront Glass', dimensions: '240cm × 180cm', estimatedCost: 45000, status: 'pending' },
  { id: 'EGA-2026-016', customer: 'Jose Reyes', project: 'Sliding Window', dimensions: '180cm × 120cm', estimatedCost: 28000, status: 'pending' },
  { id: 'EGA-2026-017', customer: 'Ana Cruz', project: 'Glass Partition', dimensions: '300cm × 250cm', estimatedCost: 62000, status: 'pending' },
  { id: 'EGA-2026-018', customer: 'Roberto Lim', project: 'Glass Door', dimensions: '100cm × 220cm', estimatedCost: 38000, status: 'pending' },
  { id: 'EGA-2026-019', customer: 'Linda Garcia', project: 'Office Divider', dimensions: '400cm × 280cm', estimatedCost: 85000, status: 'pending' },
];

export default function PriceApproval() {
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCost, setEditedCost] = useState<number>(0);

  const handleEdit = (id: string, cost: number) => {
    setEditingId(id);
    setEditedCost(cost);
  };

  const handleSave = (id: string) => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, estimatedCost: editedCost } : q));
    setEditingId(null);
  };

  const handleApprove = (id: string) => {
    setQuotes(quotes.filter(q => q.id !== id));
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
                {quotes.length} pending quotations awaiting review
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
                {quotes.map((quote) => {
                  const isEditing = editingId === quote.id;

                  return (
                    <tr key={quote.id} style={{ borderBottom: '1px solid #e0e4ea' }}>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>
                          {quote.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-body)', color: '#15263c', fontSize: '14px' }}>
                          {quote.customer}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>
                          {quote.project}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span style={{ fontFamily: 'var(--font-body)', color: '#54667d', fontSize: '13px' }}>
                          {quote.dimensions}
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
        </div>
      </div>
    </div>
  );
}