import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../../styles/auth.css';
import BGvideo from '../../assets/VIDEO UI.mp4';

const LOGIN_BG_VIDEO = BGvideo;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      const resolvedRole = result.user?.role;
      if (resolvedRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  return (
    <div 
      className="auth-page relative flex items-center justify-center overflow-hidden" 
      style={{ minHeight: '100vh' }}
    >
      <video
        src={LOGIN_BG_VIDEO}
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(21,38,60,0.88) 0%, rgba(21,38,60,0.55) 60%, rgba(122,0,0,0.3) 100%)' }}
      />

      <div className="auth-card relative z-10">
        <div className="auth-back-row">
          <Link to="/" className="auth-back-btn" aria-label="Back to homepage">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <div className="auth-header">
          <div className="auth-brand">ERMEL GLASS &amp; ALUMINUM</div>
          <h1 className="auth-title">SIGN IN</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your account
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. maria@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : (
              <>Sign In <LogIn size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}