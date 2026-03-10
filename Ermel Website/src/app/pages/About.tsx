import { Link } from 'react-router';
import { Shield, Clock, Award, CheckCircle2, ArrowRight, MapPin, Phone, Mail, Users, Target, Eye, ChevronRight } from 'lucide-react';

const stats = [
  { value: '500+', label: 'Projects Completed' },
  { value: '7+', label: 'Years Experience' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '48hr', label: 'Quote Turnaround' },
];

const whyUs = [
  { icon: Shield, title: 'Quality Guaranteed', desc: 'We use only premium-grade aluminum profiles and certified tempered glass meeting Philippine standards.' },
  { icon: Clock, title: 'On-Time Delivery', desc: 'Strict project timelines with real-time tracking so you always know your project status.' },
  { icon: Award, title: 'Expert Craftsmanship', desc: 'Our fabrication team has over a decade of hands-on experience with precision metalwork.' },
  { icon: CheckCircle2, title: 'Transparent Pricing', desc: 'Detailed itemized quotes with no hidden charges. All costs are approved before work begins.' },
];

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'To deliver precision-crafted glass and aluminum solutions that exceed client expectations — on time, every time, without compromise on quality.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    desc: 'To be the most trusted fabrication and installation partner for residential and commercial clients across the Philippines.',
  },
  {
    icon: Users,
    title: 'Our Team',
    desc: 'A dedicated crew of skilled fabricators, installers, and project coordinators who take pride in every cut, weld, and finish.',
  },
];

export default function About() {
  return (
    <div style={{ backgroundColor: '#fafafa', fontFamily: 'var(--font-body)' }}>

      {/* ── Hero ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          minHeight: '420px',
          paddingTop: '76px',
          background: 'linear-gradient(135deg, #0f1e30 0%, #15263c 60%, #1e3655 100%)',
        }}
      >
        {/* decorative radial accents */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(122,0,0,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,139,87,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(122,0,0,0.2)', border: '1px solid rgba(122,0,0,0.4)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff8888' }} />
            <span style={{ color: '#ffcccc', fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '0.1em' }}>
              FAMILY-OWNED · MANILA-BASED
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'white',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '0.02em',
              marginBottom: '20px',
              textTransform: 'uppercase',
            }}
          >
            ABOUT <span style={{ color: '#ff6666' }}>ERMEL</span>
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 'clamp(15px, 2vw, 18px)',
              maxWidth: '580px',
              margin: '0 auto',
              lineHeight: 1.7,
              fontFamily: 'var(--font-body)',
            }}
          >
            More than a decade of precision glass and aluminum fabrication — built on trust, craftsmanship, and a relentless commitment to quality.
          </p>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{ backgroundColor: '#15263c' }} className="py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div style={{ fontFamily: 'var(--font-heading)', color: '#ff6666', fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ color: '#d9d9d9', fontSize: '13px', letterSpacing: '0.1em', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Text */}
            <div>
              <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
                WHO WE ARE
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#15263c',
                  fontSize: 'clamp(26px, 4vw, 40px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                OUR STORY
              </h2>
              <div className="w-14 h-1 rounded mb-8" style={{ backgroundColor: '#7a0000' }} />

              <p style={{ color: '#3a4a5c', fontSize: '16px', lineHeight: 1.8, fontFamily: 'var(--font-body)', marginBottom: '16px' }}>
                Ermel Glass &amp; Aluminum Works was founded on a simple belief: that every home and business deserves top-quality glass and aluminum work — delivered with honesty and precision.
              </p>
              <p style={{ color: '#54667d', fontSize: '15px', lineHeight: 1.8, fontFamily: 'var(--font-body)', marginBottom: '16px' }}>
                Based in Tondo, Manila, we started as a small workshop serving local homeowners. Over the years, our reputation for clean welds, accurate measurements, and on-schedule delivery grew us into a trusted partner for commercial fit-outs and large-scale installations across Metro Manila.
              </p>
              <p style={{ color: '#54667d', fontSize: '15px', lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>
                Today, Ermel continues to be a proudly family-run operation — with the same attention to detail and personal service we started with, backed by modern tools and an experienced team.
              </p>
            </div>

            {/* Visual card panel */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Founded', value: '2017', sub: 'Tondo, Manila' },
                { label: 'Employees', value: '25+', sub: 'Skilled craftsmen' },
                { label: 'Specialization', value: 'Glass & Aluminum', sub: 'Works' },
                { label: 'Service Area', value: 'Metro', sub: 'Manila & Luzon' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-6 rounded-xl"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 2px 12px rgba(21,38,60,0.06)',
                  }}
                >
                  <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>
                    {item.value}
                  </div>
                  <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission / Vision / Team ── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              WHAT DRIVES US
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
              MISSION, VISION &amp; PEOPLE
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded" style={{ backgroundColor: '#7a0000' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="p-8 rounded-xl group transition-all duration-200"
                style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '10px' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#15263c';
                  el.style.boxShadow = '0 8px 32px rgba(21,38,60,0.12)';
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#d9d9d9';
                  el.style.boxShadow = 'none';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#15263c' }}
                >
                  <v.icon size={24} color="white" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase' }}>
                  {v.title}
                </h3>
                <p style={{ color: '#54667d', fontSize: '14px', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Ermel ── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#15263c' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div style={{ color: '#ff8888', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              OUR ADVANTAGE
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
              WHY CHOOSE ERMEL?
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded" style={{ backgroundColor: '#7a0000' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((w) => (
              <div
                key={w.title}
                className="p-6 rounded-xl transition-all duration-200"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.backgroundColor = 'rgba(122,0,0,0.12)';
                  el.style.borderColor = 'rgba(122,0,0,0.35)';
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  el.style.borderColor = 'rgba(255,255,255,0.08)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(122,0,0,0.3)', border: '1px solid rgba(122,0,0,0.4)' }}
                >
                  <w.icon size={22} color="#ff8888" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '19px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                  {w.title}
                </h3>
                <p style={{ color: '#9ab0c4', fontSize: '14px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / Location strip ── */}
      <section className="py-16 px-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              REACH US
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
              GET IN TOUCH
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded" style={{ backgroundColor: '#7a0000' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Phone, label: 'Phone', value: '+63 938 602 0346', sub: 'Mon – Sat, 8AM – 7PM' },
              { icon: Mail, label: 'Email', value: 'info@ermelglass.com', sub: 'We reply within 24 hours' },
              { icon: MapPin, label: 'Address', value: '1528 Nicolas Zamora St.', sub: 'Tondo, City of Manila, 1012' },
            ].map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-4 p-6 rounded-xl"
                style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 2px 12px rgba(21,38,60,0.05)' }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#15263c' }}
                >
                  <c.icon size={18} color="white" />
                </div>
                <div>
                  <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {c.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '15px', fontWeight: 700 }}>
                    {c.value}
                  </div>
                  <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                    {c.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
                { label: 'Track My Order', href: '/dashboard' },
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
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#9ab0c4';
                        }}
                      >
                        <ChevronRight size={12} color="#7a0000" /> <span style={{ borderBottom: '1px solid transparent', transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'white'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}>{link.label}</span>
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
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#9ab0c4';
                        }}
                      >
                        <ChevronRight size={12} color="#7a0000" /> <span style={{ borderBottom: '1px solid transparent', transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'white'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}>{link.label}</span>
                      </Link>
                    )}

                    {link.subtext && (
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
    </div>
  );
}