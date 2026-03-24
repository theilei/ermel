import { Link } from 'react-router';
import { Phone, Mail, MapPin, ChevronRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0f1e30', paddingTop: '40px', paddingBottom: '24px' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '8px' }}>
              ERMEL GLASS
            </div>
            <div style={{ color: '#54667d', fontSize: '12px', letterSpacing: '0.12em', marginBottom: '16px' }}>& ALUMINUM WORKS</div>
            <p style={{ color: '#9ab0c4', fontSize: '14px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
              Professional glass and aluminum fabrication and installation services serving residential and commercial clients across the Philippines.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
              Quick Links
            </div>
            {([
              { label: 'Products', href: '/#products', subtext: [{ label: 'Glass', href: '/products/glass' }, { label: 'Aluminum', href: '/products/aluminum' }] },
              { label: 'Services', href: '/#services' },
              { label: 'Projects', href: '/#projects' },
              { label: 'About', href: '/about' },
              { label: 'Request a Quote', href: '/quote' },
              { label: 'Check My Status', href: '/check-status' },
            ] as const).map((link) => {
              const isHash = link.href.startsWith('/#');
              const isProducts = link.label === 'Products';

              return (
                <div key={link.label} style={{ marginBottom: '8px' }}>
                  {isHash ? (
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        const id = link.href.split('#')[1];
                        const el = document.getElementById(id);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          window.history.replaceState(null, '', link.href);
                        }
                      }}
                      className="footer-quick-link"
                      style={{
                        color: '#9ab0c4',
                        fontSize: '14px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-body)',
                        cursor: isProducts ? 'default' : 'pointer',
                        transition: 'color 0.2s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ab0c4'; }}
                    >
                      <ChevronRight size={12} color="#7a0000" />
                      <span
                        style={{ borderBottom: '1px solid transparent', transition: 'border-color 0.2s ease' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'white'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                      >
                        {link.label}
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="footer-quick-link"
                      style={{
                        color: '#9ab0c4',
                        fontSize: '14px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ab0c4'; }}
                    >
                      <ChevronRight size={12} color="#7a0000" />
                      <span
                        style={{ borderBottom: '1px solid transparent', transition: 'border-color 0.2s ease' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'white'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                      >
                        {link.label}
                      </span>
                    </Link>
                  )}

                  {'subtext' in link && link.subtext && (
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '24px', marginTop: '4px', gap: '4px' }}>
                      {link.subtext.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.href}
                          style={{
                            color: '#718096',
                            fontSize: '12px',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
              Contact Us
            </div>
            {[
              { icon: Phone, text: '+63 938 602 0346' },
              { icon: Mail, text: 'info@ermelglass.com' },
              { icon: MapPin, text: '1528 Nicolas Zamora St., Tondo, City of Manila, 1012 Metro Manila, Philippines', subtext: 'Opens at 8:00 AM - 7:00 PM' },
            ].map((c) => (
              <div key={c.text} className="flex items-start gap-3 mb-3">
                <c.icon size={15} color="#7a0000" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span style={{ color: '#9ab0c4', fontSize: '14px', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{c.text}</span>
                  {c.subtext && <div style={{ color: '#54667d', fontSize: '12.5px', fontFamily: 'var(--font-body)', marginTop: '2px' }}>{c.subtext}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
            © 2026 Ermel Glass and Aluminum Works. All rights reserved.
          </span>
          <span style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
            Licensed Fabricator | DTI Registered
          </span>
        </div>
      </div>
    </footer>
  );
}