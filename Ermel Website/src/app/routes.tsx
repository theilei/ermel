import { createBrowserRouter } from 'react-router';
import { Root } from './components/Root';
import Home from './pages/Home';
import QuotationModule from './pages/QuotationModule';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import GlassProducts from './pages/GlassProducts';
import AluminumProducts from './pages/AluminumProducts';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'quote', Component: QuotationModule },
      { path: 'dashboard', Component: CustomerDashboard },
      { path: 'products/glass', Component: GlassProducts },
      { path: 'products/aluminum', Component: AluminumProducts },
    ],
  },
  { path: '/admin/login', Component: AdminLogin },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'dashboard', Component: AdminDashboard },
      { path: 'quotations', element: <div style={{ padding: '2rem' }}>Quotation Approval - Coming Soon</div> },
      { path: 'queue', element: <div style={{ padding: '2rem' }}>Installation Queue - Coming Soon</div> },
      { path: 'logs', element: <div style={{ padding: '2rem' }}>Order Logs - Coming Soon</div> },
      { path: 'procurement', element: <div style={{ padding: '2rem' }}>Material Procurement - Coming Soon</div> },
      { path: 'settings', element: <div style={{ padding: '2rem' }}>Settings - Coming Soon</div> },
    ],
  },
]);
