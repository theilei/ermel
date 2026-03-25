import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, User, LogOut, FileText, ChevronDown } from 'lucide-react';
import logoImg from '../../assets/e11197c9a69ce4af64c22995e5b9ed17b033f7df.png';
import { useAuth } from '../context/AuthContext';
import { useAccountIdentity } from '../hooks/useAccountIdentity';

export function Header() {
  const { user, logout } = useAuth();
  const account = useAccountIdentity();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsPinnedOpen, setProductsPinnedOpen] = useState(false);
  const [activeHomeSection, setActiveHomeSection] = useState<'__top__' | 'services' | 'projects'>('__top__');
  const location = useLocation();
  const navigate = useNavigate();

  const accountRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const productsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHomeSectionRef = useRef<string | null>(null);

  const openProductsDropdown = useCallback(() => {
    if (productsCloseTimerRef.current) {
      clearTimeout(productsCloseTimerRef.current);
      productsCloseTimerRef.current = null;
    }
    setProductsOpen(true);
  }, []);

  const closeProductsDropdown = useCallback(() => {
    if (productsPinnedOpen) return;
    if (productsCloseTimerRef.current) {
      clearTimeout(productsCloseTimerRef.current);
    }
    productsCloseTimerRef.current = setTimeout(() => {
      setProductsOpen(false);
      productsCloseTimerRef.current = null;
    }, 160);
  }, [productsPinnedOpen]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }

      if (productsRef.current && !productsRef.current.contains(event.target as Node)) {
        if (productsCloseTimerRef.current) {
          clearTimeout(productsCloseTimerRef.current);
          productsCloseTimerRef.current = null;
        }
        setProductsPinnedOpen(false);
        setProductsOpen(false);
      }

    };

    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      if (productsCloseTimerRef.current) {
        clearTimeout(productsCloseTimerRef.current);
        productsCloseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Services', sectionId: 'services' },
    { label: 'Projects', sectionId: 'projects' },
    { label: 'About', to: '/about' },
  ];

  const isLoggedIn = account.isLoggedIn;
  const isAdmin = user?.role === 'admin';
  const initials = account.initials;
  const displayName = account.fullName;

  const scrollToHomeSection = useCallback((sectionId?: string) => {
    if (!sectionId || sectionId === '__top__') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash) {
        window.history.replaceState(null, '', '/');
      }
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToHomeSection = useCallback((sectionId?: string) => {
    setMenuOpen(false);
    setAccountOpen(false);

    const nextSection = sectionId || '__top__';
    if (location.pathname === '/') {
      scrollToHomeSection(nextSection);
      return;
    }

    pendingHomeSectionRef.current = nextSection;
    navigate('/');
  }, [location.pathname, navigate, scrollToHomeSection]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    if (!pendingHomeSectionRef.current) return;

    const targetSection = pendingHomeSectionRef.current;
    pendingHomeSectionRef.current = null;
    window.requestAnimationFrame(() => {
      scrollToHomeSection(targetSection);
    });
  }, [location.pathname, scrollToHomeSection]);

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveHomeSection('__top__');
      return;
    }

    const sectionOrder: Array<'services' | 'projects'> = ['services', 'projects'];
    const offset = 140;

    const updateActiveSection = () => {
      const probeY = window.scrollY + offset;
      let next: '__top__' | 'services' | 'projects' = '__top__';

      for (const id of sectionOrder) {
        const el = document.getElementById(id);
        if (!el) continue;

        const start = el.offsetTop;
        const end = start + el.offsetHeight;

        if (probeY >= start && probeY < end) {
          next = id;
          break;
        }
      }

      setActiveHomeSection(next);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [location.pathname]);

  const isHomeSectionActive = (sectionId?: string) => {
    if (location.pathname !== '/') return false;
    return activeHomeSection === (sectionId || '__top__');
  };

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
        zIndex: 5000,
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
            e.preventDefault();
            goToHomeSection();
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
                borderRadius: '10%',
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
          <div
            ref={productsRef}
            className="relative"
            onMouseEnter={openProductsDropdown}
            onMouseLeave={closeProductsDropdown}
          >
            <button
              type="button"
              style={{
                fontFamily: 'var(--font-heading)',
                color: location.pathname.startsWith('/products') || productsOpen ? 'white' : '#d9d9d9',
                fontWeight: 600,
                letterSpacing: '0.08em',
                fontSize: '15px',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                backgroundColor: location.pathname.startsWith('/products') || productsOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => {
                setProductsPinnedOpen((v) => {
                  const next = !v;
                  setProductsOpen(next);
                  return next;
                });
                setMenuOpen(false);
                setAccountOpen(false);
              }}
            >
              Products
              <ChevronDown
                size={14}
                style={{
                  transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {productsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  minWidth: '180px',
                  backgroundColor: '#0f1e30',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 26px rgba(0,0,0,0.35)',
                  overflow: 'hidden',
                  zIndex: 900,
                }}
                onMouseEnter={openProductsDropdown}
                onMouseLeave={closeProductsDropdown}
              >
                <Link
                  to="/products/glass"
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: location.pathname === '/products/glass' ? 'white' : '#d9d9d9',
                    backgroundColor: location.pathname === '/products/glass' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}
                  onClick={() => {
                    setProductsPinnedOpen(false);
                    setProductsOpen(false);
                    setMenuOpen(false);
                    setAccountOpen(false);
                  }}
                >
                  Glass
                </Link>
                <Link
                  to="/products/aluminum"
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: location.pathname === '/products/aluminum' ? 'white' : '#d9d9d9',
                    backgroundColor: location.pathname === '/products/aluminum' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onClick={() => {
                    setProductsPinnedOpen(false);
                    setProductsOpen(false);
                    setMenuOpen(false);
                    setAccountOpen(false);
                  }}
                >
                  Aluminum
                </Link>
              </div>
            )}
          </div>
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: location.pathname === link.to ? 'white' : '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '15px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  backgroundColor: location.pathname === link.to ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
                onClick={() => {
                  setMenuOpen(false);
                  setProductsPinnedOpen(false);
                  setProductsOpen(false);
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'white';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = location.pathname === link.to ? 'white' : '#d9d9d9';
                  (e.currentTarget as HTMLElement).style.backgroundColor = location.pathname === link.to ? 'rgba(255,255,255,0.08)' : 'transparent';
                }}
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                type="button"
                data-active={isHomeSectionActive(link.sectionId)}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: isHomeSectionActive(link.sectionId) ? 'white' : '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '15px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  background: isHomeSectionActive(link.sectionId) ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => goToHomeSection(link.sectionId)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'white';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  const active = (e.currentTarget as HTMLElement).getAttribute('data-active') === 'true';
                  (e.currentTarget as HTMLElement).style.color = active ? 'white' : '#d9d9d9';
                  (e.currentTarget as HTMLElement).style.backgroundColor = active ? 'rgba(255,255,255,0.08)' : 'transparent';
                }}
              >
                {link.label}
              </button>
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
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: location.pathname === link.to ? 'white' : '#d9d9d9',
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
              <button
                key={link.label}
                type="button"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: isHomeSectionActive(link.sectionId) ? 'white' : '#d9d9d9',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  fontSize: '16px',
                  padding: '12px 0',
                  display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textTransform: 'uppercase',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                }}
                onClick={() => goToHomeSection(link.sectionId)}
              >
                {link.label}
              </button>
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