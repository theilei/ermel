"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripHtmlTags = stripHtmlTags;
exports.sanitizeText = sanitizeText;
exports.escapeForDb = escapeForDb;
exports.cleanPhone = cleanPhone;
exports.isValidPhPhone = isValidPhPhone;
exports.hashPhone = hashPhone;
exports.maskPhone = maskPhone;
exports.toMeters = toMeters;
exports.fromMeters = fromMeters;
exports.isValidMeasurement = isValidMeasurement;
exports.allUnitsFromMeters = allUnitsFromMeters;
exports.isValidAddress = isValidAddress;
exports.isValidOther = isValidOther;
exports.sanitizeOther = sanitizeOther;
// ============================================================
// Server-side validation utilities (mirrors frontend validation.ts)
// Never trust frontend validation — always re-validate here.
// ============================================================
const crypto_1 = __importDefault(require("crypto"));
// ---- HTML Sanitisation ----
function stripHtmlTags(input) {
    return input.replace(/<[^>]*>/g, '');
}
function sanitizeText(input) {
    return stripHtmlTags(input.trim());
}
// ---- Escape for DB ----
function escapeForDb(input) {
    // Used as a defence-in-depth layer; parameterized queries are the primary protection
    return input.replace(/'/g, "''");
}
// ---- Phone ----
const PH_PHONE_REGEX = /^09\d{9}$/;
function cleanPhone(raw) {
    return raw.replace(/[\s\-\(\)\+]/g, '');
}
function isValidPhPhone(phone) {
    return PH_PHONE_REGEX.test(phone);
}
function hashPhone(phone) {
    return crypto_1.default.createHash('sha256').update(phone).digest('hex');
}
function maskPhone(phone) {
    if (phone.length < 7)
        return '****';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
}
const TO_M = { cm: 0.01, m: 1, ft: 0.3048, in: 0.0254 };
const FROM_M = { cm: 100, m: 1, ft: 1 / 0.3048, in: 1 / 0.0254 };
function toMeters(value, from) {
    return value * TO_M[from];
}
function fromMeters(meters, to) {
    return meters * FROM_M[to];
}
function isValidMeasurement(value, unit) {
    if (isNaN(value) || value <= 0)
        return false;
    const m = toMeters(value, unit);
    return m > 0 && m <= 100;
}
function allUnitsFromMeters(meters) {
    const fmt = (n) => Number(n.toFixed(2));
    return {
        m: fmt(meters),
        cm: fmt(fromMeters(meters, 'cm')),
        ft: fmt(fromMeters(meters, 'ft')),
        in: fmt(fromMeters(meters, 'in')),
    };
}
// ---- Address ----
function isValidAddress(address) {
    return sanitizeText(address).length >= 10;
}
// ---- Other fields ----
function isValidOther(value) {
    const cleaned = sanitizeText(value);
    return cleaned.length > 0 && cleaned.length <= 150;
}
function sanitizeOther(value) {
    return sanitizeText(value).slice(0, 150);
}
//# sourceMappingURL=validation.js.map