import { useState } from 'react';
import {
  User, Shield,
  Save, Eye, EyeOff, CheckCircle, ChevronRight, Mail,
  Phone, Building, Lock,
} from 'lucide-react';

type SettingsSection = 'profile' | 'security' | 'business';
const SESSION_TIMEOUT_STORAGE_KEY = 'ermel.admin.session.timeout';

const SECTIONS: { key: SettingsSection; label: string; icon: any; description: string }[] = [
  { key: 'profile',       label: 'Profile',       icon: User,     description: 'Manage your admin profile information' },
  { key: 'security',      label: 'Security',      icon: Shield,   description: 'Password, sessions, and access control' },
  { key: 'business',      label: 'Business Info',  icon: Building, description: 'Company details, pricing, and terms' },
];

// ── Reusable Components ──
function SettingRow({ label, description, children, showBorder = true }: { label: string; description?: string; children: React.ReactNode; showBorder?: boolean }) {
  return (
    <div className="flex items-start justify-between py-5" style={{ borderBottom: showBorder ? '1px solid #f0f3f7' : 'none' }}>
      <div style={{ maxWidth: '60%' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600 }}>{label}</div>
        {description && <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '3px', lineHeight: 1.5 }}>{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SaveButton({ label = 'Save Changes', onClick, disabled = false }: { label?: string; onClick?: () => void; disabled?: boolean }) {
  const [saved, setSaved] = useState(false);
  const handleClick = () => {
    if (disabled) return;
    setSaved(true);
    onClick?.();
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2"
      style={{ borderRadius: '6px', background: saved ? '#1a5c1a' : '#15263c', border: 'none', color: 'white', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', transition: 'background 0.2s' }}
    >
      {saved ? <CheckCircle size={14} /> : <Save size={14} />}
      {saved ? 'Saved!' : label}
    </button>
  );
}

// ── Profile Section ──
function ProfileSection() {
  const [form, setForm] = useState({ name: 'Ermel Admin', email: 'ermelglassaluminum@gmail.com', phone: '09171234567', role: 'Super Admin' });
  return (
    <div>
      <div className="flex items-center gap-4 p-5 mb-6" style={{ backgroundColor: '#f8f9fb', borderRadius: '8px', border: '1px solid #e0e4ea' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#15263c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '22px', fontWeight: 800 }}>EA</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 800 }}>{form.name}</div>
          <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{form.email}</div>
          <div style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', backgroundColor: '#e8ecf1', borderRadius: '4px', color: '#15263c', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {form.role}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Full Name', key: 'name', icon: User, disabled: true  },
          { label: 'Email Address', key: 'email', icon: Mail, disabled: true  },
          { label: 'Phone Number', key: 'phone', icon: Phone, disabled: true  },
          { label: 'Role', key: 'role', icon: Shield, disabled: true },
        ].map(({ label, key, icon: Icon, disabled }) => (
          <div key={key}>
            <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ border: '1px solid #e0e4ea', borderRadius: '6px', backgroundColor: disabled ? '#f8f9fb' : 'white' }}>
              <Icon size={14} color="#54667d" />
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                disabled={disabled}
                style={{ border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', background: 'transparent', width: '100%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security Section ──
function SecuritySection() {
  const initialSessionTimeout = (() => {
    const saved = localStorage.getItem(SESSION_TIMEOUT_STORAGE_KEY);
    return saved && ['15', '30', '60', '120'].includes(saved) ? saved : '30';
  })();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [sessionTimeout, setSessionTimeout] = useState(initialSessionTimeout);
  const canUpdatePassword = passwords.newPass.trim().length > 0 && passwords.confirm.trim().length > 0;

  return (
    <div>
      {/* Change Password */}
      <div className="mb-8 p-5" style={{ border: '1px solid #e0e4ea', borderRadius: '8px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Change Password</div>
        <div className="flex flex-col gap-4" style={{ maxWidth: 400 }}>
          {[
            { label: 'Current Password', key: 'current', show: showCurrent, setShow: setShowCurrent },
            { label: 'New Password', key: 'newPass', show: showNew, setShow: setShowNew },
            { label: 'Confirm New Password', key: 'confirm', show: showNew, setShow: setShowNew },
          ].map(({ label, key, show, setShow }) => (
            <div key={key}>
              <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ border: '1px solid #e0e4ea', borderRadius: '6px' }}>
                <Lock size={14} color="#54667d" />
                <input
                  type={show ? 'text' : 'password'}
                  value={(passwords as any)[key]}
                  onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                  style={{ border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', background: 'transparent', flex: 1 }}
                />
                <button onClick={() => setShow(!show)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                  {show ? <EyeOff size={14} color="#54667d" /> : <Eye size={14} color="#54667d" />}
                </button>
              </div>
            </div>
          ))}
          <SaveButton label="Update Password" disabled={!canUpdatePassword} />
        </div>
      </div>

      {/* Access Settings */}

      <SettingRow label="Session Timeout" description="Automatically log out after inactivity period" showBorder={false}>
        <select
          value={sessionTimeout}
          onChange={(e) => {
            const value = e.target.value;
            setSessionTimeout(value);
            localStorage.setItem(SESSION_TIMEOUT_STORAGE_KEY, value);
          }}
          style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '7px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
        >
          {['15', '30', '60', '120'].map((v) => <option key={v} value={v}>{v} minutes</option>)}
        </select>
      </SettingRow>
    </div>
  );
}

// ── Business Info Section ──
function BusinessSection() {
  const [form, setForm] = useState({
    companyName: 'Ermel Glass & Aluminum',
    address: '1528 Nicolas Zamora St., Tondo, City of Manila, 1012 Metro Manila, Philippines',
    phone: '(+63) 938 602 0346',
    email: 'ermelglassaluminum@gmail.com',
    website: 'www.ermelglass.com',
    taxId: '123-456-789-000',
    currency: 'PHP',
    vatRate: '12',
    warranty: '1 year',
  });
  const f = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Company Name', key: 'companyName', disabled: true },
          { label: 'Business Email', key: 'email', disabled: true },
          { label: 'Phone Number', key: 'phone', disabled: true },
          { label: 'Website', key: 'website', disabled: true },
          { label: 'Tax ID / TIN', key: 'taxId', disabled: true },
        ].map(({ label, key, disabled }) => (
          <div key={key}>
            <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
            <input
              value={(form as any)[key]}
              onChange={f(key)}
              disabled={disabled}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box', backgroundColor: disabled ? '#f8f9fb' : 'white' }}
            />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Currency</label>
          <input
            value="PHP — Philippine Peso"
            disabled
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8f9fb' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Business Address</label>
        <textarea
          value={form.address}
          onChange={f('address')}
          disabled
          rows={3}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', resize: 'vertical', boxSizing: 'border-box', backgroundColor: '#f8f9fb' }}
        />
      </div>

      {/* Pricing Rules */}
      <div className="p-5 mb-6" style={{ border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: '#f8f9fb' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Pricing & Terms</div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'VAT Rate (%)', key: 'vatRate', disabled: true  },
            { label: 'Warranty Period', key: 'warranty', disabled: true  },
          ].map(({ label, key, disabled }) => (
            <div key={key}>
              <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
              <input
                value={(form as any)[key]}
                onChange={f(key)}
                disabled={disabled}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box', backgroundColor: disabled ? '#f8f9fb' : 'white' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ──
export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const current = SECTIONS.find((s) => s.key === activeSection)!;
  const ActiveIcon = current.icon;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{ color: '#7a0000', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
          SYSTEM
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Settings
        </h1>
        <p style={{ color: '#54667d', fontSize: '14px', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
          Manage your admin preferences and system configuration
        </p>
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Sidebar Nav */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <nav style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', overflow: 'hidden' }}>
            {SECTIONS.map((section, idx) => {
              const Icon = section.icon;
              const isActive = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    backgroundColor: isActive ? '#f0f3f7' : 'white',
                    borderBottom: idx < SECTIONS.length - 1 ? '1px solid #f0f3f7' : 'none',
                    borderLeft: isActive ? '3px solid #15263c' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={16} color={isActive ? '#15263c' : '#54667d'} />
                  <span style={{ fontFamily: 'var(--font-heading)', color: isActive ? '#15263c' : '#54667d', fontSize: '13px', fontWeight: isActive ? 700 : 600, flex: 1 }}>
                    {section.label}
                  </span>
                  {isActive && <ChevronRight size={14} color="#15263c" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ backgroundColor: 'white', border: '1px solid #e0e4ea', borderRadius: '8px', padding: '28px' }}>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid #e0e4ea' }}>
              <div style={{ width: 40, height: 40, backgroundColor: '#e8ecf1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActiveIcon size={18} color="#15263c" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '18px', fontWeight: 800 }}>{current.label}</h2>
                <p style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{current.description}</p>
              </div>
            </div>

            {/* Dynamic Content */}
            {activeSection === 'profile'       && <ProfileSection />}
            {activeSection === 'security'      && <SecuritySection />}
            {activeSection === 'business'      && <BusinessSection />}
          </div>
        </div>
      </div>
    </div>
  );
}