import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../../styles/auth.css';

type VerifyState = 'loading' | 'success' | 'expired' | 'error';

export default function VerifyEmailResult() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { refreshUser } = useAuth();

  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('No verification token provided.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          setState('success');
          setMessage('Your email has been verified successfully!');
          refreshUser();
        } else if (data.expired) {
          setState('expired');
          setMessage(data.error || 'This verification link has expired.');
        } else {
          setState('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch {
        if (!cancelled) {
          setState('error');
          setMessage('Network error. Please try again.');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token, refreshUser]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {state === 'loading' && (
          <>
            <div className="auth-icon-circle warning">
              <Clock size={36} color="#f57c00" strokeWidth={2} />
            </div>
            <h1 className="auth-title" style={{ fontSize: '24px' }}>VERIFYING...</h1>
            <p className="auth-subtitle">Please wait while we verify your email.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="auth-icon-circle success">
              <CheckCircle size={36} color="#2e7d32" strokeWidth={2} />
            </div>
            <h1 className="auth-title" style={{ fontSize: '24px' }}>EMAIL VERIFIED!</h1>
            <p className="auth-subtitle" style={{ marginBottom: '28px' }}>{message}</p>
            <Link to="/quote" className="auth-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Request a Quote
            </Link>
            <div className="auth-footer">
              Or go to <Link to="/">Home</Link>
            </div>
          </>
        )}

        {state === 'expired' && (
          <>
            <div className="auth-icon-circle warning">
              <Clock size={36} color="#f57c00" strokeWidth={2} />
            </div>
            <h1 className="auth-title" style={{ fontSize: '24px' }}>LINK EXPIRED</h1>
            <p className="auth-subtitle" style={{ marginBottom: '28px' }}>{message}</p>
            <Link to="/verification-required" className="auth-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}>
              Resend Verification Email
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="auth-icon-circle error">
              <XCircle size={36} color="#d32f2f" strokeWidth={2} />
            </div>
            <h1 className="auth-title" style={{ fontSize: '24px' }}>VERIFICATION FAILED</h1>
            <p className="auth-subtitle" style={{ marginBottom: '28px' }}>{message}</p>
            <Link to="/login" className="auth-btn-dark" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}>
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
