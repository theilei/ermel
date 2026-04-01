import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useAccountIdentity } from '../hooks/useAccountIdentity';
import { getCsrfToken } from '../services/csrf';

const API_ROOT = (import.meta as any).env?.VITE_API_URL || '/api';

const getPasswordStrength = (password: string) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const baseScore = Object.values(checks).filter(Boolean).length;
  const lengthBonus = password.length >= 12 ? 1 : 0;
  const score = baseScore + lengthBonus;

  if (score <= 2) {
    return { label: 'Weak', color: '#b42318', progress: 25, isStrongEnough: false, checks };
  }

  if (score === 3) {
    return { label: 'Fair', color: '#b54708', progress: 50, isStrongEnough: false, checks };
  }

  if (score === 4) {
    return { label: 'Good', color: '#2e7d32', progress: 75, isStrongEnough: true, checks };
  }

  return { label: 'Strong', color: '#1b5e20', progress: 100, isStrongEnough: true, checks };
};

export default function Profile() {
  const account = useAccountIdentity();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const fullName = account.fullName;
  const email = account.email || 'N/A';

  const onPasswordInput = (key: 'currentPassword' | 'newPassword' | 'confirmNewPassword', value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmitPassword =
    form.newPassword.trim().length > 0 &&
    form.confirmNewPassword.trim().length > 0 &&
    !submittingPassword;

  const hasPasswordMismatch =
    form.newPassword.trim().length > 0 &&
    form.confirmNewPassword.trim().length > 0 &&
    form.newPassword !== form.confirmNewPassword;

  const isPasswordTooShort =
    form.newPassword.trim().length > 0 &&
    form.newPassword.length < 8;

  const isSameAsCurrentPassword =
    form.currentPassword.trim().length > 0 &&
    form.newPassword.trim().length > 0 &&
    form.currentPassword === form.newPassword;

  const passwordStrength = getPasswordStrength(form.newPassword);
  const shouldShowStrength = form.newPassword.trim().length > 0;

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (form.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSubmittingPassword(true);
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_ROOT}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error || 'Unable to update password.');
        return;
      }

      setPasswordSuccess(data.message || 'Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setSubmittingPassword(false);
    }
  };

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

          <div style={{ marginTop: '18px', backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '14px' }}>
            <div className="flex items-start gap-2" style={{ marginBottom: '12px' }}>
              <ShieldCheck size={17} color="#15263c" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <div style={{ color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Change Password
                </div>
                <div style={{ color: '#54667d', fontSize: '13px', marginTop: '2px' }}>
                  Update your account password securely.
                </div>
              </div>
            </div>

            {passwordError && (
              <div style={{ marginBottom: '10px', backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '10px 12px', color: '#721c24', fontSize: '13px' }}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div style={{ marginBottom: '10px', backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '10px 12px', color: '#2e7d32', fontSize: '13px' }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3" noValidate>
              <div>
                <label style={{ display: 'block', color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }} htmlFor="profile-current-password">
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="profile-current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={(e) => onPasswordInput('currentPassword', e.target.value)}
                    autoComplete="current-password"
                    style={{ width: '100%', border: '1px solid #d2dae3', borderRadius: '8px', padding: '10px 44px 10px 12px', fontSize: '14px', color: '#15263c', backgroundColor: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#54667d', cursor: 'pointer' }}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }} htmlFor="profile-new-password">
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="profile-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={(e) => onPasswordInput('newPassword', e.target.value)}
                    autoComplete="new-password"
                    style={{ width: '100%', border: '1px solid #d2dae3', borderRadius: '8px', padding: '10px 44px 10px 12px', fontSize: '14px', color: '#15263c', backgroundColor: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#54667d', cursor: 'pointer' }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {shouldShowStrength && (
                  <div style={{ marginTop: '8px' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                      <span style={{ color: '#54667d', fontSize: '12px', fontWeight: 600 }}>Password Strength</span>
                      <span style={{ color: passwordStrength.color, fontSize: '12px', fontWeight: 700 }}>{passwordStrength.label}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: '#dfe6ee', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${passwordStrength.progress}%`,
                          height: '100%',
                          backgroundColor: passwordStrength.color,
                          transition: 'width 180ms ease, background-color 180ms ease',
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '8px', color: '#54667d', fontSize: '12px' }}>
                      Use at least 8 characters. Add uppercase, lowercase, number, and symbol for better security.
                    </div>
                  </div>
                )}
                {isPasswordTooShort && (
                  <div style={{ marginTop: '6px', color: '#b42318', fontSize: '12px', fontWeight: 600 }}>
                    Password must be at least 8 characters.
                  </div>
                )}
                {isSameAsCurrentPassword && (
                  <div style={{ marginTop: '6px', color: '#b42318', fontSize: '12px', fontWeight: 600 }}>
                    New password must be different from current password.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }} htmlFor="profile-confirm-password">
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="profile-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmNewPassword}
                    onChange={(e) => onPasswordInput('confirmNewPassword', e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={hasPasswordMismatch}
                    style={{ width: '100%', border: '1px solid #d2dae3', borderRadius: '8px', padding: '10px 44px 10px 12px', fontSize: '14px', color: '#15263c', backgroundColor: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#54667d', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {hasPasswordMismatch && (
                  <div style={{ marginTop: '6px', color: '#b42318', fontSize: '12px', fontWeight: 600 }}>
                    New password and confirmation do not match.
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmitPassword || hasPasswordMismatch || isPasswordTooShort || isSameAsCurrentPassword || !form.currentPassword.trim()}
                style={{ marginTop: '4px', border: 'none', borderRadius: '8px', padding: '10px 14px', background: 'linear-gradient(135deg, #7a0000, #a50000)', color: 'white', fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, cursor: canSubmitPassword && !hasPasswordMismatch && !isPasswordTooShort && !isSameAsCurrentPassword && !!form.currentPassword.trim() ? 'pointer' : 'not-allowed', opacity: canSubmitPassword && !hasPasswordMismatch && !isPasswordTooShort && !isSameAsCurrentPassword && !!form.currentPassword.trim() ? 1 : 0.6 }}
              >
                {submittingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
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
