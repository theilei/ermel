import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { getCsrfToken } from '../services/csrf';
import '../../styles/auth.css';

const API_ROOT = (import.meta as any).env?.VITE_API_URL || '/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      if (!token) {
        if (active) {
          setTokenValid(false);
          setError('Missing reset token.');
          setVerifyingToken(false);
        }
        return;
      }

      try {
        const res = await fetch(`${API_ROOT}/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (!res.ok || !data.valid) {
          setTokenValid(false);
          setError(data.error || 'Reset link is invalid or has expired.');
          setVerifyingToken(false);
          return;
        }

        setTokenValid(true);
        setError('');
      } catch {
        if (!active) return;
        setTokenValid(false);
        setError('Unable to verify reset link right now.');
      } finally {
        if (active) {
          setVerifyingToken(false);
        }
      }
    }

    verifyToken();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmNewPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_ROOT}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword, confirmNewPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Unable to reset password.');
        return;
      }

      setSuccess(data.message || 'Password reset successful. Please sign in with your new password.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-back-row">
          <Link to="/login" className="auth-back-btn" aria-label="Back to login">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        <div className="auth-header">
          <div className="auth-brand">ERMEL GLASS &amp; ALUMINUM</div>
          <h1 className="auth-title">RESET PASSWORD</h1>
          <p className="auth-subtitle">Create a new password for your account.</p>
        </div>

        {verifyingToken && <div className="auth-success">Verifying reset link...</div>}
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {!verifyingToken && tokenValid && !success && (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-new-password">New Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowNewPassword((value) => !value)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-confirm-password">Confirm New Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`auth-input${confirmNewPassword && newPassword !== confirmNewPassword ? ' error' : ''}`}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={submitting}>
              {submitting ? 'Resetting password...' : <>Reset Password <KeyRound size={18} /></>}
            </button>
          </form>
        )}

        {!verifyingToken && !tokenValid && (
          <div className="auth-footer">
            Need a new reset link? <Link to="/forgot-password">Request one</Link>
          </div>
        )}
      </div>
    </div>
  );
}
