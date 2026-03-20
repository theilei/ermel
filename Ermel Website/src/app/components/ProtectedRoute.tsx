import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route that requires authentication + email verification.
 * - Not logged in → redirect to /login?redirect=<current>
 * - Logged in but unverified → redirect to /verification-required
 * - Logged in + verified → render children
 */
export default function ProtectedRoute({
  children,
  requireVerified = false,
}: {
  children: React.ReactNode;
  requireVerified?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        fontFamily: 'var(--font-body)',
        color: '#54667d',
        fontSize: '15px',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (location.pathname === '/quote' && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (requireVerified && !user.isVerified) {
    return <Navigate to="/verification-required" replace />;
  }

  return <>{children}</>;
}
