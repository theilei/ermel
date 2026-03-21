import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Mail } from 'lucide-react';
import { getCsrfToken } from '../services/csrf';
import '../../styles/auth.css';

const API_ROOT = (import.meta as any).env?.VITE_API_URL || '/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setSubmitting(true);
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_ROOT}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Unable to process your request right now.');
        return;
      }

      setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
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
          <h1 className="auth-title">FORGOT PASSWORD</h1>
          <p className="auth-subtitle">Enter your account email and we will send a reset link.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. maria@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <button type="submit" className="auth-btn-primary" disabled={submitting}>
            {submitting ? 'Sending reset link...' : <>Send Reset Link <Mail size={18} /></>}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
