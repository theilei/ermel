"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordLimiter = exports.forgotPasswordLimiter = exports.resendLimiter = exports.registerLimiter = exports.loginLimiter = void 0;
// ============================================================
// Rate limiter presets for auth endpoints
// ============================================================
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/** Login: 5 attempts per 15 minutes per IP */
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
    statusCode: 429,
});
/** Register: 5 registrations per hour per IP */
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registration attempts. Please try again later.' },
    statusCode: 429,
});
/** Resend verification: 3 per hour per IP */
exports.resendLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Resend limit reached. Please try again later.' },
    statusCode: 429,
});
/** Forgot password: 5 requests per hour per IP */
exports.forgotPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many password reset requests. Please try again later.' },
    statusCode: 429,
});
/** Reset password: 10 attempts per hour per IP */
exports.resetPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many reset attempts. Please try again later.' },
    statusCode: 429,
});
//# sourceMappingURL=rateLimiter.js.map