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
import PriceApproval from './pages/admin/PriceApproval';
import OrderLogs from './pages/admin/OrderLogs';
import MaterialProcurement from './pages/admin/MaterialProcurement';
import AdminSettings from './pages/admin/AdminSettings';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmailResult from './pages/VerifyEmailResult';
import VerificationRequired from './pages/VerificationRequired';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      {
        path: 'quote',
        element: (
          <ProtectedRoute>
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
  { path: '/register', Component: Register },
  { path: '/verify-email', Component: VerifyEmailResult },
  { path: '/verification-required', Component: VerificationRequired },
  { path: '/admin/login', Component: AdminLogin },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'dashboard', Component: AdminDashboard },
      { path: 'price-approval', Component: PriceApproval },
      { path: 'quotations', Component: QuotationApproval },
      { path: 'quotations/:id', Component: QuoteDetails },
      { path: 'queue', Component: InstallationQueue },
      { path: 'logs', Component: OrderLogs },
      { path: 'procurement', Component: MaterialProcurement },
      { path: 'settings', Component: AdminSettings },
    ],
  },
]);