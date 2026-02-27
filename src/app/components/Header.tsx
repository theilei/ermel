import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, ChevronDown } from 'lucide-react';
import logoImage from '../../../logo/Ermel\'s Logo.jpg';

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
        backgroundColor: scrolled ? 'rgba(21, 38, 60, 0.85)' : '#15263c',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.3s ease',
        padding: scrolled ? '0' : '0',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between"
        style={{ height: scrolled ? '60px' : '76px', transition: 'height 0.3s ease' }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <img
            src={logoImage}
            alt="Ermel Glass & Aluminum Works"
            style={{
              width: scrolled ? '40px' : '50px',
              height: scrolled ? '40px' : '50px',
              aspectRatio: '1 / 1',
              borderRadius: '6px',
              objectFit: 'cover',
              objectPosition: 'center',
              transition: 'all 0.3s ease',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
          <div className="hidden sm:flex flex-col justify-center">
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'white',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
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
                lineHeight: 1.2,
                marginTop: '2px',
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
            className="door-opening-btn"
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
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 12px rgba(122,0,0,0.4)',
              whiteSpace: 'nowrap',
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'scale(1.05) translateY(-2px)';
              el.style.boxShadow = '0 6px 25px rgba(122,0,0,0.65)';
              el.style.borderColor = 'rgba(255,255,255,0.4)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'scale(1) translateY(0)';
              el.style.boxShadow = '0 2px 12px rgba(122,0,0,0.4)';
              el.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>Request a Quote</span>
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
