'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CoreModeBadge } from '@/components/platform/core-mode-badge';
import { parseApiJson } from '@/lib/parse-api-json';

const STORAGE_KEY = 'laripay_api_key';

export function PlatformToolsPanel() {
  const { t, route } = useLocale();
  const p = t.dashboard.platformTools;
  const [coreMode, setCoreMode] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [linkAmount, setLinkAmount] = useState('10');
  const [message, setMessage] = useState('');
  const [payouts, setPayouts] = useState<{ id: string; amount: number; status: string }[]>([]);
  const [plans, setPlans] = useState<{ code: string; name: string; priceGel?: number }[]>([]);

  useEffect(() => {
    fetch('/api/laripay/core/status')
      .then((r) => r.json())
      .then((d: { mode?: string }) => setCoreMode(d.mode === 'core'))
      .catch(() => setCoreMode(false));
  }, []);

  const apiKey = () =>
    typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY)?.trim() : '';

  const authHeaders = useCallback((): Record<string, string> => {
    const key = apiKey();
    return key
      ? { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }, []);

  const loadPayouts = useCallback(async () => {
    if (!coreMode || !apiKey()) return;
    const res = await fetch('/api/laripay/core/payouts', { headers: authHeaders() });
    const { data } = await parseApiJson<{ items?: typeof payouts } | typeof payouts>(res);
    if (Array.isArray(data)) setPayouts(data);
    else if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      setPayouts(data.items);
    }
  }, [coreMode, authHeaders]);

  const loadPlans = useCallback(async () => {
    if (!coreMode) return;
    const res = await fetch('/api/laripay/core/subscription-plans');
    const { data } = await parseApiJson<typeof plans>(res);
    if (Array.isArray(data)) setPlans(data);
  }, [coreMode]);

  useEffect(() => {
    if (coreMode) {
      loadPayouts();
      loadPlans();
    }
  }, [coreMode, loadPayouts, loadPlans]);

  async function registerWebhook(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const key = apiKey();
    if (!key) {
      setMessage(p.needKey);
      return;
    }
    const res = await fetch('/api/laripay/core/webhooks/endpoints', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ url: webhookUrl, events: ['payment.succeeded', 'payment.failed'] }),
    });
    const { data } = await parseApiJson(res);
    setMessage(res.ok ? p.webhookOk : JSON.stringify(data));
  }

  async function createPayout(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/laripay/core/payouts', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: Math.round((parseFloat(payoutAmount) || 0) * 100),
        currency: 'GEL',
      }),
    });
    const { data } = await parseApiJson(res);
    setMessage(res.ok ? p.payoutOk : JSON.stringify(data));
    await loadPayouts();
  }

  async function createPaymentLink(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/laripay/core/payment-links', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: Math.round((parseFloat(linkAmount) || 10) * 100),
        currency: 'GEL',
      }),
    });
    const { data } = await parseApiJson(res);
    setMessage(res.ok ? p.linkOk : JSON.stringify(data));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{p.title}</h2>
          <p className="mt-1 text-sm text-foreground-muted">{p.subtitle}</p>
        </div>
        <CoreModeBadge />
      </div>

      {!coreMode ? (
        <Card className="!p-5">
          <p className="text-sm text-foreground-muted">{p.legacyHint}</p>
          <Link
            href={route('platform')}
            className="mt-3 inline-block text-sm text-accent-cyan hover:underline"
          >
            {p.viewPlatform} →
          </Link>
        </Card>
      ) : (
        <>
          {!apiKey() && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {p.reloginHint}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="!p-5">
              <h3 className="text-sm font-medium">{p.webhooks}</h3>
              <form onSubmit={registerWebhook} className="mt-3 space-y-3">
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your.app/webhooks/laripay"
                  className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">
                  {p.registerWebhook}
                </Button>
              </form>
            </Card>

            <Card className="!p-5">
              <h3 className="text-sm font-medium">{p.paymentLink}</h3>
              <form onSubmit={createPaymentLink} className="mt-3 flex gap-2">
                <input
                  value={linkAmount}
                  onChange={(e) => setLinkAmount(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-surface-inset px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">
                  GEL
                </Button>
              </form>
            </Card>

            <Card className="!p-5">
              <h3 className="text-sm font-medium">{p.payouts}</h3>
              <form onSubmit={createPayout} className="mt-3 flex gap-2">
                <input
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 rounded-lg border border-border bg-surface-inset px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">
                  {p.createPayout}
                </Button>
              </form>
              {payouts.length > 0 && (
                <ul className="mt-4 space-y-2 text-xs text-foreground-muted">
                  {payouts.slice(0, 5).map((po) => (
                    <li key={po.id} className="flex justify-between">
                      <span>{(po.amount / 100).toFixed(2)} ₾</span>
                      <Badge variant="accent">{po.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {plans.length > 0 && (
              <Card className="!p-5">
                <h3 className="text-sm font-medium">{p.subscriptionPlans}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {plans.map((pl) => (
                    <li key={pl.code} className="flex justify-between text-foreground-muted">
                      <span>{pl.name}</span>
                      <span>{pl.priceGel != null ? `${pl.priceGel} ₾` : pl.code}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <Link href={route('playground')} className="text-sm text-accent-cyan hover:underline">
            {p.openPlayground} →
          </Link>
        </>
      )}

      {message ? (
        <pre className="overflow-auto rounded-lg border border-border bg-surface-inset p-3 font-mono text-xs text-foreground-muted">
          {message}
        </pre>
      ) : null}
    </motion.div>
  );
}
