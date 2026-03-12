import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../../styles/auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pwStrength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const errors: string[] = [];
    if (!fullName.trim() || fullName.trim().length < 2) errors.push('Full name is required (minimum 2 characters).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
    if (password.length < 8) errors.push('Password must be at least 8 characters.');
    if (password !== confirmPassword) errors.push('Passwords do not match.');
    if (!acceptedTerms) errors.push('You must accept the Terms and Conditions.');
    if (!acceptedPrivacy) errors.push('You must accept the Privacy Policy.');

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    setSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      acceptedTerms,
      acceptedPrivacy,
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/verification-required', { replace: true });
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-brand">ERMEL GLASS &amp; ALUMINUM</div>
          <h1 className="auth-title">CREATE ACCOUNT</h1>
          <p className="auth-subtitle">
            Sign up to request quotes and track your projects
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maria Santos"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. maria@email.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-pw">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-pw"
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
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
            {password && (
              <>
                <div className="auth-pw-strength">
                  <div
                    className="auth-pw-bar"
                    style={{
                      width: `${pwStrength.percent}%`,
                      backgroundColor: pwStrength.color,
                    }}
                  />
                </div>
                <div className="auth-pw-hint">{pwStrength.label}</div>
              </>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-pw-confirm">Confirm Password</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-pw-confirm"
                type={showConfirmPw ? 'text' : 'password'}
                className={`auth-input${confirmPassword && password !== confirmPassword ? ' error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
              >
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <div className="auth-field-error">Passwords do not match.</div>
            )}
          </div>

          <div className="auth-field" style={{ gap: '12px' }}>
            <div className="auth-checkbox-row">
              <input
                id="reg-terms"
                type="checkbox"
                className="auth-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="reg-terms" className="auth-checkbox-label">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
              </label>
            </div>
            <div className="auth-checkbox-row">
              <input
                id="reg-privacy"
                type="checkbox"
                className="auth-checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <label htmlFor="reg-privacy" className="auth-checkbox-label">
                I accept the <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : (
              <>Create Account <UserPlus size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

// Password strength helper
function getPasswordStrength(pw: string): { percent: number; color: string; label: string } {
  if (!pw) return { percent: 0, color: '#e0e0e0', label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { percent: 20, color: '#d32f2f', label: 'Weak' };
  if (score <= 2) return { percent: 40, color: '#f57c00', label: 'Fair' };
  if (score <= 3) return { percent: 60, color: '#ffc107', label: 'Good' };
  if (score <= 4) return { percent: 80, color: '#66bb6a', label: 'Strong' };
  return { percent: 100, color: '#2e7d32', label: 'Very strong' };
}
