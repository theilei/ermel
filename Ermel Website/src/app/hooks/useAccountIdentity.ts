import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

function pickNameFromMeta(meta: any): string {
  if (!meta || typeof meta !== 'object') return '';
  const maybe = [
    meta.full_name,
    meta.fullName,
    meta.name,
    meta.display_name,
    meta.displayName,
  ].find((v) => typeof v === 'string' && v.trim().length > 0);
  return (maybe || '').trim();
}

function deriveName(fullName: string, email: string): string {
  if (fullName.trim()) return fullName.trim();
  const prefix = email.split('@')[0]?.trim();
  return prefix || 'User';
}

function deriveInitials(name: string, email: string): string {
  const clean = name.trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  const prefix = (email || '').split('@')[0].trim();
  if (!prefix) return 'U';
  const chunks = prefix.split(/[._\-\s]+/).filter(Boolean);
  if (chunks.length >= 2) return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
  return prefix.slice(0, 2).toUpperCase();
}

export function useAccountIdentity() {
  const { user, loading } = useAuth();
  const [fallbackName, setFallbackName] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSupabaseName() {
      if (!user || user.fullName?.trim()) {
        if (active) setFallbackName('');
        return;
      }
      if (!supabase) {
        if (active) setFallbackName('');
        return;
      }

      const { data } = await supabase.auth.getUser();
      const metaName = pickNameFromMeta(data?.user?.user_metadata);
      if (active) setFallbackName(metaName);
    }

    loadSupabaseName();
    return () => {
      active = false;
    };
  }, [user]);

  return useMemo(() => {
    const email = user?.email || '';
    const fullName = user?.fullName || fallbackName;
    const displayName = deriveName(fullName, email);
    const initials = deriveInitials(displayName, email);

    return {
      isLoggedIn: !loading && !!user,
      loading,
      email,
      fullName: displayName,
      initials,
      source: user?.fullName?.trim() ? 'auth' : fallbackName ? 'supabase' : 'email-fallback',
    } as const;
  }, [fallbackName, loading, user]);
}
