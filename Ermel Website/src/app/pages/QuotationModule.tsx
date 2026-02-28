import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Check, Info, ChevronRight, ChevronLeft, ArrowRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../data/mockData';
import {
  type MeasurementUnit,
  sanitizeTextInput,
  sanitizeOtherInput,
  isValidOtherInput,
  cleanPhoneInput,
  isValidPhPhone,
  PHONE_ERROR_MESSAGE,
  maskPhone,
  toMeters,
  fromMeters,
  convertUnit,
  isValidMeasurement,
  fmt2,
  allUnitsFromMeters,
  isValidAddress,
  ADDRESS_ERROR_MESSAGE,
  OTHER_MAX_LENGTH,
} from '../utils/validation';

// ============================================================
// Data constants
// ============================================================

const PROJECT_CATEGORIES = [
  { id: 'storefront', label: 'Storefront', desc: 'Full commercial front with door & windows', img: 'https://images.unsplash.com/photo-1655258104134-35ea5ef8647c?w=400&q=80', baseRate: 1800 },
  { id: 'sliding-window', label: 'Sliding Window', desc: 'Horizontal sliding window panel', img: 'https://images.unsplash.com/photo-1762077713566-2a8f205c12df?w=400&q=80', baseRate: 1200 },
  { id: 'glass-door', label: 'Glass Door', desc: 'Swing or sliding door with frame', img: 'https://images.unsplash.com/photo-1759709583846-d788ccb313ae?w=400&q=80', baseRate: 2200 },
  { id: 'glass-partition', label: 'Glass Partition', desc: 'Interior divider or office partition', img: 'https://images.unsplash.com/photo-1770993151375-0dee97eda931?w=400&q=80', baseRate: 1500 },
  { id: 'awning-window', label: 'Awning Window', desc: 'Top-hinged outward opening window', img: 'https://images.unsplash.com/photo-1766521076678-b124ae61690a?w=400&q=80', baseRate: 1100 },
  { id: 'fixed-window', label: 'Fixed Window', desc: 'Non-operable picture window', img: 'https://images.unsplash.com/photo-1761227390482-bccb032eeea6?w=400&q=80', baseRate: 900 },
  { id: 'other', label: 'Other', desc: 'Other \u2013 Please specify', img: '', baseRate: 1200 },
];

const GLASS_TYPES = [
  { id: 'clear', label: 'Clear Glass', desc: 'Standard transparency, maximum light', color: 'rgba(200,230,255,0.5)', border: '#90caf9', multiplier: 1.0, thickness: '6mm standard' },
  { id: 'bronze', label: 'Bronze Glass', desc: 'Warm tint, reduces glare & heat', color: 'rgba(205,152,70,0.3)', border: '#cd9846', multiplier: 1.25, thickness: '6mm tinted' },
  { id: 'frosted', label: 'Frosted Glass', desc: 'Diffused light, privacy-enhancing', color: 'rgba(230,230,230,0.5)', border: '#aaa', multiplier: 1.35, thickness: '6mm acid-etched' },
  { id: 'tempered', label: 'Tempered Glass', desc: 'Safety-grade, 5\u00d7 stronger than clear', color: 'rgba(180,210,255,0.4)', border: '#1565c0', multiplier: 1.6, thickness: '10mm tempered' },
  { id: 'other', label: 'Other', desc: 'Other \u2013 Please specify', color: 'rgba(200,200,200,0.3)', border: '#999', multiplier: 1.0, thickness: 'Custom' },
];

const COLOR_OPTIONS = [
  { id: 'clear', label: 'Clear', desc: 'No tint', swatch: 'rgba(200,230,255,0.6)' },
  { id: 'bronze', label: 'Bronze', desc: 'Warm amber tint', swatch: 'rgba(205,152,70,0.5)' },
  { id: 'gray', label: 'Gray', desc: 'Neutral gray tint', swatch: 'rgba(150,150,150,0.5)' },
  { id: 'green', label: 'Green', desc: 'Green tint', swatch: 'rgba(100,180,100,0.4)' },
  { id: 'blue', label: 'Blue', desc: 'Blue tint', swatch: 'rgba(100,150,220,0.5)' },
  { id: 'other', label: 'Other', desc: 'Other \u2013 Please specify', swatch: 'rgba(200,200,200,0.4)' },
];

const FRAME_MATERIALS = [
  { id: 'aluminum', label: 'Aluminum Frame', desc: 'Lightweight, rust-proof, standard finish', multiplier: 1.0 },
  { id: 'steel', label: 'Steel Frame', desc: 'Heavy-duty, industrial look', multiplier: 1.3 },
  { id: 'stainless', label: 'Stainless Frame', desc: 'Premium finish, corrosion-resistant', multiplier: 1.5 },
];

const UNIT_LABELS: Record<MeasurementUnit, string> = { cm: 'cm', m: 'm', ft: 'ft' };

// ============================================================
// Small sub-components
// ============================================================

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="w-5 h-5 rounded-full inline-flex items-center justify-center ml-1 cursor-help"
        style={{ backgroundColor: '#54667d', flexShrink: 0 }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label="Info"
      >
        <Info size={11} color="white" />
      </button>
      {show && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 rounded-lg p-3 shadow-xl"
          style={{ backgroundColor: '#15263c', color: 'white', fontSize: '12px', lineHeight: 1.5, width: '220px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)' }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

/** Inline error message */
function InlineError({ message }: { message: string }) {
  return (
    <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
      {message}
    </div>
  );
}

/** Text input for "Other" specification */
function OtherTextInput({
  value,
  onChange,
  placeholder = 'Please specify...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw.slice(0, OTHER_MAX_LENGTH));
  };

  const handleBlur = () => {
    onChange(sanitizeOtherInput(value));
  };

  const isError = value.length > 0 && !isValidOtherInput(value);

  return (
    <div className="mt-2">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={OTHER_MAX_LENGTH}
        className="w-full px-4 py-3 rounded-lg outline-none transition-all"
        style={{
          border: isError ? '2px solid #d32f2f' : '2px solid #d9d9d9',
          borderRadius: '8px',
          fontSize: '15px',
          fontFamily: 'var(--font-body)',
          backgroundColor: 'white',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
      />
      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px', textAlign: 'right', fontFamily: 'var(--font-body)' }}>
        {value.length}/{OTHER_MAX_LENGTH}
      </div>
      {value.length > 0 && sanitizeTextInput(value).length === 0 && (
        <InlineError message="Please provide a valid specification." />
      )}
    </div>
  );
}

// ============================================================
// Confirmation Modal
// ============================================================
interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  data: {
    projectCategory: string;
    glassType: string;
    color: string;
    measurements: string;
    address: string;
    phone: string;
    otherInputs: { label: string; value: string }[];
  };
}

function ConfirmationModal({ open, onCancel, onConfirm, data }: ConfirmModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const rows = [
    { label: 'Project Category', value: data.projectCategory },
    { label: 'Glass Type', value: data.glassType },
    { label: 'Color', value: data.color },
    { label: 'Measurements', value: data.measurements },
    { label: 'Address', value: data.address },
    { label: 'Phone', value: data.phone },
    ...data.otherInputs.map((o) => ({ label: o.label, value: o.value })),
  ];

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === backdropRef.current) onCancel(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 relative"
        style={{ backgroundColor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100" aria-label="Close">
          <X size={20} color="#54667d" />
        </button>

        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
          CONFIRM YOUR QUOTE
        </h2>
        <p style={{ color: '#54667d', fontSize: '13px', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
          Please review the details below before submitting.
        </p>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-start py-2" style={{ borderBottom: '1px solid #f0f2f5' }}>
              <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', flexShrink: 0, marginRight: '12px' }}>{r.label}</span>
              <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{r.value || '\u2014'}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              fontFamily: 'var(--font-heading)',
              background: 'transparent',
              color: '#54667d',
              fontWeight: 600,
              fontSize: '15px',
              padding: '14px 24px',
              borderRadius: '8px',
              border: '2px solid #d9d9d9',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              minHeight: '52px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #7a0000, #a50000)',
              color: 'white',
              fontWeight: 700,
              fontSize: '15px',
              padding: '14px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: '0 4px 20px rgba(122,0,0,0.4)',
              minHeight: '52px',
            }}
          >
            Confirm &amp; Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Steps
// ============================================================
const STEPS = ['Category', 'Material', 'Dimensions', 'Summary'];

// ============================================================
// Main Component
// ============================================================
export default function QuotationModule() {
  const navigate = useNavigate();
  const { addOrder } = useApp();

  // Core form state
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [glassType, setGlassType] = useState<string | null>(null);
  const [colorChoice, setColorChoice] = useState<string | null>(null);
  const [frameMaterial, setFrameMaterial] = useState<string | null>(null);

  // "Other" text values — preserved across option switches
  const [categoryOther, setCategoryOther] = useState('');
  const [glassTypeOther, setGlassTypeOther] = useState('');
  const [colorOther, setColorOther] = useState('');

  // Measurement state
  const [measureUnit, setMeasureUnit] = useState<MeasurementUnit>('cm');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  // Store the original unit the value was typed in
  const [widthOrigUnit, setWidthOrigUnit] = useState<MeasurementUnit>('cm');
  const [heightOrigUnit, setHeightOrigUnit] = useState<MeasurementUnit>('cm');
  // Original typed values (preserved for re-conversion)
  const [widthOrigVal, setWidthOrigVal] = useState('');
  const [heightOrigVal, setHeightOrigVal] = useState('');

  // Contact / address
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Touched trackers
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  // UI state
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Derived values
  const selectedCategory = PROJECT_CATEGORIES.find((c) => c.id === category);
  const selectedGlass = GLASS_TYPES.find((g) => g.id === glassType);
  const selectedFrame = FRAME_MATERIALS.find((f) => f.id === frameMaterial);
  const selectedColor = COLOR_OPTIONS.find((c) => c.id === colorChoice);

  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;

  const wMeters = toMeters(w, measureUnit);
  const hMeters = toMeters(h, measureUnit);
  const sqm = wMeters * hMeters;

  const baseRate = selectedCategory?.baseRate || 1200;
  const glassMult = selectedGlass?.multiplier || 1;
  const frameMult = selectedFrame?.multiplier || 1;
  const estimatedCost = Math.round(sqm * baseRate * glassMult * frameMult * 100) / 100 || 0;

  // Phone helpers
  const cleanedPhone = cleanPhoneInput(phone);
  const phoneValid = isValidPhPhone(cleanedPhone);

  // Measurement validation
  const widthValid = w > 0 && isValidMeasurement(w, measureUnit);
  const heightValid = h > 0 && isValidMeasurement(h, measureUnit);

  // Address validation
  const addressValid = isValidAddress(address);

  // "Other" validity
  const categoryOtherValid = category !== 'other' || isValidOtherInput(categoryOther);
  const glassOtherValid = glassType !== 'other' || isValidOtherInput(glassTypeOther);
  const colorOtherValid = colorChoice !== 'other' || isValidOtherInput(colorOther);

  // Step validation
  const canProceed = useCallback((): boolean => {
    if (step === 0) return !!category && categoryOtherValid;
    if (step === 1) return !!glassType && !!frameMaterial && !!colorChoice && glassOtherValid && colorOtherValid;
    if (step === 2) {
      return widthValid && heightValid && !!name.trim() && !!email.trim() && phoneValid && addressValid;
    }
    return true;
  }, [step, category, categoryOtherValid, glassType, frameMaterial, colorChoice, glassOtherValid, colorOtherValid, widthValid, heightValid, name, email, phoneValid, addressValid]);

  // Unit switching
  const handleUnitChange = (newUnit: MeasurementUnit) => {
    if (newUnit === measureUnit) return;

    if (widthOrigVal) {
      const origW = parseFloat(widthOrigVal);
      if (!isNaN(origW) && origW > 0) {
        const converted = convertUnit(origW, widthOrigUnit, newUnit);
        setWidth(fmt2(converted));
      }
    }

    if (heightOrigVal) {
      const origH = parseFloat(heightOrigVal);
      if (!isNaN(origH) && origH > 0) {
        const converted = convertUnit(origH, heightOrigUnit, newUnit);
        setHeight(fmt2(converted));
      }
    }

    setMeasureUnit(newUnit);
  };

  // Measurement input handlers
  const handleWidthChange = (val: string) => {
    setWidth(val);
    setWidthOrigVal(val);
    setWidthOrigUnit(measureUnit);
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    setHeightOrigVal(val);
    setHeightOrigUnit(measureUnit);
  };

  // Phone handler
  const handlePhoneChange = (val: string) => {
    setPhone(cleanPhoneInput(val));
    if (!phoneTouched) setPhoneTouched(true);
  };

  // Address handler
  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (!addressTouched) setAddressTouched(true);
  };

  // Build confirmation data
  const buildConfirmData = () => {
    const unitLabel = UNIT_LABELS[measureUnit];
    const otherInputs: { label: string; value: string }[] = [];
    if (category === 'other') otherInputs.push({ label: 'Category (Other)', value: sanitizeOtherInput(categoryOther) });
    if (glassType === 'other') otherInputs.push({ label: 'Glass Type (Other)', value: sanitizeOtherInput(glassTypeOther) });
    if (colorChoice === 'other') otherInputs.push({ label: 'Color (Other)', value: sanitizeOtherInput(colorOther) });

    return {
      projectCategory: category === 'other' ? `Other: ${sanitizeOtherInput(categoryOther)}` : (selectedCategory?.label || ''),
      glassType: glassType === 'other' ? `Other: ${sanitizeOtherInput(glassTypeOther)}` : (selectedGlass?.label || ''),
      color: colorChoice === 'other' ? `Other: ${sanitizeOtherInput(colorOther)}` : (selectedColor?.label || ''),
      measurements: `${width} ${unitLabel} \u00d7 ${height} ${unitLabel}`,
      address: sanitizeTextInput(address),
      phone: maskPhone(cleanedPhone),
      otherInputs,
    };
  };

  // Submit handler
  const handleSubmit = async () => {
    setSubmitError('');

    const finalPhone = cleanPhoneInput(phone);
    const finalAddress = sanitizeTextInput(address);
    const finalName = sanitizeTextInput(name);
    const finalEmail = sanitizeTextInput(email);
    const finalNotes = sanitizeTextInput(notes);

    const wUnits = allUnitsFromMeters(wMeters);
    const hUnits = allUnitsFromMeters(hMeters);
    const unitLabel = UNIT_LABELS[measureUnit];

    const newOrder: Order = {
      id: `EGA-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      customer: finalName,
      project: category === 'other' ? `Other: ${sanitizeOtherInput(categoryOther)}` : (selectedCategory?.label || ''),
      material: selectedFrame?.label || '',
      glassType: glassType === 'other' ? `Other: ${sanitizeOtherInput(glassTypeOther)}` : (selectedGlass?.label || ''),
      dimensions: `${width}${unitLabel} \u00d7 ${height}${unitLabel}`,
      width: wUnits.cm,
      height: hUnits.cm,
      estimatedCost,
      status: 'inquiry',
      createdDate: new Date().toISOString().split('T')[0],
      phone: finalPhone,
      email: finalEmail,
      notes: finalNotes || undefined,
      paid: false,
      projectCategoryOther: category === 'other' ? sanitizeOtherInput(categoryOther) : null,
      glassTypeOther: glassType === 'other' ? sanitizeOtherInput(glassTypeOther) : null,
      colorOther: colorChoice === 'other' ? sanitizeOtherInput(colorOther) : null,
      widthM: wUnits.m,
      heightM: hUnits.m,
      widthCm: wUnits.cm,
      heightCm: hUnits.cm,
      widthFt: wUnits.ft,
      heightFt: hUnits.ft,
      address: finalAddress,
      measurementUnit: measureUnit,
    };

    // Server submission (graceful fallback to client-only)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOrder, phone_plain: finalPhone }),
      });

      if (res.status === 429) {
        setSubmitError('Too many quote requests. Please try again later.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error) {
          setSubmitError(body.error);
          return;
        }
      }
    } catch {
      // Server unreachable \u2014 proceed with client-only mock
    }

    addOrder(newOrder);
    setSubmitted(true);
  };

  // Reset form
  const resetForm = () => {
    setSubmitted(false);
    setStep(0);
    setCategory(null);
    setGlassType(null);
    setColorChoice(null);
    setFrameMaterial(null);
    setCategoryOther('');
    setGlassTypeOther('');
    setColorOther('');
    setWidth('');
    setHeight('');
    setWidthOrigVal('');
    setHeightOrigVal('');
    setMeasureUnit('cm');
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setPhoneTouched(false);
    setAddressTouched(false);
    setSubmitError('');
  };

  // ============================================================
  // Success screen
  // ============================================================
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fafafa', paddingTop: '100px', paddingBottom: '60px' }}>
        <div className="max-w-md w-full text-center p-10 rounded-2xl" style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '12px', boxShadow: '0 8px 40px rgba(21,38,60,0.08)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(26,92,26,0.1)', border: '2px solid #2e7d32' }}>
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
              className="min-h-[52px]"
              style={{ fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #15263c, #1e3655)', color: 'white', fontWeight: 700, letterSpacing: '0.06em', fontSize: '16px', padding: '14px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Track My Project
            </button>
            <button
              onClick={resetForm}
              className="min-h-[52px]"
              style={{ fontFamily: 'var(--font-heading)', background: 'transparent', color: '#54667d', fontWeight: 600, letterSpacing: '0.06em', fontSize: '15px', padding: '12px 24px', borderRadius: '8px', border: '1px solid #d9d9d9', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render helpers
  // ============================================================
  const inputStyle = (hasError = false) => ({
    border: hasError ? '2px solid #d32f2f' : '2px solid #d9d9d9',
    borderRadius: '8px' as const,
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    backgroundColor: hasError ? '#fff5f5' : 'white',
  });

  // ============================================================
  // Main form
  // ============================================================
  return (
    <div className="min-h-screen px-4 pb-16" style={{ backgroundColor: '#fafafa', paddingTop: '96px', fontFamily: 'var(--font-body)' }}>
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

        {/* Step Indicator \u2014 horizontal on desktop */}
        <div className="hidden sm:flex items-center justify-center mb-10 gap-0 max-w-lg mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ backgroundColor: i < step ? '#15263c' : i === step ? '#7a0000' : '#d9d9d9', color: i <= step ? 'white' : '#54667d', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px' }}
                >
                  {i < step ? <Check size={16} strokeWidth={2.5} /> : i + 1}
                </div>
                <span style={{ fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', color: i === step ? '#7a0000' : i < step ? '#15263c' : '#aaa', fontWeight: i === step ? 700 : 500 }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-0.5 flex-1 mx-1 rounded-full" style={{ backgroundColor: i < step ? '#15263c' : '#d9d9d9', marginBottom: '20px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Mobile vertical step indicator */}
        <div className="flex sm:hidden flex-col gap-2 mb-8 pl-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{ backgroundColor: i < step ? '#15263c' : i === step ? '#7a0000' : '#d9d9d9', color: i <= step ? 'white' : '#54667d', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px' }}
              >
                {i < step ? <Check size={16} strokeWidth={2.5} /> : i + 1}
              </div>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', color: i === step ? '#7a0000' : i < step ? '#15263c' : '#aaa', fontWeight: i === step ? 700 : 500 }}>
                {s}
              </span>
              {i === step && <ChevronRight size={14} color="#7a0000" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-5xl mx-auto">

          {/* ======== Step 0: Category ======== */}
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
                      minHeight: '60px',
                    }}
                  >
                    {cat.img ? (
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                        <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: category === cat.id ? '#15263c' : '#f0f2f5' }}>
                        <span style={{ fontSize: '40px', color: category === cat.id ? '#7a0000' : '#d9d9d9' }}>?</span>
                      </div>
                    )}
                    <div className="p-3" style={{ backgroundColor: category === cat.id ? '#15263c' : 'white' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: category === cat.id ? 'white' : '#15263c', textTransform: 'uppercase' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '12px', color: category === cat.id ? '#9ab0c4' : '#54667d', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                        {cat.desc}
                      </div>
                    </div>
                    {category === cat.id && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7a0000' }}>
                        <Check size={14} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {category === 'other' && (
                <div className="mt-4 max-w-md mx-auto">
                  <OtherTextInput value={categoryOther} onChange={setCategoryOther} placeholder="Describe your project category..." />
                </div>
              )}
            </div>
          )}

          {/* ======== Step 1: Glass Type + Color + Frame ======== */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>
                SELECT GLASS TYPE
              </h2>
              <p style={{ color: '#54667d', fontSize: '14px', textAlign: 'center', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
                Choose the glass, color, and frame material for your project
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
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
                      minHeight: '60px',
                    }}
                  >
                    <div className="w-full rounded-lg mb-3 relative overflow-hidden" style={{ height: '80px', backgroundColor: g.color, border: `1px solid ${g.border}` }}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)' }} />
                      {g.id === 'tempered' && (
                        <div className="absolute bottom-2 left-2 right-2 text-center" style={{ fontSize: '10px', color: '#1565c0', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.1em' }}>TEMPERED</div>
                      )}
                      {g.id === 'frosted' && (
                        <div className="absolute inset-0" style={{ backdropFilter: 'blur(2px)', background: 'rgba(255,255,255,0.2)' }} />
                      )}
                      {g.id === 'other' && (
                        <div className="absolute inset-0 flex items-center justify-center"><span style={{ fontSize: '28px', color: '#999' }}>?</span></div>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#15263c', textTransform: 'uppercase', marginBottom: '4px' }}>{g.label}</div>
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
              {glassType === 'other' && (
                <div className="mb-6 max-w-md mx-auto">
                  <OtherTextInput value={glassTypeOther} onChange={setGlassTypeOther} placeholder="Describe the glass type..." />
                </div>
              )}

              {/* Color */}
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
                COLOR / TINT
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                {COLOR_OPTIONS.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setColorChoice(c.id)}
                    className="cursor-pointer rounded-xl p-3 flex flex-col items-center text-center transition-all duration-200"
                    style={{
                      border: colorChoice === c.id ? '3px solid #7a0000' : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      boxShadow: colorChoice === c.id ? '0 2px 12px rgba(122,0,0,0.15)' : 'none',
                      minHeight: '60px',
                    }}
                  >
                    <div className="w-10 h-10 rounded-full mb-2" style={{ backgroundColor: c.swatch, border: colorChoice === c.id ? '2px solid #7a0000' : '1px solid #ccc' }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: '#15263c', textTransform: 'uppercase' }}>{c.label}</div>
                    <div style={{ fontSize: '10px', color: '#54667d', fontFamily: 'var(--font-body)' }}>{c.desc}</div>
                    {colorChoice === c.id && (
                      <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7a0000' }}>
                        <Check size={10} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {colorChoice === 'other' && (
                <div className="mb-6 max-w-md mx-auto">
                  <OtherTextInput value={colorOther} onChange={setColorOther} placeholder="Describe the color / tint..." />
                </div>
              )}

              {/* Frame Material */}
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
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
                      minHeight: '60px',
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: frameMaterial === f.id ? 'rgba(255,255,255,0.15)' : '#f0f2f5' }}>
                      <div className="w-5 h-5 rounded border-2" style={{ borderColor: frameMaterial === f.id ? '#9ab0c4' : '#54667d' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: frameMaterial === f.id ? 'white' : '#15263c', textTransform: 'uppercase' }}>{f.label}</div>
                      <div style={{ fontSize: '12px', color: frameMaterial === f.id ? '#9ab0c4' : '#54667d', fontFamily: 'var(--font-body)' }}>{f.desc}</div>
                    </div>
                    {frameMaterial === f.id && <Check size={16} color="white" strokeWidth={2.5} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======== Step 2: Dimensions + Contact + Address ======== */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  MEASUREMENTS
                </h2>

                {/* Unit switcher */}
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>UNIT:</span>
                  {(['cm', 'm', 'ft'] as MeasurementUnit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => handleUnitChange(u)}
                      className="min-h-[40px] min-w-[48px] px-4 py-2 rounded-lg transition-all"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '14px',
                        fontWeight: measureUnit === u ? 700 : 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        backgroundColor: measureUnit === u ? '#15263c' : '#f0f2f5',
                        color: measureUnit === u ? 'white' : '#54667d',
                        border: measureUnit === u ? '2px solid #15263c' : '2px solid #d9d9d9',
                        cursor: 'pointer',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-xl mb-6" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c040' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#7a4f00', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>
                    ⚠ MEASURING TIPS
                  </div>
                  <p style={{ fontSize: '13px', color: '#7a4f00', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                    Measure the opening/rough opening — not the existing frame. For windows, measure the width at 3 points (top, middle, bottom) and use the <strong>smallest</strong> value.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="flex items-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      WIDTH ({UNIT_LABELS[measureUnit]})
                      <Tooltip text={`Measure the full width of the opening in ${UNIT_LABELS[measureUnit]}.`} />
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder={measureUnit === 'cm' ? 'e.g. 120' : measureUnit === 'm' ? 'e.g. 1.20' : 'e.g. 3.94'}
                      step="any"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={inputStyle(width !== '' && !widthValid)}
                      onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                      onBlur={(e) => { e.target.style.borderColor = (width !== '' && !widthValid) ? '#d32f2f' : '#d9d9d9'; }}
                    />
                    {width !== '' && !widthValid && (
                      <InlineError message={w <= 0 ? 'Value must be greater than 0.' : 'Maximum dimension is 100 meters.'} />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      HEIGHT ({UNIT_LABELS[measureUnit]})
                      <Tooltip text={`Measure the full height of the opening in ${UNIT_LABELS[measureUnit]}.`} />
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder={measureUnit === 'cm' ? 'e.g. 150' : measureUnit === 'm' ? 'e.g. 1.50' : 'e.g. 4.92'}
                      step="any"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={inputStyle(height !== '' && !heightValid)}
                      onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                      onBlur={(e) => { e.target.style.borderColor = (height !== '' && !heightValid) ? '#d32f2f' : '#d9d9d9'; }}
                    />
                    {height !== '' && !heightValid && (
                      <InlineError message={h <= 0 ? 'Value must be greater than 0.' : 'Maximum dimension is 100 meters.'} />
                    )}
                  </div>
                </div>

                {widthValid && heightValid && (
                  <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: '#f0f4f8', border: '1px solid #d9d9d9' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '13px', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      COMPUTED AREA: <strong style={{ color: '#15263c' }}>{fmt2(sqm)} m²</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#54667d', fontFamily: 'var(--font-body)' }}>
                      {fmt2(fromMeters(wMeters, 'cm'))} cm × {fmt2(fromMeters(hMeters, 'cm'))} cm
                      {' | '}
                      {fmt2(wMeters)} m × {fmt2(hMeters)} m
                      {' | '}
                      {fmt2(fromMeters(wMeters, 'ft'))} ft × {fmt2(fromMeters(hMeters, 'ft'))} ft
                    </div>
                  </div>
                )}

                {/* Address */}
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', marginTop: '8px' }}>
                  DELIVERY / INSTALLATION ADDRESS
                </h3>
                <div className="mb-6">
                  <textarea
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onBlur={() => { if (!addressTouched) setAddressTouched(true); }}
                    placeholder="e.g. 123 Rizal St., Brgy. San Antonio, Makati City, Metro Manila 1203"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg outline-none resize-none"
                    style={inputStyle(addressTouched && !addressValid)}
                    onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                  />
                  {addressTouched && !addressValid && (
                    <InlineError message={ADDRESS_ERROR_MESSAGE} />
                  )}
                </div>
              </div>

              {/* Contact info column */}
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  YOUR INFORMATION
                </h2>
                <div className="mb-4">
                  <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-4 py-3 rounded-lg outline-none"
                    style={inputStyle()}
                    onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; }}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maria@email.com"
                    className="w-full px-4 py-3 rounded-lg outline-none"
                    style={inputStyle()}
                    onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; }}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Phone / Mobile</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => { if (!phoneTouched) setPhoneTouched(true); }}
                    placeholder="e.g. 09171234567"
                    className="w-full px-4 py-3 rounded-lg outline-none"
                    style={inputStyle(phoneTouched && !phoneValid)}
                    onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                  />
                  {phoneTouched && !phoneValid && phone.length > 0 && (
                    <InlineError message={PHONE_ERROR_MESSAGE} />
                  )}
                </div>
                <div>
                  <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Additional Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. specific design preference, location notes, urgency..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg outline-none resize-none"
                    style={inputStyle()}
                    onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d9d9d9'; }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======== Step 3: Summary ======== */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  PROJECT SPECIFICATION
                </h2>
                <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                  {/* Glass diagram */}
                  <div className="flex justify-center mb-6">
                    <div className="relative" style={{ width: '200px', height: '150px' }}>
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          border: '4px solid #15263c',
                          borderRadius: '4px',
                          backgroundColor: (glassType !== 'other' ? selectedGlass?.color : 'rgba(200,200,200,0.3)') || 'rgba(200,230,255,0.5)',
                        }}
                      >
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)' }} />
                      </div>
                      <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center">
                        <div style={{ fontSize: '12px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                          ←— {width || '?'} {UNIT_LABELS[measureUnit]} —→
                        </div>
                      </div>
                      <div className="absolute -right-14 top-0 bottom-0 flex items-center">
                        <div style={{ fontSize: '12px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                          ↕ {height || '?'} {UNIT_LABELS[measureUnit]}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Specs list */}
                  <div className="mt-10 space-y-3">
                    {[
                      { label: 'Project Type', value: category === 'other' ? `Other: ${sanitizeOtherInput(categoryOther)}` : selectedCategory?.label },
                      { label: 'Glass Type', value: glassType === 'other' ? `Other: ${sanitizeOtherInput(glassTypeOther)}` : selectedGlass?.label },
                      { label: 'Glass Spec', value: glassType !== 'other' ? selectedGlass?.thickness : 'Custom' },
                      { label: 'Color', value: colorChoice === 'other' ? `Other: ${sanitizeOtherInput(colorOther)}` : selectedColor?.label },
                      { label: 'Frame Material', value: selectedFrame?.label },
                      { label: 'Dimensions', value: width && height ? `${width} ${UNIT_LABELS[measureUnit]} \u00d7 ${height} ${UNIT_LABELS[measureUnit]}` : 'Not set' },
                      { label: 'Dimensions (cm)', value: widthValid && heightValid ? `${fmt2(fromMeters(wMeters, 'cm'))} cm \u00d7 ${fmt2(fromMeters(hMeters, 'cm'))} cm` : '\u2014' },
                      { label: 'Dimensions (m)', value: widthValid && heightValid ? `${fmt2(wMeters)} m \u00d7 ${fmt2(hMeters)} m` : '\u2014' },
                      { label: 'Dimensions (ft)', value: widthValid && heightValid ? `${fmt2(fromMeters(wMeters, 'ft'))} ft \u00d7 ${fmt2(fromMeters(hMeters, 'ft'))} ft` : '\u2014' },
                      { label: 'Area', value: sqm > 0 ? `${fmt2(sqm)} m\u00b2` : 'Not computed' },
                      { label: 'Address', value: sanitizeTextInput(address) || '\u2014' },
                      { label: 'Client Name', value: name || '\u2014' },
                      { label: 'Contact', value: maskPhone(cleanedPhone) },
                    ].map((s) => (
                      <div key={s.label} className="flex items-start justify-between py-2" style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', flexShrink: 0, marginRight: '12px' }}>{s.label}</span>
                        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{s.value || '\u2014'}</span>
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
                <div className="rounded-xl p-6 mb-4" style={{ background: 'linear-gradient(135deg, #15263c, #1e3655)', borderRadius: '8px' }}>
                  <div style={{ color: '#9ab0c4', fontSize: '13px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>ESTIMATED TOTAL</div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
                    ₱{estimatedCost > 0 ? estimatedCost.toLocaleString() : '—'}
                  </div>
                  <div className="mt-3 px-3 py-1.5 rounded-lg inline-block" style={{ backgroundColor: 'rgba(255,165,0,0.2)', border: '1px solid rgba(255,165,0,0.4)' }}>
                    <span style={{ color: '#ffcc00', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                      ⚠ SUBJECT TO ADMIN APPROVAL
                    </span>
                  </div>
                  <div className="mt-5 space-y-2">
                    {[
                      { label: 'Base Rate', value: `\u20b1${(selectedCategory?.baseRate || 0).toLocaleString()}/m\u00b2` },
                      { label: 'Glass Type (+)', value: `\u00d7${selectedGlass?.multiplier || 1} factor` },
                      { label: 'Frame Type (+)', value: `\u00d7${selectedFrame?.multiplier || 1} factor` },
                      { label: 'Area', value: `${fmt2(sqm)} m\u00b2` },
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

                {submitError && (
                  <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#fdecea', border: '1px solid #f5c6cb' }}>
                    <span style={{ color: '#d32f2f', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{submitError}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowConfirm(true)}
                  className="min-h-[56px]"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: 'linear-gradient(135deg, #7a0000, #a50000)',
                    color: 'white',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontSize: '17px',
                    padding: '16px 24px',
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
            className="min-h-[52px]"
            style={{
              fontFamily: 'var(--font-heading)',
              background: step === 0 ? '#e0e0e0' : 'transparent',
              color: step === 0 ? '#aaa' : '#15263c',
              fontWeight: 600,
              letterSpacing: '0.06em',
              fontSize: '15px',
              padding: '13px 24px',
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
              className="min-h-[52px]"
              style={{
                fontFamily: 'var(--font-heading)',
                background: canProceed() ? 'linear-gradient(135deg, #15263c, #1e3655)' : '#d9d9d9',
                color: canProceed() ? 'white' : '#aaa',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '15px',
                padding: '13px 28px',
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); handleSubmit(); }}
        data={buildConfirmData()}
      />
    </div>
  );
}
