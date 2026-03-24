import { createBrowserRouter } from 'react-router';
import { Root } from './components/Root';
import Home from './pages/Home';
import About from './pages/About';
import QuotationModule from './pages/QuotationModule';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CheckStatus from './pages/CheckStatus';
import Profile from './pages/Profile';
import GlassProducts from './pages/GlassProducts';
import AluminumProducts from './pages/AluminumProducts';
import QuotationApproval from './pages/admin/QuotationApproval';
import QuoteDetails from './pages/admin/QuoteDetails';
import InstallationQueue from './pages/admin/InstallationQueue';
import OrderLogs from './pages/admin/OrderLogs';
import MaterialProcurement from './pages/admin/Materialprocurement';
import AdminSettings from './pages/admin/Adminsettings';
import PaymentAppoval from './pages/admin/PaymentApproval';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import VerifyEmailResult from './pages/VerifyEmailResult';
import VerificationRequired from './pages/VerificationRequired';
import Forbidden from './pages/Forbidden';
import RouteErrorPage from './pages/RouteErrorPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AnalyticsDSS from './pages/AnalyticsDSS';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      {
        path: 'quote',
        element: (
          <ProtectedRoute requireVerified>
            <QuotationModule />
          </ProtectedRoute>
        ),
      },
      { path: 'dashboard', Component: CustomerDashboard },
      {
        path: 'check-status',
        element: (
          <ProtectedRoute>
            <CheckStatus />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { path: 'products/glass', Component: GlassProducts },
      { path: 'products/aluminum', Component: AluminumProducts },
    ],
  },
  { path: '/login', Component: Login },
  { path: '/forgot-password', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
  { path: '/register', Component: Register },
  { path: '/verify-email', Component: VerifyEmailResult },
  { path: '/verification-required', Component: VerificationRequired },
  { path: '/forbidden', Component: Forbidden },
  { path: '/admin/login', Component: AdminLogin },
  {
    path: '/admin',
    errorElement: <RouteErrorPage />,
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'dashboard', Component: AdminDashboard },
      { path: 'analytics', Component: AnalyticsDSS },
      { path: 'price-approval', Component: QuotationApproval },
      { path: 'quotations', Component: QuotationApproval },
      { path: 'quotations/:id', Component: QuoteDetails },
      { path: 'queue', Component: InstallationQueue },
      { path: 'payment-appoval', Component: PaymentAppoval },
      { path: 'logs', Component: OrderLogs },
      { path: 'procurement', Component: MaterialProcurement },
      { path: 'settings', Component: AdminSettings },
    ],
  },
  { path: '*', Component: RouteErrorPage },
]);