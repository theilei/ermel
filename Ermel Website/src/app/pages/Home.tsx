import { Link, useNavigate } from 'react-router';
import React, { useState, useEffect } from 'react'; 
import { ArrowRight, ChevronRight, ChevronLeft, Phone, Mail, MapPin } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Footer from '../components/Footer';

import bgvid from '../../assets/VIDEO UI.mp4';
import completekitchen from '../../assets/kitchen_cabinet.png';
import cabinetunder from '../../assets/cabinet_under.png';
import slidingwindow from '../../assets/sliding_window.png';
import frenchtype from '../../assets/french_type.png';
import swingdoor from '../../assets/swing_door.png';
import doubleswing from '../../assets/double_swing.png';

const GLASS_INSTALLATION_VIDEO = bgvid;

const KITCHEN_CABINET_IMG = completekitchen;
const CABINET_IMG = cabinetunder;
const SLIDING_WINDOW_IMG = slidingwindow;
const FRENCH_TYPE_IMG = frenchtype;
const SWING_DOOR_IMG = swingdoor;
const DOUBLE_SWING_IMG = doubleswing;

const products = [
  {
    id: 'storefront',
    label: 'Storefront',
    desc: 'Full commercial front with door & windows',
    img: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    desc: 'Horizontal sliding window panel',
    img: 'https://images.unsplash.com/photo-1506016427870-22fd0e1f923c?q=80&w=691&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'glass-door',
    label: 'Glass Door',
    desc: 'Swing or sliding door with frame',
    img: 'https://images.unsplash.com/photo-1736593319421-250e17bb2f11?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'aluminum-door',
    label: 'Aluminum Door',
    desc: 'Durable framed door system for entryways',
    img: 'https://images.unsplash.com/photo-1699813748627-f04bdb93cf15?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'glass-partition',
    label: 'Glass Partition',
    desc: 'Interior divider or office partition',
    img: 'https://images.unsplash.com/photo-1765766600457-abfd14dd502c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'awning-window',
    label: 'Awning Window',
    desc: 'Top-hinged outward opening window',
    img: 'https://media.istockphoto.com/id/655652796/photo/awning-window-open-modern-home-aluminium-push-windows.webp?a=1&b=1&s=612x612&w=0&k=20&c=qelS_2zVcZ1p_mT2Z8qwUjULmq-NADK5tRWUe-12BwU=',
  },
  {
    id: 'fixed-window',
    label: 'Fixed Window',
    desc: 'Non-operable picture window',
    img: 'https://images.unsplash.com/photo-1719067720887-b55ecfdd21b2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const stats = [
  { value: '500+', label: 'Projects Completed' },
  { value: '8+', label: 'Years Experience' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '24hr', label: 'Quote Turnaround' },
];

const projects = [
  { img: KITCHEN_CABINET_IMG, label: 'Complete Modular Kitchen Cabinet System', loc: 'Manila City' },
  { img: CABINET_IMG, label: 'Under-Counter Base Cabinetry', loc: 'Makati CBD' },
  { img: SLIDING_WINDOW_IMG, label: 'Sliding Window with Integrated Grilles', loc: 'Quezon City' },
  { img: FRENCH_TYPE_IMG, label: 'French-Style Sliding Glass Partition', loc: 'Bulacan Province' },
  { img: SWING_DOOR_IMG, label: 'Single Swing Door with Transom', loc: 'Mandaluyong' },
  { img: DOUBLE_SWING_IMG, label: 'Double Swing Security Door', loc: 'Pasig City' },
];

export default function Home() {
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // NAVIGATION FUNCTIONS
  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev === null ? null : (prev + 1) % projects.length));
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev === null ? null : (prev - 1 + projects.length) % projects.length));
  };

  const closeGallery = () => setSelectedIndex(null);

  // KEYBOARD LISTENER: Escape to close, arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Cleanup listener when component unmounts or state changes
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // Derive the active project from the index
  const activeProject = selectedIndex !== null ? projects[selectedIndex] : null;

  return (
    <div style={{ backgroundColor: '#fafafa', fontFamily: 'var(--font-body)' }}>
      {/* Hero */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '100vh', paddingTop: '76px' }}
      >
        <video
          src={GLASS_INSTALLATION_VIDEO}
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(21,38,60,0.88) 0%, rgba(21,38,60,0.55) 60%, rgba(122,0,0,0.3) 100%)' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(46,139,87,0.25)', border: '1px solid rgba(46,139,87,0.5)' }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#2E8B57' }} />
            <span style={{ color: '#eaffea', fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '0.1em' }}>
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
            CRAFTING GLASS &<br />
            <span style={{ color: '#ff6666' }}>ALUMINUM</span> SOLUTIONS
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
            From storefronts to glass partitions, we fabricate and install custom aluminum and glass work built to your exact specifications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          </div>
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

      {/* Services */}
      <section id="services" className="py-20 px-6" style={{ scrollMarginTop: '80px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              WHAT WE OFFER
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
              SERVICES
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded" style={{ backgroundColor: '#7a0000' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, index) => (
              <div
                key={p.id}
                className={`group p-7 md:p-8 rounded-xl border transition-all duration-200 cursor-default ${
                  index === products.length - 1 && products.length % 2 === 1
                    ? 'sm:col-span-2 sm:w-[calc(50%-0.75rem)] sm:mx-auto'
                    : ''
                } ${
                  index === products.length - 1 && products.length % 3 === 1
                    ? 'lg:col-span-1 lg:col-start-2 lg:w-auto'
                    : ''
                }`}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #7a0000',
                  borderRadius: '8px',
                  minHeight: '160px',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#15263c';
                  el.style.boxShadow = '0 8px 32px #7a000080';
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#7a0000';
                  el.style.boxShadow = 'none';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-center gap-4 h-full">
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid #d9d9d9' }}
                  >
                    <ImageWithFallback
                      src={p.img}
                      alt={p.label}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(19px, 2vw, 23px)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                      {p.label}
                    </h3>
                    <p style={{ color: '#54667d', fontSize: '15px', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section id="projects" className="py-20 px-6" style={{ backgroundColor: '#f0f2f5', scrollMarginTop: '80px' }}>
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
            {projects.map((p, index) => (
              <div
                key={p.label}
                className="relative overflow-hidden group rounded-xl cursor-pointer"
                style={{ borderRadius: '8px', aspectRatio: '4/3' }}
                onClick={() => setSelectedIndex(index)}
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

        {/* MODAL / CAROUSEL OVERLAY */}
        {activeProject && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={closeGallery} 
          >
            {/* Previous Button */}
            <button 
              onClick={handlePrev}
              className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full transition-colors z-50 group"
              style={{ backgroundColor: 'rgba(21,38,60,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7a0000')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(21,38,60,0.8)')}
            >
              <ChevronLeft size={28} color="white" className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div 
              className="relative max-w-5xl w-full flex flex-col items-center px-12 sm:px-0"
              onClick={(e) => e.stopPropagation()} 
            >
              {/* Close Button */}
              <button 
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full transition-colors z-50"
                style={{ backgroundColor: 'rgba(21,38,60,0.75)', border: '1px solid rgba(255,255,255,0.25)' }}
                onClick={closeGallery}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7a0000')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(21,38,60,0.75)')}
              >
                <span className="text-2xl text-white pb-1">&times;</span>
              </button>

              {/* Enlarged Image */}
              <img 
                src={activeProject.img} 
                alt={activeProject.label} 
                className="w-full max-h-[75vh] object-contain rounded-md shadow-2xl"
              />

              {/* Details & Counter under the image */}
              <div className="mt-5 text-center w-full flex flex-col items-center">
                <div style={{ color: '#ff6666', fontSize: '12px', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                  PROJECT {selectedIndex !== null ? selectedIndex + 1 : 0} OF {projects.length}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase' }}>
                  {activeProject.label}
                </h3>
                <div style={{ color: '#d9d9d9', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                  <MapPin size={16} /> {activeProject.loc}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button 
              onClick={handleNext}
              className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full transition-colors z-50 group"
              style={{ backgroundColor: 'rgba(21,38,60,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7a0000')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(21,38,60,0.8)')}
            >
              <ChevronRight size={28} color="white" className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
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
                transition: 'all 0.2s',
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(122,0,0,0.5)';
              }}
            >
              Request A Quote <ArrowRight size={18} />
            </Link>
            <Link
              to="/check-status"
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
              Check My Status
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}