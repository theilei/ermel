import { Outlet } from 'react-router';
import { Header } from './Header';

export function Root() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Header />
      <Outlet />
    </div>
  );
}
