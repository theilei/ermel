import { Link } from 'react-router';
import { ArrowRight, Shield, Clock, Award, ChevronRight, Phone, Mail, MapPin, CheckCircle2, Wrench, Layers, Building2, Square, DoorOpen, LayoutPanelLeft, Frame, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useEffect } from 'react';
import logoImage from '../../../logo/Ermel\'s Logo.jpg';

const GLASS_INSTALLATION_IMG = 'https://images.unsplash.com/photo-1761227390482-bccb032eeea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMHdpbmRvdyUyMGluc3RhbGxhdGlvbiUyMGNvbnN0cnVjdGlvbnxlbnwxfHx8fDE3NzE5OTMyOTF8MA&ixlib=rb-4.1.0&q=80&w=1080';
const PARTITION_IMG = 'https://images.unsplash.com/photo-1770993151375-0dee97eda931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBnbGFzcyUyMHBhcnRpdGlvbiUyMGludGVyaW9yfGVufDF8fHx8MTc3MTk5MzMwMHww&ixlib=rb-4.1.0&q=80&w=1080';
const STOREFRONT_IMG = 'https://images.unsplash.com/photo-1655258104134-35ea5ef8647c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbHVtaW51bSUyMHN0b3JlZnJvbnQlMjBkb29yJTIwZmFjYWRlJTIwY29tbWVyY2lhbHxlbnwxfHx8fDE3NzE5OTMzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080';
const SLIDING_DOOR_IMG = 'https://images.unsplash.com/photo-1759709583846-d788ccb313ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMHNsaWRpbmclMjBkb29yJTIwcmVzaWRlbnRpYWwlMjBob21lfGVufDF8fHx8MTc3MTk5MzMwM3ww&ixlib=rb-4.1.0&q=80&w=1080';
const AWNING_IMG = 'https://images.unsplash.com/photo-1766521076678-b124ae61690a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGF3bmluZyUyMHdpbmRvdyUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nfGVufDF8fHx8MTc3MTk5MzMzN3ww&ixlib=rb-4.1.0&q=80&w=1080';
const BRONZE_IMG = 'https://images.unsplash.com/photo-1762077713566-2a8f205c12df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9uemUlMjB0aW50ZWQlMjBnbGFzcyUyMHdpbmRvdyUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzcxOTkzMzM4fDA&ixlib=rb-4.1.0&q=80&w=1080';

const products = [
  { icon: Building2, label: 'Storefront Systems', desc: 'Full aluminum storefront solutions for commercial properties with custom sizing.' },
  { icon: Square, label: 'Fixed Windows', desc: 'Non-operable glass windows for maximum light and visual aesthetics.' },
  { icon: Frame, label: 'Sliding Windows', desc: 'Space-saving horizontal sliding windows for homes and offices.' },
  { icon: DoorOpen, label: 'Glass Doors', desc: 'Tempered glass swing and sliding doors for modern interiors.' },
  { icon: LayoutPanelLeft, label: 'Glass Partitions', desc: 'Office and room dividers with frosted or clear glass options.' },
  { icon: Wrench, label: 'Awning Windows', desc: 'Top-hinged outward-opening windows ideal for ventilation.' },
];

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

const projects = [
  { img: STOREFRONT_IMG, label: 'Commercial Storefront', loc: 'Cebu City' },
  { img: PARTITION_IMG, label: 'Office Glass Partition', loc: 'Makati CBD' },
  { img: SLIDING_DOOR_IMG, label: 'Residential Sliding Door', loc: 'Quezon City' },
  { img: AWNING_IMG, label: 'Awning Window Installation', loc: 'Davao City' },
  { img: BRONZE_IMG, label: 'Bronze Tinted Windows', loc: 'Mandaluyong' },
  { img: GLASS_INSTALLATION_IMG, label: 'Window Replacement Project', loc: 'Pasig City' },
];

export default function Home() {
  useEffect(() => {
    // Add door opening animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes doorOpen {
        0% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
        50% { transform: perspective(1000px) rotateY(-15deg); opacity: 0.8; }
        100% { transform: perspective(1000px) rotateY(0deg); opacity: 1; }
      }
      
      .door-opening-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
      }
      
      .door-opening-btn:hover::before {
        left: 100%;
      }
      
      .door-opening-btn:active {
        animation: doorOpen 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#fafafa', fontFamily: 'var(--font-body)' }}>)
      {/* Hero */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '100vh', paddingTop: '76px' }}
      >
        <ImageWithFallback
          src={GLASS_INSTALLATION_IMG}
          alt="Glass installation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(21,38,60,0.88) 0%, rgba(21,38,60,0.55) 60%, rgba(122,0,0,0.3) 100%)' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(122,0,0,0.3)', border: '1px solid rgba(122,0,0,0.5)' }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ff4444' }} />
            <span style={{ color: '#ffcccc', fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '0.1em' }}>
              NOW ACCEPTING ONLINE QUOTE REQUESTS
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'white',
              fontSize: 'clamp(40px, 7vw, 78px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '0.02em',
              marginBottom: '24px',
              textTransform: 'uppercase',
            }}
          >
            Built to last. <br />
            <span style={{ color: '#ff6666' }}>Beyond the blast.</span>
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.82)',
              fontSize: 'clamp(15px, 2vw, 19px)',
              maxWidth: '620px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
              fontFamily: 'var(--font-body)',
            }}
          >
            From storefronts to glass partitions — we fabricate and install custom aluminum and glass work built to your exact specifications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/quote"
              className="door-opening-btn"
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '17px',
                padding: '14px 36px',
                borderRadius: '8px',
                textDecoration: 'none',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(122,0,0,0.5)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              Request A Quote <ArrowRight size={18} />
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              </span>
            </Link>
            <a
              href="#projects"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.4)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                fontSize: '16px',
                padding: '14px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              View Projects
            </a>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <span style={{ color: 'white', fontSize: '11px', letterSpacing: '0.15em', fontFamily: 'var(--font-body)' }}>SCROLL</span>
          <div className="w-0.5 h-8 bg-white/40 rounded-full" />
        </div>
      </section>

      {/* Stats */}
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

      {/* Products */}
      <section id="products" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              WHAT WE OFFER
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
              PRODUCTS & SERVICES
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded" style={{ backgroundColor: '#7a0000' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.label}
                className="group p-6 rounded-xl border transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                }}
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
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#15263c' }}
                >
                  <p.icon size={22} color="white" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '20px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                  {p.label}
                </h3>
                <p style={{ color: '#54667d', fontSize: '14px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section id="projects" className="py-20 px-6" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              OUR PORTFOLIO
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
              RECENT PROJECTS
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded" style={{ backgroundColor: '#7a0000' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div
                key={p.label}
                className="relative overflow-hidden group rounded-xl cursor-pointer"
                style={{ borderRadius: '8px', aspectRatio: '4/3' }}
              >
                <ImageWithFallback
                  src={p.img}
                  alt={p.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(21,38,60,0.9), transparent)' }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '18px', fontWeight: 700 }}>
                    {p.label}
                  </div>
                  <div style={{ color: '#d9d9d9', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <MapPin size={12} /> {p.loc}
                  </div>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 p-4 group-hover:opacity-0 transition-opacity duration-200"
                  style={{ background: 'linear-gradient(to top, rgba(21,38,60,0.7), transparent)' }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '16px', fontWeight: 600 }}>
                    {p.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="services" className="py-20 px-6" style={{ backgroundColor: '#15263c' }}>
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
                className="p-6 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
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

      {/* CTA Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#fafafa' }}>
        <div
          className="max-w-4xl mx-auto text-center p-12 rounded-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #15263c, #1e3655)', borderRadius: '12px' }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #7a0000, transparent)', transform: 'translate(30%, -30%)' }}
          />
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>
            READY TO START YOUR PROJECT?
          </h2>
          <p style={{ color: '#9ab0c4', fontSize: '16px', marginBottom: '32px', fontFamily: 'var(--font-body)' }}>
            Get a detailed estimate in minutes. Our team reviews all quotes within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/quote"
              className="door-opening-btn"
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #7a0000, #a50000)',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '17px',
                padding: '14px 36px',
                borderRadius: '8px',
                textDecoration: 'none',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(122,0,0,0.5)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Request a Quote <ArrowRight size={18} />
              </span>
            </Link>
            <Link
              to="/dashboard"
              style={{
                fontFamily: 'var(--font-heading)',
                color: '#d9d9d9',
                border: '2px solid rgba(255,255,255,0.2)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                fontSize: '16px',
                padding: '14px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Track My Order
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0f1e30', paddingTop: '50px', paddingBottom: '24px' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              {/* Enlarged Logo */}
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={logoImage}
                  alt="Ermel Glass & Aluminum Works"
                  style={{
                    width: '80px',
                    height: '80px',
                    aspectRatio: '1 / 1',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(122,0,0,0.4)',
                  }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1 }}>
                    ERMEL GLASS
                  </div>
                  <div style={{ color: '#54667d', fontSize: '12px', letterSpacing: '0.12em', marginTop: '4px' }}>& ALUMINUM WORKS</div>
                </div>
              </div>
              <p style={{ color: '#9ab0c4', fontSize: '14px', lineHeight: 1.6, fontFamily: 'var(--font-body)', marginBottom: '20px' }}>
                Professional glass and aluminum fabrication and installation services serving residential and commercial clients across the Philippines.
              </p>
              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Facebook, href: '#', label: 'Facebook' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Linkedin, href: '#', label: 'LinkedIn' },
                  { icon: Youtube, href: '#', label: 'YouTube' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="group"
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(122,0,0,0.2)',
                      border: '1px solid rgba(122,0,0,0.3)',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.backgroundColor = 'rgba(122,0,0,0.4)';
                      el.style.borderColor = '#7a0000';
                      el.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.backgroundColor = 'rgba(122,0,0,0.2)';
                      el.style.borderColor = 'rgba(122,0,0,0.3)';
                      el.style.transform = 'translateY(0)';
                    }}
                  >
                    <social.icon size={18} color="#ff8888" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
                Quick Links
              </div>
              {['Products', 'Services', 'Projects', 'Request a Quote', 'Track My Order'].map((link) => (
                <div key={link} style={{ marginBottom: '8px' }}>
                  <a
                    href="#"
                    style={{ color: '#9ab0c4', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)' }}
                  >
                    <ChevronRight size={12} color="#7a0000" /> {link}
                  </a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
                Contact Us
              </div>
              {[
                { icon: Phone, text: '+63 917 123 4567' },
                { icon: Mail, text: 'info@ermelglass.com' },
                { icon: MapPin, text: '123 Fabrication St., Cebu City, Philippines' },
              ].map((c) => (
                <div key={c.text} className="flex items-start gap-3 mb-3">
                  <c.icon size={15} color="#7a0000" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: '#9ab0c4', fontSize: '14px', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{c.text}</span>
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
