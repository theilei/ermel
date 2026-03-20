import { Navigate, useSearchParams } from 'react-router';

// Legacy route kept intentionally for backward compatibility.
// Admin authentication now uses the unified /login endpoint and form.
export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
}
