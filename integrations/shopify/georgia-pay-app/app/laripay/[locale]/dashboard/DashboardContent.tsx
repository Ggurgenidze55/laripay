'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MerchantConsoleLoginPanel } from '@/components/dashboard/merchant-console-login-panel';
import {
  MerchantRailwayDashboard,
  type MerchantDashboardData,
} from '@/components/dashboard/merchant-railway-dashboard';
import { parseApiJson } from '@/lib/parse-api-json';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { useSearchParams } from 'next/navigation';

export default function DashboardContent() {
  const { t } = useLocale();
  const d = t.dashboard;
  const l = d.login;
  const searchParams = useSearchParams();
  const paidSuccess = searchParams.get('paid') === '1';
  const [data, setData] = useState<MerchantDashboardData | null>(null);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/laripay/dashboard', { credentials: 'include' });
    const { data: payload } = await parseApiJson<MerchantDashboardData & { error?: { message?: string } }>(res);
    setLoading(false);
    if (!res.ok) {
      setData(null);
      setLoggedIn(false);
      setError(payload?.error?.message || l.authRequired);
      return;
    }
    setData(payload as MerchantDashboardData);
    setLoggedIn(true);
  }, [l.authRequired]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function logout() {
    await Promise.all([
      fetch('/api/laripay/portal/logout', { method: 'POST', credentials: 'include' }),
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    ]);
    setData(null);
    setLoggedIn(false);
  }

  if (loading && !loggedIn) {
    return (
      <motion.div className="flex min-h-[50vh] items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-[#8b5cf6]/30 border-t-[#a78bfa]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    );
  }

  if (!loggedIn) {
    return (
      <motion.div className="mx-auto max-w-lg rounded-2xl border border-white/[0.08] bg-[#0f0d14] p-6">
        {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
        <MerchantConsoleLoginPanel onLoggedIn={loadDashboard} />
      </motion.div>
    );
  }

  if (!data) return null;

  const hasLiveKey = data.api_keys.some((k) => k.mode === 'live');

  return (
    <motion.div className="min-h-[60vh] py-4">
      {paidSuccess && (
        <motion.div className="mx-auto mb-6 max-w-[1280px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {d.paidSuccess}
        </motion.div>
      )}
      <MerchantRailwayDashboard data={data} hasLiveKey={hasLiveKey} onSignOut={logout} />
    </motion.div>
  );
}
