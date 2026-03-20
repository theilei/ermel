import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, ChevronDown, User, LogOut, FileText } from 'lucide-react';
import logoImg from '../../assets/e11197c9a69ce4af64c22995e5b9ed17b033f7df.png';
import { useAuth } from '../context/AuthContext';
import { useAccountIdentity } from '../hooks/useAccountIdentity';

export function Header() {
  const { user, logout } = useAuth();
  const account = useAccountIdentity();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close delay ref — prevents flicker when mouse briefly leaves the wrapper
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const openDropdown = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setProductsOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setProductsOpen(false);
      closeTimerRef.current = null;
    }, 80);            // 80 ms grace period
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Services', href: '/#services' },
    { label: 'Projects', href: '/#projects' },
    { label: 'About', href: '/about', isRoute: true },
  ];

  const isActive = (href: string) => location.pathname === href.split('#')[0];
  const isLoggedIn = account.isLoggedIn;
  const isAdmin = user?.role === 'admin';
  const initials = account.initials;
  const displayName = account.fullName;

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header
      style={{
        backgroundColor: '#15263c',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.3s ease',
        padding: scrolled ? '0' : '0',
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between"
        style={{ height: scrolled ? '60px' : '76px', transition: 'height 0.3s ease' }}
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="ERMEL — Go to homepage"
          className="flex items-center gap-3 flex-shrink-0 group"
          style={{ cursor: 'pointer', textDecoration: 'none' }}
          onClick={(e) => {
            // If already on homepage (with or without hash), prevent default
            // Link behaviour (which would no-op) and scroll to top manually.
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              // Clear any hash without a full reload
              if (window.location.hash) {
                window.history.replaceState(null, '', '/');
              }
            } else {
              // Navigating from another page — scroll to top after route change
              window.scrollTo({ top: 0 });
            }
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: scrolled ? '36px' : '44px',
              height: scrolled ? '36px' : '44px',
              transition: 'all 0.3s ease',
            }}
          >
            <img 
              src={logoImg} 
              alt="ERMEL LOGO"
              style={{
                height: '100%', 
                objectFit: 'contain',
                transition: 'all 0.3s ease',
              }}
            />
          </div>
          <div className="hidden sm:block">
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'white',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1,
                fontSize: scrolled ? '18px' : '24px',
                transition: 'all 0.3s ease',
              }}
            >
              ERMEL
            </div>
            <div
              style={{
                color: '#d9d9d9',
                fontSize: scrolled ? '10px' : '11px',
                letterSpacing: '0.12em',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
              }}
            >
              Glass & Aluminum Works
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button
              style={{
                fontFamily: 'var(--font-heading)',
                color: productsOpen ? 'white' : '#d9d9d9',
                fontWeight: 600,
                letterSpacing: '0.08em',
                fontSize: '15px',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'color 0.2s, background-color 0.2s',
                textTransform: 'uppercase',
                backgroundColor: productsOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'white';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = productsOpen ? 'white' : '#d9d9d9';
              }}
            >
              Products
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/*
              Dropdown panel — always mounted, toggled via opacity/visibility/
              pointer-events so the DOM node stays in the wrapper and cannot
              create a hover gap.

              The outer shell has transparent padding-top to bridge the
              physical space between the trigger button and the visible menu.
            */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                paddingTop: '6px',          // bridge — transparent, but captures hover
                zIndex: 999,
                pointerEvents: productsOpen ? 'auto' : 'none',
              }}
            >
              <div
                style={{
                  backgroundColor: '#0f1e30',
                  borderRadius: '8px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  minWidth: '180px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  opacity: productsOpen ? 1 : 0,
                  transform: productsOpen ? 'translateY(0)' : 'translateY(-6px)',
                  transition: 'opacity 0.18s ease, transform 0.18s ease',
                }}
              >
                {[
                  { label: 'Glass', to: '/products/glass' },
                  { label: 'Aluminum', to: '/products/aluminum' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: '#d9d9d9',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      fontSize: '14px',
                      padding: '12px 16px',
                      display: 'block',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.backgroundColor = 'rgba(122,0,0,0.2)';
                      el.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.backgroundColor = 'transparent';
                      el.style.color = '#d9d9d9';
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: location.pathname === link.href ? 'white' : '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '15px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  backgroundColor: location.pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'white';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = location.pathname === link.href ? 'white' : '#d9d9d9';
                  (e.currentTarget as HTMLElement).style.backgroundColor = location.pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent';
                }}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '15px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = 'white';
                  (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = '#d9d9d9';
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {link.label}
              </a>
            )
          )}

        </nav>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            to={isAdmin ? '/admin/dashboard' : '/quote'}
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #7a0000, #a50000)',
              color: 'white',
              fontWeight: 700,
              letterSpacing: '0.06em',
              fontSize: scrolled ? '13px' : '15px',
              padding: scrolled ? '8px 18px' : '10px 22px',
              borderRadius: '8px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 12px rgba(122,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(-1px)';
              el.style.boxShadow = '0 4px 20px rgba(122,0,0,0.55)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = '0 2px 12px rgba(122,0,0,0.4)';
            }}
          >
            {isAdmin ? 'Admin Dashboard' : 'Request a Quote'}
          </Link>

          {isLoggedIn && (
            <div className="relative hidden md:block" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                title="My Account"
                style={{
                  width: scrolled ? '36px' : '40px',
                  height: scrolled ? '36px' : '40px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'linear-gradient(135deg, #0f1e30, #1b3654)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-heading)',
                  fontSize: scrolled ? '12px' : '13px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {initials}
                <span
                  style={{
                    position: 'absolute',
                    width: '9px',
                    height: '9px',
                    borderRadius: '999px',
                    backgroundColor: '#31c36b',
                    border: '1px solid #0f1e30',
                    right: '1px',
                    bottom: '1px',
                  }}
                />
              </button>

              {accountOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: scrolled ? '44px' : '48px',
                    width: '252px',
                    backgroundColor: '#0f1e30',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
                    overflow: 'hidden',
                    zIndex: 1000,
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
                    <div style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700 }}>
                      {displayName}
                    </div>
                    <div style={{ color: '#9ab0c4', fontSize: '12px', marginTop: '2px' }}>
                      {account.email}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setAccountOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#d9d9d9',
                      textDecoration: 'none',
                      padding: '11px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    <User size={15} /> View Profile
                  </Link>

                  {isAdmin ? (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setAccountOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#d9d9d9',
                        textDecoration: 'none',
                        padding: '11px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '12px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      <FileText size={15} /> Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/check-status"
                      onClick={() => setAccountOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#d9d9d9',
                        textDecoration: 'none',
                        padding: '11px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '12px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      <FileText size={15} /> Check My Status
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#ffb2b2',
                      padding: '11px 14px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'white' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: '#0f1e30',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          className="md:hidden px-4 pb-4"
        >
          {/* Products Mobile */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                color: '#d9d9d9',
                fontWeight: 600,
                letterSpacing: '0.08em',
                fontSize: '16px',
                padding: '12px 0',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Products
            </div>
            <div className="pl-4">
              <Link
                to="/products/glass"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#9ab0c4',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  fontSize: '14px',
                  padding: '10px 0',
                  display: 'block',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onClick={() => setMenuOpen(false)}
              >
                Glass
              </Link>
              <Link
                to="/products/aluminum"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#9ab0c4',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  fontSize: '14px',
                  padding: '10px 0',
                  display: 'block',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onClick={() => setMenuOpen(false)}
              >
                Aluminum
              </Link>
            </div>
          </div>
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '16px',
                  padding: '12px 0',
                  display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '16px',
                  padding: '12px 0',
                  display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          )}

          {isLoggedIn && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '8px', paddingTop: '10px' }}>
              <div className="flex items-center gap-3" style={{ padding: '8px 0 12px' }}>
                <div
                  title="My Account"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'linear-gradient(135deg, #0f1e30, #1b3654)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                  <span
                    style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: '#31c36b',
                      border: '1px solid #0f1e30',
                      right: '1px',
                      bottom: '1px',
                    }}
                  />
                </div>
                <div>
                  <div style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700 }}>
                    {displayName}
                  </div>
                    <div style={{ color: '#9ab0c4', fontSize: '12px' }}>{account.email}</div>
                </div>
              </div>

              <Link
                to="/profile"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '14px',
                  padding: '10px 0',
                  display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onClick={() => setMenuOpen(false)}
              >
                View Profile
              </Link>

              <Link
                to={isAdmin ? '/admin/dashboard' : '/check-status'}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '14px',
                  padding: '10px 0',
                  display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
                onClick={() => setMenuOpen(false)}
              >
                {isAdmin ? 'Admin Dashboard' : 'Check My Status'}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'var(--font-heading)',
                  color: '#ffb2b2',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '14px',
                  padding: '10px 0',
                  border: 'none',
                  background: 'transparent',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          )}

        </div>
      )}
    </header>
  );
}