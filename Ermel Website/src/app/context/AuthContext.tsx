// ============================================================
// Auth context — provides authentication state across the app
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearCsrfTokenCache, getCsrfToken } from '../services/csrf';

interface User {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_ROOT = (import.meta as any).env?.VITE_API_URL || '/api';
const API_BASE = `${API_ROOT}/auth`;

async function tryParseJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isInvalidCsrf(res: Response, data: any): boolean {
  const errorText = typeof data?.error === 'string' ? data.error.toLowerCase() : '';
  return res.status === 403 && errorText.includes('csrf');
}

async function postWithCsrfRetry(path: string, init: { body?: string; contentTypeJson?: boolean } = {}) {
  const makeRequest = async (forceRefreshToken: boolean) => {
    const csrfToken = await getCsrfToken(forceRefreshToken);
    const headers: Record<string, string> = {
      'x-csrf-token': csrfToken,
    };

    if (init.contentTypeJson) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: init.body,
    });
  };

  let res = await makeRequest(false);
  let data = await tryParseJson(res);

  if (isInvalidCsrf(res, data)) {
    clearCsrfTokenCache();
    res = await makeRequest(true);
    data = await tryParseJson(res);
  }

  return { res, data };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { res, data } = await postWithCsrfRetry('/login', {
        contentTypeJson: true,
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setUser(data.user);
        return { success: true, user: data.user as User };
      }

      return { success: false, error: data.error || 'Login failed.' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const register = useCallback(async (regData: RegisterData) => {
    try {
      const { res, data } = await postWithCsrfRetry('/register', {
        contentTypeJson: true,
        body: JSON.stringify(regData),
      });

      if (res.ok) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Registration failed.' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await postWithCsrfRetry('/logout');
    } catch {
      // Proceed even if server is unreachable
    }
    try {
      if (typeof window !== 'undefined' && user) {
        const draftKeys = [] as string[];
        if (user.id) draftKeys.push(`ermel_quote_draft_v1:${user.id}`);
        if (user.email) draftKeys.push(`ermel_quote_draft_v1:${user.email}`);
        draftKeys.forEach((key) => window.localStorage.removeItem(key));
      }
    } catch {
      // Ignore storage errors
    }
    clearCsrfTokenCache();
    setUser(null);
  }, [user]);

  const resendVerification = useCallback(async () => {
    try {
      const { res, data } = await postWithCsrfRetry('/resend-verification');

      if (res.ok) {
        return { success: true };
      }

      if (res.status === 403) {
        clearCsrfTokenCache();
      }

      return { success: false, error: data.error || 'Failed to resend.' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, logout, resendVerification, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
