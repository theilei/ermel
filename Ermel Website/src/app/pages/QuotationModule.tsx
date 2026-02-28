import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Info, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../data/mockData';

const PROJECT_CATEGORIES = [
  {
    id: 'storefront',
    label: 'Storefront',
    desc: 'Full commercial front with door & windows',
    img: 'https://images.unsplash.com/photo-1655258104134-35ea5ef8647c?w=400&q=80',
    baseRate: 1800,
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    desc: 'Horizontal sliding window panel',
    img: 'https://images.unsplash.com/photo-1762077713566-2a8f205c12df?w=400&q=80',
    baseRate: 1200,
  },
  {
    id: 'glass-door',
    label: 'Glass Door',
    desc: 'Swing or sliding door with frame',
    img: 'https://images.unsplash.com/photo-1759709583846-d788ccb313ae?w=400&q=80',
    baseRate: 2200,
  },
  {
    id: 'glass-partition',
    label: 'Glass Partition',
    desc: 'Interior divider or office partition',
    img: 'https://images.unsplash.com/photo-1770993151375-0dee97eda931?w=400&q=80',
    baseRate: 1500,
  },
  {
    id: 'awning-window',
    label: 'Awning Window',
    desc: 'Top-hinged outward opening window',
    img: 'https://images.unsplash.com/photo-1766521076678-b124ae61690a?w=400&q=80',
    baseRate: 1100,
  },
  {
    id: 'fixed-window',
    label: 'Fixed Window',
    desc: 'Non-operable picture window',
    img: 'https://images.unsplash.com/photo-1761227390482-bccb032eeea6?w=400&q=80',
    baseRate: 900,
  },
];

const GLASS_TYPES = [
  {
    id: 'clear',
    label: 'Clear Glass',
    desc: 'Standard transparency, maximum light',
    color: 'rgba(200,230,255,0.5)',
    border: '#90caf9',
    multiplier: 1.0,
    thickness: '6mm standard',
  },
  {
    id: 'bronze',
    label: 'Bronze Glass',
    desc: 'Warm tint, reduces glare & heat',
    color: 'rgba(205,152,70,0.3)',
    border: '#cd9846',
    multiplier: 1.25,
    thickness: '6mm tinted',
  },
  {
    id: 'frosted',
    label: 'Frosted Glass',
    desc: 'Diffused light, privacy-enhancing',
    color: 'rgba(230,230,230,0.5)',
    border: '#aaa',
    multiplier: 1.35,
    thickness: '6mm acid-etched',
  },
  {
    id: 'tempered',
    label: 'Tempered Glass',
    desc: 'Safety-grade, 5× stronger than clear',
    color: 'rgba(180,210,255,0.4)',
    border: '#1565c0',
    multiplier: 1.6,
    thickness: '10mm tempered',
  },
];

const FRAME_MATERIALS = [
  { id: 'aluminum', label: 'Aluminum Frame', desc: 'Lightweight, rust-proof, standard finish', multiplier: 1.0 },
  { id: 'steel', label: 'Steel Frame', desc: 'Heavy-duty, industrial look', multiplier: 1.3 },
  { id: 'stainless', label: 'Stainless Frame', desc: 'Premium finish, corrosion-resistant', multiplier: 1.5 },
];

interface TooltipProps {
  text: string;
}
function Tooltip({ text }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="w-5 h-5 rounded-full inline-flex items-center justify-center ml-1 cursor-help"
        style={{ backgroundColor: '#54667d', flexShrink: 0 }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <Info size={11} color="white" />
      </button>
      {show && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 rounded-lg p-3 shadow-xl"
          style={{
            backgroundColor: '#15263c',
            color: 'white',
            fontSize: '12px',
            lineHeight: 1.5,
            width: '220px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

const STEPS = ['Category', 'Material', 'Dimensions', 'Summary'];

export default function QuotationModule() {
  const navigate = useNavigate();
  const { addOrder } = useApp();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [glassType, setGlassType] = useState<string | null>(null);
  const [frameMaterial, setFrameMaterial] = useState<string | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedCategory = PROJECT_CATEGORIES.find((c) => c.id === category);
  const selectedGlass = GLASS_TYPES.find((g) => g.id === glassType);
  const selectedFrame = FRAME_MATERIALS.find((f) => f.id === frameMaterial);

  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const sqm = (w * h) / 10000; // cm² to m²
  const baseRate = selectedCategory?.baseRate || 1200;
  const glassMult = selectedGlass?.multiplier || 1;
  const frameMult = selectedFrame?.multiplier || 1;
  const estimatedCost = Math.round(sqm * baseRate * glassMult * frameMult * 100) / 100 || 0;

  const canProceed = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!glassType && !!frameMaterial;
    if (step === 2) return w > 0 && h > 0 && name && email && phone;
    return true;
  };

  const handleSubmit = () => {
    const newOrder: Order = {
      id: `EGA-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      customer: name,
      project: selectedCategory?.label || '',
      material: selectedFrame?.label || '',
      glassType: selectedGlass?.label || '',
      dimensions: `${width}cm × ${height}cm`,
      width: w,
      height: h,
      estimatedCost,
      status: 'inquiry',
      createdDate: new Date().toISOString().split('T')[0],
      phone,
      email,
      notes,
      paid: false,
    };
    addOrder(newOrder);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#fafafa', paddingTop: '100px', paddingBottom: '60px' }}
      >
        <div
          className="max-w-md w-full text-center p-10 rounded-2xl"
          style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '12px', boxShadow: '0 8px 40px rgba(21,38,60,0.08)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(26,92,26,0.1)', border: '2px solid #2e7d32' }}
          >
            <Check size={36} color="#2e7d32" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
            REQUEST SUBMITTED!
          </h2>
          <p style={{ color: '#54667d', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
            Your quote request has been received. Our team will review it and get back to you within <strong>48 hours</strong>.
          </p>
          <p style={{ color: '#54667d', fontSize: '14px', marginBottom: '32px', fontFamily: 'var(--font-body)' }}>
            Check your dashboard to track your project status.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #15263c, #1e3655)',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '16px',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Track My Project
            </button>
            <button
              onClick={() => { setSubmitted(false); setStep(0); setCategory(null); setGlassType(null); setFrameMaterial(null); setWidth(''); setHeight(''); }}
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'transparent',
                color: '#54667d',
                fontWeight: 600,
                letterSpacing: '0.06em',
                fontSize: '15px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 pb-16"
      style={{ backgroundColor: '#fafafa', paddingTop: '96px', fontFamily: 'var(--font-body)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
            ONLINE QUOTATION
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1 }}>
            REQUEST A QUOTE
          </h1>
          <p style={{ color: '#54667d', fontSize: '15px', marginTop: '10px', fontFamily: 'var(--font-body)' }}>
            Fill in your project details below. All estimates are subject to admin approval.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10 gap-0 max-w-lg mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: i < step ? '#15263c' : i === step ? '#7a0000' : '#d9d9d9',
                    color: i <= step ? 'white' : '#54667d',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {i < step ? <Check size={16} strokeWidth={2.5} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: i === step ? '#7a0000' : i < step ? '#15263c' : '#aaa',
                    fontWeight: i === step ? 700 : 500,
                  }}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-1 rounded-full"
                  style={{ backgroundColor: i < step ? '#15263c' : '#d9d9d9', marginBottom: '20px' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-5xl mx-auto">
          {/* Step 0: Category */}
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' }}>
                SELECT PROJECT CATEGORY
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PROJECT_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="cursor-pointer rounded-xl overflow-hidden relative group transition-all duration-200"
                    style={{
                      border: category === cat.id ? '3px solid #7a0000' : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      boxShadow: category === cat.id ? '0 4px 20px rgba(122,0,0,0.25)' : 'none',
                      transform: category === cat.id ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div
                      className="p-3"
                      style={{ backgroundColor: category === cat.id ? '#15263c' : 'white' }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: category === cat.id ? 'white' : '#15263c',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '12px', color: category === cat.id ? '#9ab0c4' : '#54667d', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                        {cat.desc}
                      </div>
                    </div>
                    {category === cat.id && (
                      <div
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#7a0000' }}
                      >
                        <Check size={14} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Material */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>
                SELECT GLASS TYPE
              </h2>
              <p style={{ color: '#54667d', fontSize: '14px', textAlign: 'center', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
                Choose the glass and frame material for your project
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {GLASS_TYPES.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setGlassType(g.id)}
                    className="cursor-pointer rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200"
                    style={{
                      border: glassType === g.id ? '3px solid #7a0000' : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      boxShadow: glassType === g.id ? '0 4px 20px rgba(122,0,0,0.2)' : 'none',
                    }}
                  >
                    {/* Glass preview */}
                    <div
                      className="w-full rounded-lg mb-3 relative overflow-hidden"
                      style={{ height: '80px', backgroundColor: g.color, border: `1px solid ${g.border}` }}
                    >
                      {/* Glass shimmer effect */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)',
                        }}
                      />
                      {g.id === 'tempered' && (
                        <div className="absolute bottom-2 left-2 right-2 text-center" style={{ fontSize: '10px', color: '#1565c0', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.1em' }}>
                          TEMPERED
                        </div>
                      )}
                      {g.id === 'frosted' && (
                        <div className="absolute inset-0" style={{ backdropFilter: 'blur(2px)', background: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#15263c', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#54667d', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>{g.desc}</div>
                    <div style={{ fontSize: '11px', color: '#7a0000', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>{g.thickness}</div>
                    {glassType === g.id && (
                      <div className="mt-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7a0000' }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                FRAME MATERIAL
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FRAME_MATERIALS.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setFrameMaterial(f.id)}
                    className="cursor-pointer p-4 rounded-xl flex items-center gap-3 transition-all duration-200"
                    style={{
                      border: frameMaterial === f.id ? '2px solid #15263c' : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      backgroundColor: frameMaterial === f.id ? '#15263c' : 'white',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: frameMaterial === f.id ? 'rgba(255,255,255,0.15)' : '#f0f2f5' }}
                    >
                      <div className="w-5 h-5 rounded border-2" style={{ borderColor: frameMaterial === f.id ? '#9ab0c4' : '#54667d' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: frameMaterial === f.id ? 'white' : '#15263c', textTransform: 'uppercase' }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: '12px', color: frameMaterial === f.id ? '#9ab0c4' : '#54667d', fontFamily: 'var(--font-body)' }}>{f.desc}</div>
                    </div>
                    {frameMaterial === f.id && <Check size={16} color="white" strokeWidth={2.5} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Dimensions + Contact */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  MEASUREMENTS
                </h2>
                <div className="p-5 rounded-xl mb-6" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c040' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#7a4f00', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>
                    ⚠ MEASURING TIPS
                  </div>
                  <p style={{ fontSize: '13px', color: '#7a4f00', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                    Measure the opening/rough opening — not the existing frame. For windows, measure the width at 3 points (top, middle, bottom) and use the <strong>smallest</strong> value. For height, measure from sill to head at 3 points.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="flex items-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      WIDTH (cm)
                      <Tooltip text="Measure the full width of the opening in centimeters. If replacing an existing window, measure the rough opening width, not the current frame." />
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={{
                        border: '2px solid #d9d9d9',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: 'var(--font-body)',
                        backgroundColor: 'white',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#15263c')}
                      onBlur={(e) => (e.target.style.borderColor = '#d9d9d9')}
                    />
                  </div>
                  <div>
                    <label className="flex items-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      HEIGHT (cm)
                      <Tooltip text="Measure the full height of the opening in centimeters. For floors, measure from the finished floor level to the head (top of the opening)." />
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={{
                        border: '2px solid #d9d9d9',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: 'var(--font-body)',
                        backgroundColor: 'white',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#15263c')}
                      onBlur={(e) => (e.target.style.borderColor = '#d9d9d9')}
                    />
                  </div>
                </div>
                {w > 0 && h > 0 && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8', border: '1px solid #d9d9d9' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '13px', letterSpacing: '0.08em' }}>
                      COMPUTED AREA: <strong style={{ color: '#15263c' }}>{sqm.toFixed(2)} m²</strong>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  YOUR INFORMATION
                </h2>
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'e.g. Maria Santos', value: name, onChange: setName, type: 'text' },
                  { key: 'email', label: 'Email Address', placeholder: 'e.g. maria@email.com', value: email, onChange: setEmail, type: 'email' },
                  { key: 'phone', label: 'Phone / Mobile', placeholder: 'e.g. 09171234567', value: phone, onChange: setPhone, type: 'tel' },
                ].map((field) => (
                  <div key={field.key} className="mb-4">
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-lg outline-none"
                      style={{
                        border: '2px solid #d9d9d9',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontFamily: 'var(--font-body)',
                        backgroundColor: 'white',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#15263c')}
                      onBlur={(e) => (e.target.style.borderColor = '#d9d9d9')}
                    />
                  </div>
                ))}
                <div>
                  <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. specific design preference, location notes, urgency..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg outline-none resize-none"
                    style={{
                      border: '2px solid #d9d9d9',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#15263c')}
                    onBlur={(e) => (e.target.style.borderColor = '#d9d9d9')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Spec diagram */}
              <div className="lg:col-span-3">
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  PROJECT SPECIFICATION
                </h2>
                {/* Visual spec box */}
                <div
                  className="rounded-xl p-6 mb-6"
                  style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '8px' }}
                >
                  {/* Glass diagram */}
                  <div className="flex justify-center mb-6">
                    <div className="relative" style={{ width: '200px', height: '150px' }}>
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          border: '4px solid #15263c',
                          borderRadius: '4px',
                          backgroundColor: selectedGlass?.color || 'rgba(200,230,255,0.5)',
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)' }}
                        />
                      </div>
                      {/* Width arrow */}
                      <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center">
                        <div style={{ fontSize: '12px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                          ←— {width || '?'} cm —→
                        </div>
                      </div>
                      {/* Height arrow */}
                      <div className="absolute -right-12 top-0 bottom-0 flex items-center">
                        <div style={{ fontSize: '12px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                          ↕ {height || '?'} cm
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Specs list */}
                  <div className="mt-10 space-y-3">
                    {[
                      { label: 'Project Type', value: selectedCategory?.label },
                      { label: 'Glass Type', value: selectedGlass?.label },
                      { label: 'Glass Spec', value: selectedGlass?.thickness },
                      { label: 'Frame Material', value: selectedFrame?.label },
                      { label: 'Dimensions', value: width && height ? `${width}cm × ${height}cm` : 'Not set' },
                      { label: 'Area', value: sqm > 0 ? `${sqm.toFixed(2)} m²` : 'Not computed' },
                      { label: 'Client Name', value: name || '—' },
                      { label: 'Contact', value: phone || '—' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{s.label}</span>
                        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600 }}>{s.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost estimate */}
              <div className="lg:col-span-2">
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  COST ESTIMATE
                </h2>
                <div
                  className="rounded-xl p-6 mb-4"
                  style={{ background: 'linear-gradient(135deg, #15263c, #1e3655)', borderRadius: '8px' }}
                >
                  <div style={{ color: '#9ab0c4', fontSize: '13px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                    ESTIMATED TOTAL
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
                    ₱{estimatedCost > 0 ? estimatedCost.toLocaleString() : '—'}
                  </div>
                  <div
                    className="mt-3 px-3 py-1.5 rounded-lg inline-block"
                    style={{ backgroundColor: 'rgba(255,165,0,0.2)', border: '1px solid rgba(255,165,0,0.4)' }}
                  >
                    <span style={{ color: '#ffcc00', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                      ⚠ SUBJECT TO ADMIN APPROVAL
                    </span>
                  </div>
                  {/* Breakdown */}
                  <div className="mt-5 space-y-2">
                    {[
                      { label: 'Base Rate', value: `₱${(selectedCategory?.baseRate || 0).toLocaleString()}/m²` },
                      { label: 'Glass Type (+)', value: `×${selectedGlass?.multiplier || 1} factor` },
                      { label: 'Frame Type (+)', value: `×${selectedFrame?.multiplier || 1} factor` },
                      { label: 'Area', value: `${sqm.toFixed(2)} m²` },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span style={{ color: '#9ab0c4', fontSize: '12px', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                        <span style={{ color: 'white', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ color: '#9ab0c4', fontSize: '11px', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                        * Labor, delivery, and installation fees will be finalized in the admin-approved quote.
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: 'linear-gradient(135deg, #7a0000, #a50000)',
                    color: 'white',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontSize: '17px',
                    padding: '14px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 20px rgba(122,0,0,0.4)',
                  }}
                >
                  Submit Quote Request <ArrowRight size={18} />
                </button>
                <p style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '10px', fontFamily: 'var(--font-body)' }}>
                  By submitting, you agree to be contacted by our team for confirmation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="max-w-5xl mx-auto flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{
              fontFamily: 'var(--font-heading)',
              background: step === 0 ? '#e0e0e0' : 'transparent',
              color: step === 0 ? '#aaa' : '#15263c',
              fontWeight: 600,
              letterSpacing: '0.06em',
              fontSize: '15px',
              padding: '11px 24px',
              borderRadius: '8px',
              border: `2px solid ${step === 0 ? '#e0e0e0' : '#15263c'}`,
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textTransform: 'uppercase',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < 3 && (
            <button
              onClick={() => setStep(Math.min(3, step + 1))}
              disabled={!canProceed()}
              style={{
                fontFamily: 'var(--font-heading)',
                background: canProceed() ? 'linear-gradient(135deg, #15263c, #1e3655)' : '#d9d9d9',
                color: canProceed() ? 'white' : '#aaa',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '15px',
                padding: '11px 28px',
                borderRadius: '8px',
                border: 'none',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textTransform: 'uppercase',
              }}
            >
              Next Step <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
