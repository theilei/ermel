import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Header } from './Header';

export function Root() {
  const location = useLocation();

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    sessionStorage.setItem('ermel.last.good.path', fullPath);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Header />
      <ScrollRestoration />
      <Outlet />
    </div>
  );
}
