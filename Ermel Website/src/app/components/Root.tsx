import { Outlet, ScrollRestoration } from 'react-router';
import { Header } from './Header';

export function Root() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Header />
      <ScrollRestoration />
      <Outlet />
    </div>
  );
}
