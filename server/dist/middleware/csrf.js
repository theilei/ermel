"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
const csurf_1 = __importDefault(require("csurf"));
// Session-backed CSRF tokens. Safe for same-origin SPA requests.
exports.csrfProtection = (0, csurf_1.default)({
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});
//# sourceMappingURL=csrf.js.map