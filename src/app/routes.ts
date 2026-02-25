import { createBrowserRouter } from 'react-router';
import { Root } from './components/Root';
import Home from './pages/Home';
import QuotationModule from './pages/QuotationModule';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'quote', Component: QuotationModule },
      { path: 'admin', Component: AdminDashboard },
      { path: 'dashboard', Component: CustomerDashboard },
    ],
  },
]);
