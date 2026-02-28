// ============================================================
// Server-side validation utilities (mirrors frontend validation.ts)
// Never trust frontend validation — always re-validate here.
// ============================================================
import crypto from 'crypto';

// ---- HTML Sanitisation ----
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

export function sanitizeText(input: string): string {
  return stripHtmlTags(input.trim());
}

// ---- Escape for DB ----
export function escapeForDb(input: string): string {
  // Used as a defence-in-depth layer; parameterized queries are the primary protection
  return input.replace(/'/g, "''");
}

// ---- Phone ----
const PH_PHONE_REGEX = /^09\d{9}$/;

export function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-\(\)\+]/g, '');
}

export function isValidPhPhone(phone: string): boolean {
  return PH_PHONE_REGEX.test(phone);
}

export function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return '****';
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

// ---- Measurement ----
type Unit = 'cm' | 'm' | 'ft';

const TO_M: Record<Unit, number> = { cm: 0.01, m: 1, ft: 0.3048 };
const FROM_M: Record<Unit, number> = { cm: 100, m: 1, ft: 1 / 0.3048 };

export function toMeters(value: number, from: Unit): number {
  return value * TO_M[from];
}

export function fromMeters(meters: number, to: Unit): number {
  return meters * FROM_M[to];
}

export function isValidMeasurement(value: number, unit: Unit): boolean {
  if (isNaN(value) || value <= 0) return false;
  const m = toMeters(value, unit);
  return m > 0 && m <= 100;
}

export function allUnitsFromMeters(meters: number) {
  const fmt = (n: number) => Number(n.toFixed(2));
  return {
    m: fmt(meters),
    cm: fmt(fromMeters(meters, 'cm')),
    ft: fmt(fromMeters(meters, 'ft')),
  };
}

// ---- Address ----
export function isValidAddress(address: string): boolean {
  return sanitizeText(address).length >= 10;
}

// ---- Other fields ----
export function isValidOther(value: string): boolean {
  const cleaned = sanitizeText(value);
  return cleaned.length > 0 && cleaned.length <= 150;
}

export function sanitizeOther(value: string): string {
  return sanitizeText(value).slice(0, 150);
}
