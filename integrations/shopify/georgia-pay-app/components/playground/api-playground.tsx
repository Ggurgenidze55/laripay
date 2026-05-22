'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseApiJson } from '@/lib/parse-api-json';
import { CoreModeBadge } from '@/components/platform/core-mode-badge';

const STORAGE_KEY = 'laripay_api_key';

export function ApiPlayground() {
  const { t, route } = useLocale();
  const p = t.pages.playground;
  const [apiKey, setApiKey] = useState('');
  const [amount, setAmount] = useState('2.00');
  const [provider, setProvider] = useState<'tbc' | 'bog'>('tbc');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [coreMode, setCoreMode] = useState(false);
  const [intentId, setIntentId] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
    fetch('/api/laripay/core/status')
      .then((r) => r.json())
      .then((d: { mode?: string }) => setCoreMode(d.mode === 'core'))
      .catch(() => setCoreMode(false));
  }, []);

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    }),
    [apiKey],
  );

  async function runCheckout() {
    setLoading(true);
    setResult('');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch('/api/v1/checkout/sessions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: parseFloat(amount) || 2,
        currency: 'GEL',
        provider,
        success_url: `${origin}${route('demo')}?paid=1`,
        cancel_url: `${origin}${route('demo')}`,
      }),
    });
    const { data } = await parseApiJson(res);
    setLoading(false);
    setResult(JSON.stringify(data, null, 2));
  }

  async function runIntent() {
    if (!coreMode) {
      setResult(p.coreRequired);
      return;
    }
    setLoading(true);
    setResult('');
    const res = await fetch('/api/laripay/core/payment-intents', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: Math.round((parseFloat(amount) || 2) * 100),
        currency: 'GEL',
        provider,
      }),
    });
    const { data } = await parseApiJson<{ id?: string }>(res);
    setLoading(false);
    if (data && typeof data === 'object' && 'id' in data && data.id) {
      setIntentId(String(data.id));
    }
    setResult(JSON.stringify(data, null, 2));
  }

  async function lookupIntent() {
    if (!intentId.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/laripay/core/payment-intents/${intentId.trim()}`, {
      headers: authHeaders(),
    });
    const { data } = await parseApiJson(res);
    setLoading(false);
    setResult(JSON.stringify(data, null, 2));
  }

  function saveKey() {
    sessionStorage.setItem(STORAGE_KEY, apiKey.trim());
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <CoreModeBadge />
        <Badge variant="accent">{p.sandbox}</Badge>
      </div>

      <Card className="!p-5 space-y-4">
        <label className="block text-sm font-medium">{p.apiKey}</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={saveKey}
          placeholder="sk_test_…"
          className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 font-mono text-sm"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-foreground-muted">{p.amount}</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{p.provider}</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'tbc' | 'bog')}
              className="mt-1 w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-sm"
            >
              <option value="tbc">TBC</option>
              <option value="bog">BOG</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runCheckout} disabled={loading || !apiKey.trim()}>
            {loading ? p.running : p.checkout}
          </Button>
          <Button variant="secondary" onClick={runIntent} disabled={loading || !apiKey.trim()}>
            {p.createIntent}
          </Button>
          <Button
            variant="ghost"
            onClick={lookupIntent}
            disabled={loading || !intentId.trim()}
          >
            {p.lookupIntent}
          </Button>
        </div>
        {intentId ? (
          <p className="font-mono text-xs text-foreground-muted">
            intent: {intentId}
          </p>
        ) : null}
      </Card>

      {result ? (
        <motion.pre
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-h-80 overflow-auto rounded-xl border border-border bg-surface-inset p-4 font-mono text-xs text-foreground-muted"
        >
          {result}
        </motion.pre>
      ) : null}
    </div>
  );
}
