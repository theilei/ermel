import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, ChevronDown } from 'lucide-react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Products', href: '/#products' },
    { label: 'Services', href: '/#services' },
    { label: 'Projects', href: '/#projects' },
  ];

  const isActive = (href: string) => location.pathname === href.split('#')[0];

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
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: scrolled ? '36px' : '44px',
              height: scrolled ? '36px' : '44px',
              background: 'linear-gradient(135deg, #7a0000, #b30000)',
              transition: 'all 0.3s ease',
            }}
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              style={{ width: scrolled ? '22px' : '28px', height: scrolled ? '22px' : '28px', transition: 'all 0.3s ease' }}
            >
              <rect x="4" y="4" width="24" height="24" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
              <line x1="4" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1.5" />
              <line x1="14" y1="4" x2="14" y2="28" stroke="white" strokeWidth="1.5" />
              <circle cx="9" cy="9" r="2" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'white',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1,
                fontSize: scrolled ? '15px' : '18px',
                transition: 'all 0.3s ease',
              }}
            >
              ERMEL GLASS
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
              & Aluminum Works
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
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
          ))}
          <Link
            to="/admin"
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#54667d',
              fontWeight: 600,
              letterSpacing: '0.08em',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s',
              textDecoration: 'none',
              textTransform: 'uppercase',
              border: '1px solid rgba(84,102,125,0.3)',
              marginLeft: '4px',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.color = '#8ba5c2';
              el.style.borderColor = 'rgba(84,102,125,0.6)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.color = '#54667d';
              el.style.borderColor = 'rgba(84,102,125,0.3)';
            }}
          >
            Admin
          </Link>
        </nav>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            to="/quote"
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
            Request a Quote
          </Link>

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
          {navLinks.map((link) => (
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
          ))}
          <Link
            to="/admin"
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#54667d',
              fontWeight: 600,
              letterSpacing: '0.08em',
              fontSize: '14px',
              padding: '12px 0',
              display: 'block',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
            onClick={() => setMenuOpen(false)}
          >
            Admin Portal
          </Link>
          <Link
            to="/dashboard"
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#54667d',
              fontWeight: 600,
              letterSpacing: '0.08em',
              fontSize: '14px',
              padding: '8px 0',
              display: 'block',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
            onClick={() => setMenuOpen(false)}
          >
            My Projects
          </Link>
        </div>
      )}
    </header>
  );
}
