import { useState } from 'react';
import {
  User, Bell, Shield, Globe, Palette, Database,
  Save, Eye, EyeOff, CheckCircle, ChevronRight, Mail,
  Phone, Building, Lock, LogOut, Trash2, RefreshCw,
} from 'lucide-react';

type SettingsSection = 'profile' | 'notifications' | 'security' | 'business' | 'appearance' | 'system';

const SECTIONS: { key: SettingsSection; label: string; icon: any; description: string }[] = [
  { key: 'profile',       label: 'Profile',       icon: User,     description: 'Manage your admin profile information' },
  { key: 'notifications', label: 'Notifications', icon: Bell,     description: 'Configure alerts and email notifications' },
  { key: 'security',      label: 'Security',      icon: Shield,   description: 'Password, sessions, and access control' },
  { key: 'business',      label: 'Business Info',  icon: Building, description: 'Company details, pricing, and terms' },
  { key: 'appearance',    label: 'Appearance',    icon: Palette,  description: 'Theme preferences and display settings' },
  { key: 'system',        label: 'System',        icon: Database, description: 'Data management and system utilities' },
];

// ── Reusable Components ──
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-5" style={{ borderBottom: '1px solid #f0f3f7' }}>
      <div style={{ maxWidth: '60%' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 600 }}>{label}</div>
        {description && <div style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)', marginTop: '3px', lineHeight: 1.5 }}>{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        backgroundColor: value ? '#15263c' : '#e0e4ea',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function SaveButton({ label = 'Save Changes', onClick }: { label?: string; onClick?: () => void }) {
  const [saved, setSaved] = useState(false);
  const handleClick = () => {
    setSaved(true);
    onClick?.();
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2"
      style={{ borderRadius: '6px', background: saved ? '#1a5c1a' : '#15263c', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', transition: 'background 0.2s' }}
    >
      {saved ? <CheckCircle size={14} /> : <Save size={14} />}
      {saved ? 'Saved!' : label}
    </button>
  );
}

// ── Profile Section ──
function ProfileSection() {
  const [form, setForm] = useState({ name: 'Ermel Admin', email: 'admin@ermelglass.com', phone: '09171234567', role: 'Super Admin' });
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
          { label: 'Full Name', key: 'name', icon: User },
          { label: 'Email Address', key: 'email', icon: Mail },
          { label: 'Phone Number', key: 'phone', icon: Phone },
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
      <SaveButton />
    </div>
  );
}

// ── Notifications Section ──
function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    newQuote: true, quoteApproved: true, paymentReceived: true,
    installationUpdate: false, lowStock: true, weeklyReport: false,
    emailDigest: true, smsAlerts: false,
  });
  const toggle = (k: keyof typeof notifs) => setNotifs((prev) => ({ ...prev, [k]: !prev[k] }));

  const rows = [
    { key: 'newQuote', label: 'New Quote Request', desc: 'Notify when a customer submits a new quotation' },
    { key: 'quoteApproved', label: 'Quote Approved', desc: 'Alert when a quote gets approved or rejected' },
    { key: 'paymentReceived', label: 'Payment Received', desc: 'Notify when a customer uploads payment proof' },
    { key: 'installationUpdate', label: 'Installation Updates', desc: 'Status changes in the installation queue' },
    { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Warn when materials fall below minimum stock levels' },
    { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Email digest of weekly operations and revenue' },
    { key: 'emailDigest', label: 'Email Notifications', desc: 'Receive alerts via email' },
    { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive urgent alerts via SMS' },
  ];

  return (
    <div>
      {rows.map(({ key, label, desc }) => (
        <SettingRow key={key} label={label} description={desc}>
          <Toggle value={(notifs as any)[key]} onChange={() => toggle(key as any)} />
        </SettingRow>
      ))}
      <div className="mt-6">
        <SaveButton label="Save Notification Preferences" />
      </div>
    </div>
  );
}

// ── Security Section ──
function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

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
          <SaveButton label="Update Password" />
        </div>
      </div>

      {/* Access Settings */}
      <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security to your admin account">
        <Toggle value={twoFA} onChange={setTwoFA} />
      </SettingRow>
      <SettingRow label="Session Timeout" description="Automatically log out after inactivity period">
        <select
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(e.target.value)}
          style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '7px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}
        >
          {['15', '30', '60', '120'].map((v) => <option key={v} value={v}>{v} minutes</option>)}
        </select>
      </SettingRow>

      {/* Danger Zone */}
      <div className="mt-8 p-5" style={{ border: '1.5px solid #f0c0c0', borderRadius: '8px', backgroundColor: '#fffafa' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Danger Zone</div>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>Force Sign Out All Sessions</div>
            <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)' }}>Terminate all active admin sessions immediately</div>
          </div>
          <button style={{ padding: '7px 14px', borderRadius: '6px', border: '1.5px solid #d4183d', background: 'white', color: '#d4183d', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={13} />
            Sign Out All
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Business Info Section ──
function BusinessSection() {
  const [form, setForm] = useState({
    companyName: 'Ermel Glass & Aluminum',
    address: '1528 Nicolas Zamora St., Tondo, City of Manila, 1012 Metro Manila, Philippines',
    phone: '(+63) 938 602 0346',
    email: 'info@ermelglass.com',
    website: 'www.ermelglass.com',
    taxId: '123-456-789-000',
    currency: 'PHP',
    vatRate: '12',
    depositRate: '50',
    warranty: '1 year',
  });
  const f = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Company Name', key: 'companyName' },
          { label: 'Business Email', key: 'email' },
          { label: 'Phone Number', key: 'phone' },
          { label: 'Website', key: 'website' },
          { label: 'Tax ID / TIN', key: 'taxId' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
            <input
              value={(form as any)[key]}
              onChange={f(key)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Currency</label>
          <select value={form.currency} onChange={f('currency')} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
            <option value="PHP">PHP — Philippine Peso</option>
            <option value="USD">USD — US Dollar</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Business Address</label>
        <textarea
          value={form.address}
          onChange={f('address')}
          rows={3}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* Pricing Rules */}
      <div className="p-5 mb-6" style={{ border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: '#f8f9fb' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Pricing & Terms</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'VAT Rate (%)', key: 'vatRate' },
            { label: 'Deposit Required (%)', key: 'depositRate' },
            { label: 'Warranty Period', key: 'warranty' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={{ display: 'block', fontFamily: 'var(--font-heading)', color: '#54667d', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
              <input
                value={(form as any)[key]}
                onChange={f(key)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e4ea', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#15263c', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
              />
            </div>
          ))}
        </div>
      </div>

      <SaveButton label="Save Business Information" />
    </div>
  );
}

// ── Appearance Section ──
function AppearanceSection() {
  const [theme, setTheme] = useState('light');
  const [density, setDensity] = useState('comfortable');
  const [language, setLanguage] = useState('en-PH');
  const [dateFormat, setDateFormat] = useState('MMM D, YYYY');

  return (
    <div>
      <SettingRow label="Theme" description="Choose the admin panel color scheme">
        <div className="flex gap-2">
          {['light', 'dark'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
                border: theme === t ? '1.5px solid #15263c' : '1.5px solid #e0e4ea',
                background: theme === t ? '#15263c' : 'white',
                color: theme === t ? 'white' : '#54667d',
                fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '13px',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Display Density" description="Adjust table and content spacing">
        <div className="flex gap-2">
          {['compact', 'comfortable', 'spacious'].map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              style={{
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                border: density === d ? '1.5px solid #15263c' : '1.5px solid #e0e4ea',
                background: density === d ? '#15263c' : 'white',
                color: density === d ? 'white' : '#54667d',
                fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '12px',
                textTransform: 'capitalize',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Language & Region" description="Set interface language and locale">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '7px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}>
          <option value="en-PH">English (Philippines)</option>
          <option value="fil">Filipino</option>
          <option value="en-US">English (US)</option>
        </select>
      </SettingRow>

      <SettingRow label="Date Format" description="How dates are displayed across the admin panel">
        <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} style={{ borderRadius: '6px', border: '1px solid #e0e4ea', padding: '7px 12px', fontSize: '13px', color: '#15263c', cursor: 'pointer', background: 'white', fontFamily: 'var(--font-body)' }}>
          <option value="MMM D, YYYY">Mar 10, 2026</option>
          <option value="DD/MM/YYYY">10/03/2026</option>
          <option value="YYYY-MM-DD">2026-03-10</option>
        </select>
      </SettingRow>

      <div className="mt-6">
        <SaveButton label="Save Appearance" />
      </div>
    </div>
  );
}

// ── System Section ──
function SystemSection() {
  const [backupRunning, setBackupRunning] = useState(false);

  return (
    <div>
      {/* System Info */}
      <div className="p-5 mb-6" style={{ border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: '#f8f9fb' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>System Information</div>
        {[
          { label: 'Application Version', value: 'v2.1.4' },
          { label: 'Database', value: 'PostgreSQL 15.2' },
          { label: 'Last Backup', value: 'March 9, 2026 at 2:00 AM' },
          { label: 'Total Orders', value: '247 records' },
          { label: 'Total Customers', value: '183 accounts' },
          { label: 'Storage Used', value: '1.2 GB / 10 GB' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid #e0e4ea' }}>
            <span style={{ color: '#54667d', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{label}</span>
            <span style={{ color: '#15263c', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Backup Database', desc: 'Create a full backup of all system data', icon: Database, action: 'Run Backup' },
          { label: 'Export All Orders', desc: 'Download all order data as CSV', icon: Globe, action: 'Export CSV' },
          { label: 'Clear Cache', desc: 'Clear system cache and temporary files', icon: RefreshCw, action: 'Clear Cache' },
          { label: 'View Audit Logs', desc: 'Review all admin actions and system events', icon: Shield, action: 'View Logs' },
        ].map(({ label, desc, icon: Icon, action }) => (
          <div key={label} className="flex items-start justify-between p-4" style={{ border: '1px solid #e0e4ea', borderRadius: '8px', backgroundColor: 'white' }}>
            <div className="flex items-start gap-3">
              <div style={{ width: 36, height: 36, backgroundColor: '#e8ecf1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color="#15263c" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 700 }}>{label}</div>
                <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)', marginTop: '2px' }}>{desc}</div>
              </div>
            </div>
            <button
              onClick={() => label === 'Backup Database' && setBackupRunning(true)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e4ea', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#15263c', fontFamily: 'var(--font-heading)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }}
            >
              {action}
            </button>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="p-5" style={{ border: '1.5px solid #f0c0c0', borderRadius: '8px', backgroundColor: '#fffafa' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: '#7a0000', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Danger Zone</div>
        <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid #fde0e0' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>Reset Demo Data</div>
            <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)' }}>Restore all mock/demo data to its original state</div>
          </div>
          <button style={{ padding: '7px 14px', borderRadius: '6px', border: '1.5px solid #f0c040', background: 'white', color: '#7a5200', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} />
            Reset
          </button>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', color: '#15263c', fontSize: '13px', fontWeight: 600 }}>Delete All Orders</div>
            <div style={{ color: '#54667d', fontSize: '12px', fontFamily: 'var(--font-body)' }}>Permanently remove all order records — this cannot be undone</div>
          </div>
          <button style={{ padding: '7px 14px', borderRadius: '6px', border: '1.5px solid #d4183d', background: 'white', color: '#d4183d', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={13} />
            Delete All
          </button>
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
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'security'      && <SecuritySection />}
            {activeSection === 'business'      && <BusinessSection />}
            {activeSection === 'appearance'    && <AppearanceSection />}
            {activeSection === 'system'        && <SystemSection />}
          </div>
        </div>
      </div>
    </div>
  );
}