import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Check, Info, ChevronRight, ChevronLeft, ArrowRight, X } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getCsrfToken } from '../services/csrf';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
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

const PROJECT_CATEGORIES = [
  { id: 'storefront', label: 'Storefront', desc: 'Full commercial front with door & windows', img: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 1800 },
  { id: 'sliding-window', label: 'Sliding Window', desc: 'Horizontal sliding window panel', img: 'https://images.unsplash.com/photo-1506016427870-22fd0e1f923c?q=80&w=691&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 1200 },
  { id: 'glass-door', label: 'Glass Door', desc: 'Swing or sliding door with frame', img: 'https://images.unsplash.com/photo-1736593319421-250e17bb2f11?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 2200 },
  { id: 'aluminum-door', label: 'Aluminum Door', desc: 'Durable framed door system for entryways', img: 'https://images.unsplash.com/photo-1699813748627-f04bdb93cf15?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 2100 },
  { id: 'glass-partition', label: 'Glass Partition', desc: 'Interior divider or office partition', img: 'https://images.unsplash.com/photo-1765766600457-abfd14dd502c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 1500 },
  { id: 'awning-window', label: 'Awning Window', desc: 'Top-hinged outward opening window', img: 'https://media.istockphoto.com/id/655652796/photo/awning-window-open-modern-home-aluminium-push-windows.webp?a=1&b=1&s=612x612&w=0&k=20&c=qelS_2zVcZ1p_mT2Z8qwUjULmq-NADK5tRWUe-12BwU=', baseRate: 1100 },
  { id: 'fixed-window', label: 'Fixed Window', desc: 'Non-operable picture window', img: 'https://images.unsplash.com/photo-1719067720887-b55ecfdd21b2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 900 },
  { id: 'other', label: 'Other', desc: 'Other – Please specify', img: 'https://plus.unsplash.com/premium_photo-1661887292823-f92842e8609d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', baseRate: 1200 },
];

const GLASS_TYPES = [
  { id: 'clear', label: 'Clear Glass', desc: 'Standard transparency, maximum light', color: 'rgba(200,230,255,0.5)', border: '#90caf9', multiplier: 1.0, thickness: '6mm standard' },
  { id: 'bronze', label: 'Bronze Glass', desc: 'Warm tint, reduces glare & heat', color: 'rgba(205,152,70,0.3)', border: '#cd9846', multiplier: 1.25, thickness: '6mm tinted' },
  { id: 'frosted', label: 'Frosted Glass', desc: 'Diffused light, privacy-enhancing', color: 'rgba(230,230,230,0.5)', border: '#aaa', multiplier: 1.35, thickness: '6mm acid-etched' },
  { id: 'tempered', label: 'Tempered Glass', desc: 'Safety-grade, 5× stronger than clear', color: 'rgba(180,210,255,0.4)', border: '#1565c0', multiplier: 1.6, thickness: '10mm tempered' },
];

const COLOR_OPTIONS = [
  { id: 'clear', label: 'Clear', desc: 'No tint', swatch: 'rgba(200,230,255,0.6)' },
  { id: 'euro-gray', label: 'Euro Gray', desc: 'Soft neutral gray tint', swatch: '#6b7a8c' },
  { id: 'dark-gray', label: 'Dark Gray', desc: 'Deep neutral gray tint', swatch: '#4a5460' },
  { id: 'bronze', label: 'Bronze', desc: 'Warm bronze tint', swatch: '#8b6f47' },
  { id: 'dark-bronze', label: 'Dark Bronze', desc: 'Richer bronze tint', swatch: '#6e5433' },
  { id: 'green', label: 'Green', desc: 'Green tint', swatch: '#7ba89d' },
];

const FRAME_MATERIALS = [
  { id: 'aluminum', label: 'Aluminum Frame', desc: 'Lightweight, rust-proof, standard finish', multiplier: 1.0 },
  { id: 'steel', label: 'Steel Frame', desc: 'Heavy-duty, industrial look', multiplier: 1.3 },
  { id: 'stainless', label: 'Stainless Frame', desc: 'Premium finish, corrosion-resistant', multiplier: 1.5 },
];

const UNIT_LABELS: Record<MeasurementUnit, string> = { cm: 'cm', m: 'm', ft: 'ft', in: 'in' };
const API_ROOT = (import.meta as any).env?.VITE_API_URL || '/api';
const FEET_PER_METER = 3.280839895;
const PRICE_PER_SQ_FOOT = 350;
const STEPS = ['Info', 'Category', 'Materials', 'Dimensions', 'Reservation', 'Summary'];
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DIMENSION_FEET = 20;
const MAX_DIMENSION_MESSAGE = 'Maximum allowed dimension is 20 ft (6.096 m / 609.6 cm / 240 in).';
const MAX_DIMENSION_BY_UNIT: Record<MeasurementUnit, number> = {
  cm: 609.6,
  m: 6.096,
  ft: 20,
  in: 240,
};
const DRAFT_VERSION = 1;
const DRAFT_STORAGE_PREFIX = 'ermel_quote_draft_v1';
const DRAFT_TTL_MS = 7 * DAY_MS;
const AUTOSAVE_DEBOUNCE_MS = 600;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeDateOnly(value: string): string {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return isoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
}

type QuoteDraftData = {
  step: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  category: string | null;
  categoryOther: string;
  glassType: string | null;
  colorChoice: string | null;
  frameMaterial: string | null;
  measureUnit: MeasurementUnit;
  width: string;
  height: string;
  widthOrigUnit: MeasurementUnit;
  heightOrigUnit: MeasurementUnit;
  widthOrigVal: string;
  heightOrigVal: string;
  reservationDate: string;
  estimatedCost: number;
  areaSqFeet: number;
  sqm: number;
};

type QuoteDraft = {
  version: number;
  updatedAt: string;
  userKey: string;
  data: QuoteDraftData;
};

function getDraftStorageKeys(user: { id?: string; email?: string } | null): string[] {
  if (!user) return [];
  const keys: string[] = [];
  if (user.id) keys.push(`${DRAFT_STORAGE_PREFIX}:${user.id}`);
  if (user.email) keys.push(`${DRAFT_STORAGE_PREFIX}:${user.email}`);
  return keys;
}

function parseDraft(raw: string): QuoteDraft | null {
  try {
    const parsed = JSON.parse(raw) as QuoteDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.updatedAt !== 'string') return null;
    if (!parsed.data || typeof parsed.data !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function isDraftExpired(updatedAt: string): boolean {
  const ts = new Date(updatedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > DRAFT_TTL_MS;
}

function clampStep(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(STEPS.length - 1, Math.max(0, value));
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 30000) return 'just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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

function InlineError({ message }: { message: string }) {
  return (
    <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
      {message}
    </div>
  );
}

function OtherTextInput({ value, onChange, placeholder = 'Please specify...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
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
        style={{ border: isError ? '2px solid #d32f2f' : '2px solid #d9d9d9', borderRadius: '8px', fontSize: '15px', fontFamily: 'var(--font-body)', backgroundColor: 'white' }}
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

interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  rows: Array<{ label: string; value: string }>;
}

function ConfirmationModal({ open, onCancel, onConfirm, rows }: ConfirmModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === backdropRef.current) onCancel(); }}
    >
      <div className="w-full max-w-lg rounded-2xl p-6 relative" style={{ backgroundColor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{r.value || '—'}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            style={{ flex: 1, fontFamily: 'var(--font-heading)', background: 'transparent', color: '#54667d', fontWeight: 600, fontSize: '15px', padding: '14px 24px', borderRadius: '8px', border: '2px solid #d9d9d9', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', minHeight: '52px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #7a0000, #a50000)', color: 'white', fontWeight: 700, fontSize: '15px', padding: '14px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(122,0,0,0.4)', minHeight: '52px' }}
          >
            Confirm &amp; Submit
          </button>
        </div>
      </div>
    </div>
  );
}

interface DraftRestoreModalProps {
  open: boolean;
  stepLabel: string;
  lastSavedLabel: string;
  onResume: () => void;
  onStartOver: () => void;
}

function DraftRestoreModal({ open, stepLabel, lastSavedLabel, onResume, onStartOver }: DraftRestoreModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
          Resume your quote?
        </h2>
        <p style={{ color: '#54667d', fontSize: '13px', marginBottom: '16px', fontFamily: 'var(--font-body)' }}>
          We found a saved draft from {lastSavedLabel}. You can continue where you left off or start a new request.
        </p>
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e4ea' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#54667d', marginBottom: '6px' }}>
            Last saved step
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#15263c' }}>
            {stepLabel}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onStartOver}
            style={{ flex: 1, fontFamily: 'var(--font-heading)', background: 'transparent', color: '#54667d', fontWeight: 600, fontSize: '14px', padding: '12px 20px', borderRadius: '8px', border: '2px solid #d9d9d9', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Start Over
          </button>
          <button
            onClick={onResume}
            style={{ flex: 1, fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #15263c, #1e3655)', color: 'white', fontWeight: 700, fontSize: '14px', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Resume Draft
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuotationModule() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [glassType, setGlassType] = useState<string | null>(null);
  const [colorChoice, setColorChoice] = useState<string | null>(null);
  const [frameMaterial, setFrameMaterial] = useState<string | null>(null);

  const [categoryOther, setCategoryOther] = useState('');

  const [measureUnit, setMeasureUnit] = useState<MeasurementUnit>('cm');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [widthOrigUnit, setWidthOrigUnit] = useState<MeasurementUnit>('cm');
  const [heightOrigUnit, setHeightOrigUnit] = useState<MeasurementUnit>('cm');
  const [widthOrigVal, setWidthOrigVal] = useState('');
  const [heightOrigVal, setHeightOrigVal] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  const [reservationDate, setReservationDate] = useState('');
  const [reservedDates, setReservedDates] = useState<Set<string>>(new Set());
  const [reservationError, setReservationError] = useState('');
  const [popularMaterials, setPopularMaterials] = useState<api.PopularMaterialsSummary | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<QuoteDraft | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autosaveTick, setAutosaveTick] = useState(0);
  const [externalDraftAvailable, setExternalDraftAvailable] = useState(false);
  const [externalDraftUpdatedAt, setExternalDraftUpdatedAt] = useState<Date | null>(null);
  const hasCheckedDraftRef = useRef(false);

  const draftKeys = useMemo(() => getDraftStorageKeys(user), [user?.id, user?.email]);
  const primaryDraftKey = draftKeys[0] ?? null;

  const loadReservedDates = useCallback(() => {
    api.fetchReservedDates()
      .then((rows) => setReservedDates(new Set(rows.map(normalizeDateOnly))))
      .catch(() => setReservedDates(new Set()));
  }, []);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.fullName) setName(user.fullName);
  }, [user]);

  useEffect(() => {
    loadReservedDates();
  }, [loadReservedDates]);

  useEffect(() => {
    if (step !== 4) return;

    loadReservedDates();
    const timer = window.setInterval(() => {
      loadReservedDates();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [step, loadReservedDates]);

  useEffect(() => {
    api.trackAnalyticsEvent('quote_started', {
      source: 'quotation_module',
      userEmail: user?.email,
    });
  }, [user?.email]);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const minSelectableDate = useMemo(() => new Date(today.getTime() + 7 * DAY_MS), [today]);
  const maxSelectableDate = useMemo(() => new Date(today.getTime() + 60 * DAY_MS), [today]);

  const isDateSelectable = useCallback((date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayStr = isoDate(day);
    if (day < minSelectableDate || day > maxSelectableDate) return false;
    if (reservedDates.has(dayStr)) return false;
    return true;
  }, [minSelectableDate, maxSelectableDate, reservedDates]);

  useEffect(() => {
    if (!reservationDate) return;
    if (!reservedDates.has(reservationDate)) return;

    setReservationDate('');
    setReservationError('This date has just been booked by another customer. Please choose another date.');
  }, [reservationDate, reservedDates]);

  const selectedCategory = PROJECT_CATEGORIES.find((c) => c.id === category);
  const selectedGlass = GLASS_TYPES.find((g) => g.id === glassType);
  const selectedFrame = FRAME_MATERIALS.find((f) => f.id === frameMaterial);
  const selectedColor = COLOR_OPTIONS.find((c) => c.id === colorChoice);
  const recommendedGlassId = popularMaterials?.glassType
    ? GLASS_TYPES.find((g) => g.label.toLowerCase() === popularMaterials.glassType?.toLowerCase())?.id ?? null
    : null;
  const recommendedColorId = popularMaterials?.color
    ? COLOR_OPTIONS.find((c) => c.label.toLowerCase() === popularMaterials.color?.toLowerCase())?.id ?? null
    : null;
  const recommendedFrameId = popularMaterials?.frameMaterial
    ? FRAME_MATERIALS.find((f) => f.label.toLowerCase() === popularMaterials.frameMaterial?.toLowerCase())?.id ?? null
    : null;
  const hasPopularMaterials = !!(popularMaterials?.glassType || popularMaterials?.color || popularMaterials?.frameMaterial);

  useEffect(() => {
    if (!selectedCategory?.label || step !== 2) return;

    let isCancelled = false;

    api.fetchPopularMaterials(selectedCategory.label)
      .then((data) => {
        if (!isCancelled) setPopularMaterials(data);
      })
      .catch(() => {
        if (!isCancelled) setPopularMaterials(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory?.label, step]);

  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;

  const wMeters = toMeters(w, measureUnit);
  const hMeters = toMeters(h, measureUnit);
  const sqm = wMeters * hMeters;
  const widthFeet = wMeters * FEET_PER_METER;
  const heightFeet = hMeters * FEET_PER_METER;
  const areaSqFeet = widthFeet * heightFeet;
  const areaUnitLabel = `${UNIT_LABELS[measureUnit]}^2`;
  const areaInChosenUnit = fromMeters(wMeters, measureUnit) * fromMeters(hMeters, measureUnit);

  const estimatedCost = Math.round(areaSqFeet * PRICE_PER_SQ_FOOT * 100) / 100 || 0;

  const cleanedPhone = cleanPhoneInput(phone);
  const phoneValid = isValidPhPhone(cleanedPhone);

  const widthExceedsLimit = w > 0 && widthFeet > MAX_DIMENSION_FEET;
  const heightExceedsLimit = h > 0 && heightFeet > MAX_DIMENSION_FEET;
  const widthValid = w > 0 && isValidMeasurement(w, measureUnit) && !widthExceedsLimit;
  const heightValid = h > 0 && isValidMeasurement(h, measureUnit) && !heightExceedsLimit;
  const addressValid = isValidAddress(address);

  const categoryOtherValid = category !== 'other' || isValidOtherInput(categoryOther);

  const infoValid = !!name.trim() && !!email.trim() && phoneValid && addressValid;

  const canProceed = useCallback((): boolean => {
    if (step === 0) return infoValid;
    if (step === 1) return !!category && categoryOtherValid;
    if (step === 2) return !!glassType && !!frameMaterial && !!colorChoice;
    if (step === 3) return widthValid && heightValid;
    if (step === 4) return !!reservationDate;
    return true;
  }, [step, infoValid, category, categoryOtherValid, glassType, frameMaterial, colorChoice, widthValid, heightValid, reservationDate]);

  const draftState = useMemo<QuoteDraftData>(() => ({
    step,
    name,
    email: user?.email || email,
    phone,
    address,
    notes,
    category,
    categoryOther,
    glassType,
    colorChoice,
    frameMaterial,
    measureUnit,
    width,
    height,
    widthOrigUnit,
    heightOrigUnit,
    widthOrigVal,
    heightOrigVal,
    reservationDate,
    estimatedCost,
    areaSqFeet,
    sqm,
  }), [
    step,
    name,
    user?.email,
    email,
    phone,
    address,
    notes,
    category,
    categoryOther,
    glassType,
    colorChoice,
    frameMaterial,
    measureUnit,
    width,
    height,
    widthOrigUnit,
    heightOrigUnit,
    widthOrigVal,
    heightOrigVal,
    reservationDate,
    estimatedCost,
    areaSqFeet,
    sqm,
  ]);

  const shouldSaveDraft = useMemo(() => {
    const nameChanged = name.trim() && name.trim() !== (user?.fullName || '').trim();
    const hasFields = !!(
      phone ||
      address ||
      notes ||
      category ||
      categoryOther ||
      glassType ||
      colorChoice ||
      frameMaterial ||
      width ||
      height ||
      reservationDate
    );
    return nameChanged || hasFields || step > 0;
  }, [
    name,
    user?.fullName,
    phone,
    address,
    notes,
    category,
    categoryOther,
    glassType,
    colorChoice,
    frameMaterial,
    width,
    height,
    reservationDate,
    step,
  ]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!draftKeys.length) return;
    try {
      draftKeys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }
    setLastSavedAt(null);
    setExternalDraftAvailable(false);
    setExternalDraftUpdatedAt(null);
  }, [draftKeys]);

  const saveDraft = useCallback(() => {
    if (!primaryDraftKey || !autoSaveEnabled || submitted) return;
    if (typeof window === 'undefined') return;
    if (!shouldSaveDraft) {
      clearDraft();
      return;
    }
    const payload: QuoteDraft = {
      version: DRAFT_VERSION,
      updatedAt: new Date().toISOString(),
      userKey: user?.id || user?.email || '',
      data: draftState,
    };
    try {
      window.localStorage.setItem(primaryDraftKey, JSON.stringify(payload));
      draftKeys.slice(1).forEach((key) => window.localStorage.removeItem(key));
      setLastSavedAt(new Date(payload.updatedAt));
      setExternalDraftAvailable(false);
      setExternalDraftUpdatedAt(null);
    } catch {
      // Ignore storage errors
    }
  }, [primaryDraftKey, autoSaveEnabled, submitted, shouldSaveDraft, clearDraft, user?.id, user?.email, draftState, draftKeys]);

  const loadDraft = useCallback((): QuoteDraft | null => {
    if (typeof window === 'undefined') return null;
    for (const key of draftKeys) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = parseDraft(raw);
      if (!parsed || parsed.version !== DRAFT_VERSION || isDraftExpired(parsed.updatedAt)) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore storage errors
        }
        continue;
      }
      return parsed;
    }
    return null;
  }, [draftKeys]);

  const applyDraft = useCallback((draft: QuoteDraft) => {
    const data = draft.data || ({} as QuoteDraftData);
    const safeStep = clampStep(Number(data.step));
    const safeUnit: MeasurementUnit = data.measureUnit && UNIT_LABELS[data.measureUnit]
      ? data.measureUnit
      : 'cm';

    setStep(safeStep);
    setName(data.name || user?.fullName || '');
    setEmail(user?.email || data.email || '');
    setPhone(data.phone || '');
    setAddress(data.address || '');
    setNotes(data.notes || '');
    setCategory(data.category ?? null);
    setCategoryOther(data.categoryOther || '');
    setGlassType(data.glassType ?? null);
    setColorChoice(data.colorChoice ?? null);
    setFrameMaterial(data.frameMaterial ?? null);
    setMeasureUnit(safeUnit);
    setWidth(data.width || '');
    setHeight(data.height || '');
    setWidthOrigUnit(data.widthOrigUnit || safeUnit);
    setHeightOrigUnit(data.heightOrigUnit || safeUnit);
    setWidthOrigVal(data.widthOrigVal || data.width || '');
    setHeightOrigVal(data.heightOrigVal || data.height || '');
    setReservationDate(data.reservationDate ? normalizeDateOnly(data.reservationDate) : '');
    setSubmitted(false);
    setShowConfirm(false);
    setSubmitError('');
    setReservationError('');
    setPhoneTouched(false);
    setAddressTouched(false);
  }, [user?.email, user?.fullName]);

  useEffect(() => {
    if (!user || hasCheckedDraftRef.current) return;
    const draft = loadDraft();
    if (draft) {
      setPendingDraft(draft);
      setDraftPromptOpen(true);
      setAutoSaveEnabled(false);
      if (draft.updatedAt) setLastSavedAt(new Date(draft.updatedAt));
    } else {
      setAutoSaveEnabled(true);
    }
    hasCheckedDraftRef.current = true;
  }, [user, loadDraft]);

  useEffect(() => {
    if (!lastSavedAt) return;
    const timer = window.setInterval(() => {
      setAutosaveTick((tick) => tick + 1);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [lastSavedAt]);

  useEffect(() => {
    if (!autoSaveEnabled || submitted || !primaryDraftKey) return;
    const timer = window.setTimeout(() => {
      saveDraft();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [autoSaveEnabled, submitted, primaryDraftKey, saveDraft, draftState]);

  useEffect(() => {
    if (!autoSaveEnabled || submitted || !primaryDraftKey) return;
    saveDraft();
  }, [step, autoSaveEnabled, submitted, primaryDraftKey, saveDraft]);

  useEffect(() => {
    if (!primaryDraftKey) return;
    const handler = (e: StorageEvent) => {
      if (e.key !== primaryDraftKey) return;
      if (!e.newValue) {
        setExternalDraftAvailable(false);
        setExternalDraftUpdatedAt(null);
        return;
      }
      const parsed = parseDraft(e.newValue);
      if (!parsed || parsed.version !== DRAFT_VERSION || isDraftExpired(parsed.updatedAt)) {
        try {
          window.localStorage.removeItem(primaryDraftKey);
        } catch {
          // Ignore storage errors
        }
        setExternalDraftAvailable(false);
        setExternalDraftUpdatedAt(null);
        return;
      }
      const updatedAt = new Date(parsed.updatedAt);
      if (!lastSavedAt || updatedAt.getTime() > lastSavedAt.getTime()) {
        setPendingDraft(parsed);
        setExternalDraftUpdatedAt(updatedAt);
        setExternalDraftAvailable(true);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [primaryDraftKey, lastSavedAt]);

  const handleUnitChange = (newUnit: MeasurementUnit) => {
    if (newUnit === measureUnit) return;

    if (widthOrigVal) {
      const origW = parseFloat(widthOrigVal);
      if (!isNaN(origW) && origW > 0) setWidth(fmt2(convertUnit(origW, widthOrigUnit, newUnit)));
    }

    if (heightOrigVal) {
      const origH = parseFloat(heightOrigVal);
      if (!isNaN(origH) && origH > 0) setHeight(fmt2(convertUnit(origH, heightOrigUnit, newUnit)));
    }

    setMeasureUnit(newUnit);
  };

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

  const handleAddressChange = (val: string) => {
    setAddress(sanitizeTextInput(val));
  };

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

    const quotePayload = {
      customer: finalName,
      email: finalEmail,
      phone_plain: finalPhone,
      address: finalAddress,
      notes: finalNotes || undefined,
      project: category === 'other' ? `Other: ${sanitizeOtherInput(categoryOther)}` : (selectedCategory?.label || ''),
      projectCategoryOther: category === 'other' ? sanitizeOtherInput(categoryOther) : null,
      material: selectedFrame?.label || '',
      glassType: selectedGlass?.label || '',
      color: selectedColor?.label || 'Clear',
      dimensions: `${width}${unitLabel} × ${height}${unitLabel}`,
      width: w,
      height: h,
      widthM: wUnits.m,
      heightM: hUnits.m,
      widthCm: wUnits.cm,
      heightCm: hUnits.cm,
      widthFt: wUnits.ft,
      heightFt: hUnits.ft,
      measurementUnit: measureUnit,
      estimatedCost,
      quantity: 1,
      reservationDate,
    };

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_ROOT}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(quotePayload),
      });

      if (res.status === 401) {
        navigate('/login?redirect=%2Fquote');
        return;
      }
      if (res.status === 403) {
        navigate('/verification-required');
        return;
      }
      if (res.status === 429) {
        setSubmitError('Too many quote requests. Please try again later.');
        return;
      }
      if (res.status === 409) {
        const body = await res.json().catch(() => null);
        setReservationError(body?.error || body?.message || 'The selected reservation date is already booked. Please choose another date.');
        loadReservedDates();
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) {
          setStep(4);
          setReservationDate('');
          setReservationError(body?.error || body?.message || 'The selected reservation date is already booked. Please choose another date.');
          loadReservedDates();
          return;
        }
        setSubmitError(body?.error || body?.message || 'Unable to submit your quote right now. Please try again.');
        return;
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
      return;
    }

    setSubmitted(true);
    clearDraft();
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(0);
    setCategory(null);
    setGlassType(null);
    setColorChoice(null);
    setFrameMaterial(null);
    setCategoryOther('');
    setWidth('');
    setHeight('');
    setWidthOrigVal('');
    setHeightOrigVal('');
    setMeasureUnit('cm');
    setPhone('');
    setAddress('');
    setNotes('');
    setReservationDate('');
    setPhoneTouched(false);
    setAddressTouched(false);
    setSubmitError('');
    setReservationError('');
    setLastSavedAt(null);
    setExternalDraftAvailable(false);
    setExternalDraftUpdatedAt(null);
    if (user?.fullName) setName(user.fullName);
    if (user?.email) setEmail(user.email);
  };

  const resumeDraft = () => {
    if (!pendingDraft) return;
    applyDraft(pendingDraft);
    setDraftPromptOpen(false);
    setAutoSaveEnabled(true);
    setPendingDraft(null);
    setExternalDraftAvailable(false);
    setExternalDraftUpdatedAt(null);
    if (pendingDraft.updatedAt) setLastSavedAt(new Date(pendingDraft.updatedAt));
  };

  const startOverDraft = () => {
    clearDraft();
    setDraftPromptOpen(false);
    setPendingDraft(null);
    setAutoSaveEnabled(true);
    resetForm();
  };

  const dismissExternalDraft = () => {
    setExternalDraftAvailable(false);
    setExternalDraftUpdatedAt(null);
  };

  const confirmationRows = [
    { label: 'Full Name', value: name },
    { label: 'Email', value: email },
    { label: 'Phone', value: maskPhone(cleanedPhone) },
    { label: 'Address', value: sanitizeTextInput(address) },
    { label: 'Project Category', value: category === 'other' ? `Other: ${sanitizeOtherInput(categoryOther)}` : (selectedCategory?.label || '') },
    { label: 'Glass Type', value: selectedGlass?.label || '' },
    { label: 'Color', value: selectedColor?.label || '' },
    { label: 'Frame Material', value: selectedFrame?.label || '' },
    { label: 'Dimensions', value: `${width} ${UNIT_LABELS[measureUnit]} × ${height} ${UNIT_LABELS[measureUnit]}` },
    { label: 'Reservation Date', value: reservationDate || '—' },
    { label: 'Notes', value: sanitizeTextInput(notes) || '—' },
  ];

  const inputStyle = (hasError = false) => ({
    border: hasError ? '2px solid #d32f2f' : '2px solid #d9d9d9',
    borderRadius: '8px' as const,
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    backgroundColor: hasError ? '#fff5f5' : 'white',
  });

  const stepProgress = ((step + 1) / STEPS.length) * 100;

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return '';
    return `Auto-saved ${formatTimeAgo(lastSavedAt)}`;
  }, [lastSavedAt, autosaveTick]);

  const pendingDraftStepLabel = useMemo(() => {
    if (!pendingDraft) return STEPS[0];
    return STEPS[clampStep(Number(pendingDraft.data?.step ?? 0))];
  }, [pendingDraft]);

  const pendingDraftTimeLabel = useMemo(() => {
    if (!pendingDraft?.updatedAt) return 'recently';
    const parsed = new Date(pendingDraft.updatedAt);
    if (Number.isNaN(parsed.getTime())) return 'recently';
    return parsed.toLocaleString();
  }, [pendingDraft]);

  const externalDraftLabel = useMemo(() => {
    if (!externalDraftUpdatedAt) return 'just now';
    return formatTimeAgo(externalDraftUpdatedAt);
  }, [externalDraftUpdatedAt, autosaveTick]);

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
            Check your status page to view your quote progress.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/check-status')}
              className="min-h-[52px]"
              style={{ fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #15263c, #1e3655)', color: 'white', fontWeight: 700, letterSpacing: '0.06em', fontSize: '16px', padding: '14px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Check My Status
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

  return (
    <div className="min-h-screen px-4 pb-16" style={{ backgroundColor: '#fafafa', paddingTop: '96px', fontFamily: 'var(--font-body)' }}>
      <div className="max-w-6xl mx-auto">
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

        <div className="hidden sm:flex items-center justify-center mb-10 gap-0 max-w-4xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300" style={{ backgroundColor: i < step ? '#15263c' : i === step ? '#7a0000' : '#d9d9d9', color: i <= step ? 'white' : '#54667d', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px' }}>
                  {i < step ? '✔' : i === step ? '➜' : '○'}
                </div>
                <span style={{ fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', color: i === step ? '#7a0000' : i < step ? '#15263c' : '#aaa', fontWeight: i === step ? 700 : 500 }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="h-0.5 flex-1 mx-1 rounded-full" style={{ backgroundColor: i < step ? '#15263c' : '#d9d9d9', marginBottom: '20px' }} />}
            </div>
          ))}
        </div>

        <div className="sm:hidden mb-8">
          <div className="mb-2 flex items-center justify-between" style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#54667d' }}>
            <span>{STEPS[step]}</span>
            <span>Step {step + 1}/{STEPS.length}</span>
          </div>
          <div style={{ height: '10px', borderRadius: '999px', backgroundColor: '#d9d9d9', overflow: 'hidden' }}>
            <div style={{ width: `${stepProgress}%`, height: '100%', background: 'linear-gradient(90deg, #15263c, #7a0000)', transition: 'width 0.25s ease' }} />
          </div>
        </div>

        {lastSavedAt && (
          <div className="text-center mb-6" style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#54667d' }}>
            {lastSavedLabel}
          </div>
        )}

        {externalDraftAvailable && !draftPromptOpen && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ backgroundColor: '#eef7ff', border: '1px solid #bfd8ee' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Draft updated in another tab
              </div>
              <div style={{ fontSize: '12px', color: '#35506d', fontFamily: 'var(--font-body)' }}>
                New changes were saved {externalDraftLabel}. Reload to sync your progress.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resumeDraft}
                style={{ fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #15263c, #1e3655)', color: 'white', fontWeight: 700, fontSize: '12px', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Reload Draft
              </button>
              <button
                onClick={dismissExternalDraft}
                style={{ fontFamily: 'var(--font-heading)', background: 'transparent', color: '#54667d', fontWeight: 600, fontSize: '12px', padding: '10px 16px', borderRadius: '8px', border: '2px solid #bfd8ee', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {step === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '20px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
                  CUSTOMER INFO
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg outline-none" style={inputStyle(!name.trim())} />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email Address</label>
                    <input type="email" value={email} readOnly className="w-full px-4 py-3 rounded-lg outline-none" style={{ ...inputStyle(false), backgroundColor: '#f5f7fa', color: '#54667d' }} />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Phone / Mobile</label>
                    <input type="tel" value={phone} onChange={(e) => { setPhone(cleanPhoneInput(e.target.value)); if (!phoneTouched) setPhoneTouched(true); }} onBlur={() => setPhoneTouched(true)} placeholder="e.g. 09171234567" className="w-full px-4 py-3 rounded-lg outline-none" style={inputStyle(phoneTouched && !phoneValid)} />
                    {phoneTouched && !phoneValid && phone.length > 0 && <InlineError message={PHONE_ERROR_MESSAGE} />}
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Address</label>
                    <textarea value={address} onChange={(e) => { setAddress(e.target.value); if (!addressTouched) setAddressTouched(true); }} onBlur={() => setAddressTouched(true)} rows={3} className="w-full px-4 py-3 rounded-lg outline-none resize-none" style={inputStyle(addressTouched && !addressValid)} />
                    {addressTouched && !addressValid && <InlineError message={ADDRESS_ERROR_MESSAGE} />}
                  </div>

                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ backgroundColor: '#fff8e1', border: '1px solid #f0c040' }}>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#7a4f00', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>
                  INFO REQUIREMENTS
                </div>
                <p style={{ fontSize: '13px', color: '#7a4f00', lineHeight: 1.7 }}>
                  Phone and address are required. Email is locked to your authenticated account and cannot be changed here.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' }}>
                SELECT PROJECT CATEGORY
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {PROJECT_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setCategory((prev) => (prev === cat.id ? null : cat.id))}
                    className="cursor-pointer rounded-xl overflow-hidden relative group transition-all duration-200"
                    style={{ border: category === cat.id ? '3px solid #7a0000' : '2px solid #d9d9d9', borderRadius: '8px', boxShadow: category === cat.id ? '0 4px 20px rgba(122,0,0,0.25)' : 'none', transform: category === cat.id ? 'translateY(-2px)' : 'none', minHeight: '60px' }}
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
                    <div className="p-3" style={{ backgroundColor: category === cat.id ? '#15263c' : 'white', textAlign: 'center' }}>
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

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>
                SELECT GLASS TYPE
              </h2>
              <p style={{ color: '#54667d', fontSize: '14px', textAlign: 'center', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
                Choose the glass, color, and frame material for your project
              </p>

              {hasPopularMaterials && (
                <div className="mb-5 p-4 rounded-xl" style={{ backgroundColor: '#eef7ff', border: '1px solid #bfd8ee' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Popular Choice for {selectedCategory?.label || 'this category'}
                  </div>
                  <div style={{ color: '#35506d', fontSize: '13px', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                    <strong>Glass:</strong> {popularMaterials?.glassType || '—'} | <strong>Tint:</strong> {popularMaterials?.color || '—'} | <strong>Frame:</strong> {popularMaterials?.frameMaterial || '—'}
                    {popularMaterials && popularMaterials.sampleSize > 0 && (
                      <span> | <strong>Based on:</strong> {popularMaterials.sampleSize} approved/confirmed quote{popularMaterials.sampleSize > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 max-w-4xl mx-auto">
                {GLASS_TYPES.map((g) => {
                  const isTopPick = !!recommendedGlassId && g.id === recommendedGlassId;
                  return (
                  <div key={g.id} onClick={() => setGlassType((prev) => (prev === g.id ? null : g.id))} className="cursor-pointer rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 relative overflow-hidden" style={{ border: glassType === g.id ? '3px solid #7a0000' : isTopPick ? '2px solid #f0c040' : '2px solid #d9d9d9', borderRadius: '8px', backgroundColor: 'white', boxShadow: glassType === g.id ? '0 4px 20px rgba(122,0,0,0.2)' : isTopPick ? '0 4px 20px rgba(240,192,64,0.25)' : 'none', minHeight: '60px' }}>
                    {isTopPick && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#f0c040', color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: '999px', textTransform: 'uppercase', zIndex: 3 }}>
                        POPULAR CHOICE!
                      </div>
                    )}
                    <div className="w-full rounded-lg mb-3 relative overflow-hidden" style={{ height: '80px', backgroundColor: g.color, border: `1px solid ${g.border}` }}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)' }} />
                      {g.id === 'tempered' && <div className="absolute bottom-2 left-2 right-2 text-center" style={{ fontSize: '10px', color: '#1565c0', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.1em' }}>TEMPERED</div>}
                      {g.id === 'frosted' && <div className="absolute inset-0" style={{ backdropFilter: 'blur(2px)', background: 'rgba(255,255,255,0.2)' }} />}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#15263c', textTransform: 'uppercase', marginBottom: '4px' }}>{g.label}</div>
                    <div style={{ fontSize: '11px', color: '#54667d', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>{g.desc}</div>
                    <div style={{ fontSize: '11px', color: '#7a0000', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>{g.thickness}</div>
                    {glassType === g.id && <div className="mt-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7a0000' }}><Check size={12} color="white" strokeWidth={3} /></div>}
                  </div>
                );})}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
                COLOR / TINT
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                {COLOR_OPTIONS.map((c) => {
                  const isTopPick = !!recommendedColorId && c.id === recommendedColorId;
                  return (
                  <div key={c.id} onClick={() => setColorChoice((prev) => (prev === c.id ? null : c.id))} className="cursor-pointer rounded-xl p-3 flex flex-col items-center text-center transition-all duration-200 relative overflow-hidden" style={{ border: colorChoice === c.id ? '3px solid #7a0000' : isTopPick ? '2px solid #f0c040' : '2px solid #d9d9d9', borderRadius: '8px', backgroundColor: 'white', boxShadow: colorChoice === c.id ? '0 2px 12px rgba(122,0,0,0.15)' : isTopPick ? '0 2px 12px rgba(240,192,64,0.2)' : 'none', minHeight: '60px' }}>
                    {isTopPick && (
                      <div style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: '#f0c040', color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase' }}>
                        POPULAR CHOICE!
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full mb-2" style={{ backgroundColor: c.swatch, border: colorChoice === c.id ? '2px solid #7a0000' : '1px solid #ccc' }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: '#15263c', textTransform: 'uppercase' }}>{c.label}</div>
                    <div style={{ fontSize: '10px', color: '#54667d', fontFamily: 'var(--font-body)' }}>{c.desc}</div>
                    {colorChoice === c.id && <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7a0000' }}><Check size={10} color="white" strokeWidth={3} /></div>}
                  </div>
                );})}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
                FRAME MATERIAL
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FRAME_MATERIALS.map((f) => {
                  const isSelected = frameMaterial === f.id;
                  const isTopPick = !!recommendedFrameId && f.id === recommendedFrameId;
                  return (
                    <div key={f.id} onClick={() => setFrameMaterial((prev) => (prev === f.id ? null : f.id))} className="cursor-pointer p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all duration-200 relative overflow-hidden" style={{ border: isSelected ? '2px solid #15263c' : isTopPick ? '2px solid #f0c040' : '2px solid #d9d9d9', borderRadius: '8px', backgroundColor: isSelected ? '#15263c' : 'white', boxShadow: isTopPick && !isSelected ? '0 4px 20px rgba(240,192,64,0.2)' : 'none', minHeight: '60px' }}>
                      {isTopPick && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: '#f0c040', color: '#15263c', fontFamily: 'var(--font-heading)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase' }}>
                          POPULAR CHOICE!
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#f0f2f5' }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: isSelected ? 'white' : '#54667d', backgroundColor: isSelected ? 'white' : 'transparent', transition: 'all 0.15s ease' }}>
                          {isSelected && <Check size={14} color="#15263c" strokeWidth={3} />}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: isSelected ? 'white' : '#15263c', textTransform: 'uppercase' }}>{f.label}</div>
                        <div style={{ fontSize: '12px', color: isSelected ? '#9ab0c4' : '#54667d', fontFamily: 'var(--font-body)' }}>{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                MEASUREMENTS
              </h2>

                {/* Unit switcher */}
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>UNIT:</span>
                  {(['cm', 'm', 'ft', 'in'] as MeasurementUnit[]).map((u) => (
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
                      placeholder={measureUnit === 'cm' ? 'e.g. 120' : measureUnit === 'm' ? 'e.g. 1.20' : measureUnit === 'ft' ? 'e.g. 3.94' : 'e.g. 47.24'}
                      min="0"
                      max={MAX_DIMENSION_BY_UNIT[measureUnit]}
                      step="any"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={inputStyle(width !== '' && !widthValid)}
                      onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                      onBlur={(e) => { e.target.style.borderColor = (width !== '' && !widthValid) ? '#d32f2f' : '#d9d9d9'; }}
                    />
                    {width !== '' && !widthValid && (
                      <InlineError message={w <= 0 ? 'Value must be greater than 0.' : widthExceedsLimit ? MAX_DIMENSION_MESSAGE : 'Enter a valid measurement.'} />
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
                      placeholder={measureUnit === 'cm' ? 'e.g. 150' : measureUnit === 'm' ? 'e.g. 1.50' : measureUnit === 'ft' ? 'e.g. 4.92' : 'e.g. 59.06'}
                      min="0"
                      max={MAX_DIMENSION_BY_UNIT[measureUnit]}
                      step="any"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={inputStyle(height !== '' && !heightValid)}
                      onFocus={(e) => { e.target.style.borderColor = '#15263c'; }}
                      onBlur={(e) => { e.target.style.borderColor = (height !== '' && !heightValid) ? '#d32f2f' : '#d9d9d9'; }}
                    />
                    {height !== '' && !heightValid && (
                      <InlineError message={h <= 0 ? 'Value must be greater than 0.' : heightExceedsLimit ? MAX_DIMENSION_MESSAGE : 'Enter a valid measurement.'} />
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
                      {fmt2(widthFeet)} ft × {fmt2(heightFeet)} ft
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
                <div>
                  <label className="block mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Additional Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg outline-none resize-none" style={inputStyle(false)} />
                </div>
              </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
                RESERVATION DATE
              </h2>
              <p style={{ color: '#54667d', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>
                Select one installation date. Booking starts 7 days from today and is limited to the next 60 days.
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-3" style={{ fontSize: '12px' }}>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: '#b7efc5', color: '#14532d', border: '1px solid #2e7d32', fontWeight: 700 }}>Green = Available</span>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: '#ffc9c9', color: '#7f1d1d', border: '1px solid #b91c1c', fontWeight: 700 }}>Red = Booked</span>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #64748b', fontWeight: 700 }}>Grey = Disabled</span>
              </div>

              <div style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '10px' }}>
                <FullCalendar
                  key={`reservation-calendar-${reservationDate || 'none'}-${reservedDates.size}`}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  initialDate={reservationDate || undefined}
                  fixedWeekCount={false}
                  height="auto"
                  dateClick={(info) => {
                    const selected = new Date(`${info.dateStr}T00:00:00`);
                    if (!isDateSelectable(selected)) {
                      setReservationError('Selected date is unavailable. Please pick an available date.');
                      return;
                    }
                    setReservationError('');
                    setReservationDate(info.dateStr);
                  }}
                  dayCellDidMount={(arg) => {
                    const cellDate = new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate());
                    const dateStr = isoDate(cellDate);
                    const dayNumberEl = arg.el.querySelector('.fc-daygrid-day-number') as HTMLElement | null;
                    let dayState: 'booked' | 'disabled' | 'available' = 'available';
                    const existingBadge = arg.el.querySelector('.ermel-booked-badge');
                    if (existingBadge) existingBadge.remove();
                    if (reservedDates.has(dateStr)) {
                      dayState = 'booked';
                      arg.el.style.backgroundColor = '#ffc9c9';
                      arg.el.style.color = '#7f1d1d';
                      arg.el.style.border = '1px solid #b91c1c';
                      arg.el.style.cursor = 'not-allowed';
                      arg.el.style.pointerEvents = 'none';
                      arg.el.style.position = 'relative';

                      const bookedBadge = document.createElement('div');
                      bookedBadge.className = 'ermel-booked-badge';
                      bookedBadge.textContent = 'Booked';
                      bookedBadge.style.position = 'absolute';
                      bookedBadge.style.left = '4px';
                      bookedBadge.style.right = '4px';
                      bookedBadge.style.bottom = '4px';
                      bookedBadge.style.borderRadius = '6px';
                      bookedBadge.style.padding = '1px 4px';
                      bookedBadge.style.background = 'linear-gradient(135deg, #7a0000, #a50000)';
                      bookedBadge.style.color = 'white';
                      bookedBadge.style.fontFamily = 'var(--font-heading)';
                      bookedBadge.style.fontSize = '10px';
                      bookedBadge.style.fontWeight = '700';
                      bookedBadge.style.letterSpacing = '0.06em';
                      bookedBadge.style.textAlign = 'center';
                      bookedBadge.style.textTransform = 'uppercase';
                      bookedBadge.style.lineHeight = '1.2';
                      bookedBadge.style.pointerEvents = 'none';
                      arg.el.appendChild(bookedBadge);
                    } else if (!isDateSelectable(cellDate)) {
                      dayState = 'disabled';
                      arg.el.style.backgroundColor = '#e2e8f0';
                      arg.el.style.color = '#334155';
                      arg.el.style.border = '1px solid #64748b';
                      arg.el.style.cursor = 'not-allowed';
                      arg.el.style.pointerEvents = 'none';
                    } else {
                      dayState = 'available';
                      arg.el.style.backgroundColor = '#b7efc5';
                      arg.el.style.color = '#14532d';
                      arg.el.style.border = '1px solid #2e7d32';
                      arg.el.style.cursor = 'pointer';
                      arg.el.style.pointerEvents = 'auto';
                    }

                    if (dayNumberEl) {
                      dayNumberEl.style.borderRadius = '6px';
                      dayNumberEl.style.padding = '2px 6px';
                      dayNumberEl.style.backgroundColor = dayState === 'booked'
                        ? '#b91c1c'
                        : dayState === 'disabled'
                          ? '#64748b'
                          : '#2e7d32';
                      dayNumberEl.style.color = 'white';
                      dayNumberEl.style.fontWeight = '700';
                    }

                    if (reservationDate && dateStr === reservationDate) {
                      arg.el.style.backgroundColor = '#9fdfb1';
                      arg.el.style.color = '#0f3f22';
                      arg.el.style.outline = '2px solid #15263c';
                      arg.el.style.outlineOffset = '-2px';
                      arg.el.style.boxShadow = 'inset 0 0 0 1px #2e7d32';
                      if (dayNumberEl) {
                        dayNumberEl.style.backgroundColor = '#15263c';
                        dayNumberEl.style.color = 'white';
                        dayNumberEl.style.fontWeight = '700';
                      }
                    }
                  }}
                />
              </div>

              <div className="mt-3" style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px' }}>
                Selected Date: {reservationDate || 'None'}
              </div>
              {reservationError && <InlineError message={reservationError} />}
            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  SUMMARY
                </h2>
                <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                  <div className="mt-2 space-y-3">
                    {[
                      { label: 'Customer Name', value: name || '—' },
                      { label: 'Email', value: email || '—' },
                      { label: 'Phone', value: maskPhone(cleanedPhone) },
                      { label: 'Address', value: sanitizeTextInput(address) || '—' },
                      { label: 'Project Type', value: category === 'other' ? `Other: ${sanitizeOtherInput(categoryOther)}` : selectedCategory?.label },
                      { label: 'Glass Type', value: selectedGlass?.label },
                      { label: 'Color', value: selectedColor?.label },
                      { label: 'Frame Material', value: selectedFrame?.label },
                      { label: 'Dimensions', value: width && height ? `${width} ${UNIT_LABELS[measureUnit]} \u00d7 ${height} ${UNIT_LABELS[measureUnit]}` : 'Not set' },
                      { label: `Area (${areaUnitLabel})`, value: widthValid && heightValid ? `${fmt2(areaInChosenUnit)} ${areaUnitLabel}` : 'Not computed' },
                      { label: 'Reservation Date', value: reservationDate || '—' },
                      { label: 'Notes', value: sanitizeTextInput(notes) || '—' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-start justify-between py-2" style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', flexShrink: 0, marginRight: '12px' }}>{s.label}</span>
                        <span style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{s.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px' }}>
                  COST ESTIMATE
                </h2>
                <div className="rounded-xl p-6 mb-4" style={{ background: 'linear-gradient(135deg, #15263c, #1e3655)', borderRadius: '8px' }}>
                  <div style={{ color: '#9ab0c4', fontSize: '13px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>ESTIMATED TOTAL</div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>₱{estimatedCost > 0 ? estimatedCost.toLocaleString() : '—'}</div>
                  <div className="mt-3 px-3 py-1.5 rounded-lg inline-block" style={{ backgroundColor: 'rgba(255,165,0,0.2)', border: '1px solid rgba(255,165,0,0.4)' }}>
                    <span style={{ color: '#ffcc00', fontSize: '11px', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                      ⚠ SUBJECT TO ADMIN APPROVAL
                    </span>
                  </div>
                  <div className="mt-5 space-y-2">
                    {[
                      { label: 'Rate', value: '\u20b1350 / ft²' },
                      { label: 'Area (ft²)', value: `${fmt2(areaSqFeet)} ft²` },
                      { label: 'Formula', value: 'Area × 350' },
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

                {submitError && <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#fdecea', border: '1px solid #f5c6cb' }}><span style={{ color: '#d32f2f', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{submitError}</span></div>}

                <button onClick={() => setShowConfirm(true)} className="min-h-[56px]" style={{ fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #7a0000, #a50000)', color: 'white', fontWeight: 700, letterSpacing: '0.06em', fontSize: '17px', padding: '16px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(122,0,0,0.4)' }}>
                  Submit Quote Request <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="min-h-[52px]"
            style={{ fontFamily: 'var(--font-heading)', background: step === 0 ? '#e0e0e0' : 'transparent', color: step === 0 ? '#aaa' : '#15263c', fontWeight: 600, letterSpacing: '0.06em', fontSize: '15px', padding: '13px 24px', borderRadius: '8px', border: `2px solid ${step === 0 ? '#e0e0e0' : '#15263c'}`, cursor: step === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 5 && (
            <button
              onClick={() => setStep(Math.min(5, step + 1))}
              disabled={!canProceed()}
              className="min-h-[52px]"
              style={{ fontFamily: 'var(--font-heading)', background: canProceed() ? 'linear-gradient(135deg, #15263c, #1e3655)' : '#d9d9d9', color: canProceed() ? 'white' : '#aaa', fontWeight: 700, letterSpacing: '0.06em', fontSize: '15px', padding: '13px 28px', borderRadius: '8px', border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}
            >
              Next Step <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <ConfirmationModal open={showConfirm} onCancel={() => setShowConfirm(false)} onConfirm={() => { setShowConfirm(false); handleSubmit(); }} rows={confirmationRows} />
      <DraftRestoreModal
        open={draftPromptOpen}
        stepLabel={pendingDraftStepLabel}
        lastSavedLabel={pendingDraftTimeLabel}
        onResume={resumeDraft}
        onStartOver={startOverDraft}
      />
    </div>
  );
}
