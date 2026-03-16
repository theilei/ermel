import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../../styles/auth.css';

export default function VerificationRequired() {
  const { user, resendVerification, logout } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // If already verified, redirect to quote
  if (user?.isVerified) {
    navigate('/quote', { replace: true });
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setMessage('');
    setIsError(false);

    const result = await resendVerification();
    setSending(false);

    if (result.success) {
      setMessage('Verification email sent! Please check your inbox.');
      setIsError(false);
    } else {
      setMessage(result.error || 'Failed to send verification email.');
      setIsError(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-icon-circle warning">
          <Mail size={36} color="#f57c00" strokeWidth={2} />
        </div>

        <h1 className="auth-title" style={{ fontSize: '24px' }}>VERIFY YOUR EMAIL</h1>
        <p className="auth-subtitle" style={{ marginBottom: '8px' }}>
          You must verify your email before requesting a quote.
        </p>
        {user && (
          <p style={{ color: '#54667d', fontSize: '13px', marginBottom: '24px' }}>
            We sent a verification link to <strong>{user.email}</strong>
          </p>
        )}

        {message && (
          <div className={isError ? 'auth-error' : 'auth-success'} style={{ marginBottom: '20px' }}>
            {message}
          </div>
        )}

        <button
          onClick={handleResend}
          className="auth-btn-primary"
          disabled={sending}
          style={{ marginBottom: '12px' }}
        >
          {sending ? 'Sending...' : (
            <>Resend Verification Email <RefreshCw size={16} /></>
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <Link to="/" className="auth-btn-secondary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            Back to Home
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#7a0000',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '8px',
            }}
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
