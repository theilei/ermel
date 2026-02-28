import { createBrowserRouter } from 'react-router';
import { Root } from './components/Root';
import Home from './pages/Home';
import QuotationModule from './pages/QuotationModule';
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
      { path: 'ermel-mgmt-2026', Component: AdminDashboard },
      { path: 'dashboard', Component: CustomerDashboard },
      { path: 'products/glass', Component: GlassProducts },
      { path: 'products/aluminum', Component: AluminumProducts },
    ],
  },
]);