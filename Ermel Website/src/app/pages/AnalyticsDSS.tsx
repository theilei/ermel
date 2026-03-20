import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchAdminAnalyticsSummary } from '../services/api';

interface AnalyticsSummary {
  totalQuotes: number;
  approvalRate: number;
  conversionRate: number;
  monthlyTrends: Array<{ month: string; total: number }>;
}

export default function AnalyticsDSS() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdminAnalyticsSummary()
      .then((data) => {
        if (!active) return;
        setSummary(data);
        setError('');
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || 'Failed to load analytics.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading analytics...</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: '#7a0000' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#15263c', marginBottom: '16px' }}>Analytics</h1>

      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
        <div style={{ background: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#54667d' }}>Total Quotes</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15263c' }}>{summary?.totalQuotes ?? 0}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#54667d' }}>Approval Rate</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15263c' }}>{summary?.approvalRate ?? 0}%</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#54667d' }}>Conversion Rate</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15263c' }}>{summary?.conversionRate ?? 0}%</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '16px', height: '360px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#15263c', marginBottom: '10px' }}>Monthly Quote Trends</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary?.monthlyTrends ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#15263c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
