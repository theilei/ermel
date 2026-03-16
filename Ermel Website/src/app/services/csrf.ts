let csrfTokenCache: string | null = null;
const API_ROOT = (import.meta as any).env?.VITE_API_URL || '/api';

export async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && csrfTokenCache) {
    return csrfTokenCache;
  }

  const res = await fetch(`${API_ROOT}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch CSRF token.');
  }

  const body = await res.json();
  if (!body?.csrfToken || typeof body.csrfToken !== 'string') {
    throw new Error('Invalid CSRF token response.');
  }

  csrfTokenCache = body.csrfToken;
  return csrfTokenCache;
}

export function clearCsrfTokenCache() {
  csrfTokenCache = null;
}
