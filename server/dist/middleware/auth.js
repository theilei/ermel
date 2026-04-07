"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireAdmin = void 0;
var authMiddleware_1 = require("./authMiddleware");
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return authMiddleware_1.requireAdmin; } });
Object.defineProperty(exports, "requireAuth", { enumerable: true, get: function () { return authMiddleware_1.requireAuth; } });
//# sourceMappingURL=auth.js.map