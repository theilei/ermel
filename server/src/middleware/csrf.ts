import csrf from 'csurf';

// Session-backed CSRF tokens. Safe for same-origin SPA requests.
export const csrfProtection = csrf({
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});
