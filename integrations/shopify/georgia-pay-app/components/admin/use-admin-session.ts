'use client';

import { useCallback, useEffect, useState } from 'react';
import { parseApiJson } from '@/lib/parse-api-json';

export function useAdminSession() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/laripay/admin/dashboard', { credentials: 'include' });
    const { data } = await parseApiJson<{ error?: { message?: string } }>(res);
    setLoading(false);
    if (!res.ok) {
      setLoggedIn(false);
      setError(data?.error?.message || 'Admin authentication required');
      return false;
    }
    setLoggedIn(true);
    return true;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logout() {
    await fetch('/api/laripay/admin/portal/logout', { method: 'POST', credentials: 'include' });
    setLoggedIn(false);
  }

  return { loggedIn, loading, error, refresh, logout };
}
