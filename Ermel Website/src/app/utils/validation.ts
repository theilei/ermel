// ============================================================
// Shared validation & sanitization utilities
// ============================================================

// ---- HTML Sanitisation ----
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

export function sanitizeTextInput(input: string): string {
  return stripHtmlTags(input.trim());
}

// ---- Philippine Phone Validation ----
const PH_PHONE_REGEX = /^09\d{9}$/;

/** Clean a raw phone string: remove spaces, dashes, non-digit formatting */
export function cleanPhoneInput(raw: string): string {
  return raw.replace(/[\s\-\(\)\+]/g, '');
}

export function isValidPhPhone(phone: string): boolean {
  return PH_PHONE_REGEX.test(phone);
}

export const PHONE_ERROR_MESSAGE =
  'Please enter a valid Philippine mobile number (11 digits starting with 09).';

/** Mask phone for display/logging.  0917****567 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return '****';
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

// ---- Measurement Conversions ----
export type MeasurementUnit = 'cm' | 'm' | 'ft';

const TO_METERS: Record<MeasurementUnit, number> = {
  cm: 0.01,
  m: 1,
  ft: 0.3048,
};

const FROM_METERS: Record<MeasurementUnit, number> = {
  cm: 100,
  m: 1,
  ft: 1 / 0.3048,
};

/** Convert a value from `fromUnit` to canonical meters. */
export function toMeters(value: number, fromUnit: MeasurementUnit): number {
  return value * TO_METERS[fromUnit];
}

/** Convert a meters value to the requested display unit. */
export function fromMeters(meters: number, toUnit: MeasurementUnit): number {
  return meters * FROM_METERS[toUnit];
}

/** Convert between any two supported units. */
export function convertUnit(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (from === to) return value;
  return fromMeters(toMeters(value, from), to);
}

/** Max allowed dimension = 100 meters. Returns max in the given unit. */
export function maxInUnit(unit: MeasurementUnit): number {
  return fromMeters(100, unit);
}

/** Validate a single measurement dimension. */
export function isValidMeasurement(
  value: number,
  unit: MeasurementUnit,
): boolean {
  if (isNaN(value) || value <= 0) return false;
  const meters = toMeters(value, unit);
  return meters > 0 && meters <= 100;
}

/** Format a number to 2 decimal places. */
export function fmt2(n: number): string {
  return n.toFixed(2);
}

/** Compute all unit representations from a canonical meter value. */
export function allUnitsFromMeters(meters: number) {
  return {
    m: Number(fmt2(meters)),
    cm: Number(fmt2(fromMeters(meters, 'cm'))),
    ft: Number(fmt2(fromMeters(meters, 'ft'))),
  };
}

// ---- Address Validation ----
export const ADDRESS_MIN_LENGTH = 10;
export const ADDRESS_ERROR_MESSAGE =
  'Please enter a complete address (minimum 10 characters).';

export function isValidAddress(address: string): boolean {
  const cleaned = sanitizeTextInput(address);
  return cleaned.length >= ADDRESS_MIN_LENGTH;
}

// ---- "Other" Field Validation ----
export const OTHER_MAX_LENGTH = 150;

export function isValidOtherInput(value: string): boolean {
  const cleaned = sanitizeTextInput(value);
  return cleaned.length > 0 && cleaned.length <= OTHER_MAX_LENGTH;
}

export function sanitizeOtherInput(value: string): string {
  const cleaned = sanitizeTextInput(value);
  return cleaned.slice(0, OTHER_MAX_LENGTH);
}
