'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { parseApiJson } from '@/lib/parse-api-json';

type WebhookRow = { id: string; url: string; enabled: boolean; events: string };

type Props = {
  apiBaseUrl: string;
};

export function MerchantWebhooksPanel({ apiBaseUrl }: Props) {
  const { t } = useLocale();
  const w = t.dashboard.webhooksPanel;
  const r = t.dashboard.railway;
  const [endpoints, setEndpoints] = useState<WebhookRow[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/laripay/merchant/webhooks', { credentials: 'include' });
    const { data } = await parseApiJson<{ endpoints?: WebhookRow[] }>(res);
    setLoading(false);
    if (data?.endpoints) setEndpoints(data.endpoints);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addEndpoint() {
    if (!url.trim()) return;
    setBusy(true);
    setMessage('');
    const res = await fetch('/api/laripay/merchant/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        url: url.trim(),
        events: ['payment.succeeded', 'payment.failed', 'checkout.session.completed', 'refund.completed'],
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const { data } = await parseApiJson<{ error?: { message?: string } }>(res);
      setMessage(data?.error?.message || w.addFailed);
      return;
    }
    setUrl('');
    setMessage(w.added);
    await load();
  }

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
    setMessage(w.copied);
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-[#71717a]">{w.loading}</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-[#a1a1aa]">{r.webhooksIntro}</p>
        <p className="mt-2 font-mono text-[10px] text-[#52525b]">
          {w.apiBase}: <span className="text-[#c4b5fd]">{apiBaseUrl}</span>
        </p>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#13111a] p-4">
        <p className="text-xs font-medium text-[#a1a1aa]">{w.registerTitle}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={w.urlPlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
          />
          <button
            type="button"
            disabled={busy || !url.trim()}
            onClick={addEndpoint}
            className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {w.add}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#13111a] p-4">
        <p className="mb-3 text-xs font-medium text-[#a1a1aa]">{w.endpointsTitle}</p>
        {endpoints.length === 0 ? (
          <p className="text-sm text-[#52525b]">{w.none}</p>
        ) : (
          <ul className="space-y-2">
            {endpoints.map((ep) => (
              <li
                key={ep.id}
                className="rounded-lg border border-white/[0.06] bg-[#0b0a10] px-3 py-2.5"
              >
                <p className="break-all font-mono text-[11px] text-[#c4b5fd]">{ep.url}</p>
                <p className="mt-1 text-[10px] text-[#52525b]">
                  {ep.enabled ? w.enabled : w.disabled} · {ep.events}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#0b0a10] p-4">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#52525b]">
          {w.eventsTitle}
        </p>
        <ul className="space-y-2 text-[11px] text-[#71717a]">
          {r.webhookEvents.map((evt) => (
            <li key={evt} className="flex items-center justify-between gap-2">
              <code className="text-[#c4b5fd]">{evt}</code>
              <button
                type="button"
                onClick={() => copyText(evt)}
                className="text-[10px] text-[#a78bfa] hover:underline"
              >
                {w.copy}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-[#52525b]">{t.dashboard.bankHostedNote}</p>
      {message ? <p className="text-xs text-[#4ade80]">{message}</p> : null}
    </div>
  );
}
