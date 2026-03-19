import { Link } from 'react-router';
import { ShieldCheck, UserCircle2 } from 'lucide-react';
import { useAccountIdentity } from '../hooks/useAccountIdentity';

export default function Profile() {
  const account = useAccountIdentity();

  const fullName = account.fullName;
  const email = account.email || 'N/A';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingTop: '96px', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
            Account
          </div>
          <h1 style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 34px)', textTransform: 'uppercase', fontWeight: 800, lineHeight: 1.1 }}>
            My Profile
          </h1>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '10px', padding: '20px' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '18px' }}>
            <UserCircle2 size={24} color="#15263c" />
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '13px' }}>
              Profile Information
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#9ab0c4', fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '4px' }}>
                Full Name
              </div>
              <div style={{ color: '#15263c', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>
                {fullName}
              </div>
            </div>

            <div style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#9ab0c4', fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '4px' }}>
                Email Address
              </div>
              <div style={{ color: '#15263c', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>
                {email}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px', backgroundColor: '#e8ecf0', border: '1px solid #d2dae3', borderRadius: '8px', padding: '12px' }}>
            <div className="flex items-start gap-2">
              <ShieldCheck size={17} color="#15263c" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <div style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Change Password
                </div>
                <div style={{ color: '#54667d', fontSize: '13px', marginTop: '2px' }}>
                  Password management UI is reserved for backend-supported account settings.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <Link
              to="/check-status"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 14px',
                textDecoration: 'none',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Go To Check My Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
