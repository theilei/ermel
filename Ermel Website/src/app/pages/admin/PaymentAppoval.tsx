import { useMemo, useState } from 'react';
import { Search, CreditCard, CheckCircle2, Clock3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PaymentApproval() {
  const { orders } = useApp();
  const [search, setSearch] = useState('');

  const awaitingApproval = useMemo(
    () => orders.filter((o) => o.paymentUploaded && !o.paid),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = awaitingApproval.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    if (!q) return list;

    return list.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.project.toLowerCase().includes(q)
    );
  }, [awaitingApproval, search]);

  const paidCount = orders.filter((o) => o.paid).length;
  const noProofCount = orders.filter((o) => !o.paymentUploaded).length;

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
          Review customer payment submissions and monitor verification progress.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: '8px', backgroundColor: '#fff8e6' }}>
              <Clock3 size={18} color="#7a5200" />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{awaitingApproval.length}</div>
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
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{paidCount}</div>
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
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '26px', fontWeight: 800 }}>{noProofCount}</div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            No Payment Proof
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
              placeholder="Search by order ID, customer, or project..."
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
                {['Order ID', 'Customer', 'Project', 'Amount', 'Proof', 'Status', 'Created'].map((h) => (
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                    No payment submissions waiting for approval.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '12px 16px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{order.id}</td>
                    <td style={{ padding: '12px 16px', color: '#15263c', fontSize: '13px' }}>{order.customer}</td>
                    <td style={{ padding: '12px 16px', color: '#54667d', fontSize: '13px' }}>{order.project}</td>
                    <td style={{ padding: '12px 16px', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>
                      ₱{(order.approvedCost || order.estimatedCost).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          color: order.paymentUploaded ? '#1a5c1a' : '#7a0000',
                          backgroundColor: order.paymentUploaded ? '#e8f5e9' : '#fff0f0',
                          border: `1px solid ${order.paymentUploaded ? '#1a5c1a44' : '#7a000044'}`,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {order.paymentUploaded ? 'Uploaded' : 'Missing'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          color: order.paid ? '#1a5c1a' : '#7a5200',
                          backgroundColor: order.paid ? '#e8f5e9' : '#fff8e6',
                          border: `1px solid ${order.paid ? '#1a5c1a44' : '#f0c04066'}`,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {order.paid ? 'Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#54667d', fontSize: '13px' }}>
                      {new Date(order.createdDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}