'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { parseApiJson } from '@/lib/parse-api-json';
import { GEORGIAN_BANKS } from '@/lib/georgian-banks/registry';

type BankSettings = {
  default_provider: string;
  bank_configured: { tbc: boolean; bog: boolean };
  tbc_client_id: string;
  tbc_has_secret: boolean;
  tbc_api_key: string;
  bog_public_key: string;
  bog_has_secret: boolean;
  bog_callback_public_key: string;
};

type Props = {
  onSaved?: () => void;
};

export function MerchantBankSettings({ onSaved }: Props) {
  const { t } = useLocale();
  const b = t.dashboard.bankSettings;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [provider, setProvider] = useState('tbc');
  const [tbcClientId, setTbcClientId] = useState('');
  const [tbcClientSecret, setTbcClientSecret] = useState('');
  const [tbcApiKey, setTbcApiKey] = useState('');
  const [bogPublicKey, setBogPublicKey] = useState('');
  const [bogSecretKey, setBogSecretKey] = useState('');
  const [bogCallbackKey, setBogCallbackKey] = useState('');
  const [configured, setConfigured] = useState({ tbc: false, bog: false });
  const [hasSecret, setHasSecret] = useState({ tbc: false, bog: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/laripay/merchants/me', { credentials: 'include' });
    const { data } = await parseApiJson<BankSettings & { error?: { message?: string } }>(res);
    setLoading(false);
    if (!res.ok || !data) {
      setError(data?.error?.message || b.loadError);
      return;
    }
    setProvider(data.default_provider || 'tbc');
    setTbcClientId(data.tbc_client_id || '');
    setTbcApiKey(data.tbc_api_key || '');
    setBogPublicKey(data.bog_public_key || '');
    setBogCallbackKey(data.bog_callback_public_key || '');
    setConfigured(data.bank_configured);
    setHasSecret({ tbc: data.tbc_has_secret, bog: data.bog_has_secret });
    setTbcClientSecret('');
    setBogSecretKey('');
  }, [b.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setMessage('');
    setError('');
    const body: Record<string, string> = {
      default_provider: provider,
      tbc_client_id: tbcClientId,
      tbc_api_key: tbcApiKey,
      bog_public_key: bogPublicKey,
      bog_callback_public_key: bogCallbackKey,
    };
    if (tbcClientSecret) body.tbc_client_secret = tbcClientSecret;
    if (bogSecretKey) body.bog_secret_key = bogSecretKey;

    const res = await fetch('/api/laripay/merchants/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const { data } = await parseApiJson<{ bank_configured?: { tbc: boolean; bog: boolean }; error?: { message?: string } }>(res);
    setBusy(false);
    if (!res.ok) {
      setError(data?.error?.message || b.saveFailed);
      return;
    }
    if (data?.bank_configured) setConfigured(data.bank_configured);
    setMessage(b.saved);
    setTbcClientSecret('');
    setBogSecretKey('');
    onSaved?.();
    await load();
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-[#71717a]">{b.loading}</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#52525b]">{b.eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{b.title}</h2>
        <p className="mt-1 text-sm text-[#71717a]">{b.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'tbc', label: 'TBC Pay', on: configured.tbc },
          { id: 'bog', label: 'BOG Pay', on: configured.bog },
        ].map((bank) => (
          <span
            key={bank.id}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase',
              bank.on
                ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]'
                : 'border-white/[0.08] bg-white/[0.03] text-[#71717a]',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', bank.on ? 'bg-[#4ade80]' : 'bg-[#52525b]')} />
            {bank.label}
          </span>
        ))}
      </div>

      <label className="block text-xs text-[#71717a]">
        {b.defaultProvider}
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 text-sm text-white"
        >
          {GEORGIAN_BANKS.filter((bank) => bank.id === 'tbc' || bank.id === 'bog').map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
      </label>

      <motion.div className="rounded-xl border border-white/[0.08] bg-[#13111a] p-4">
        <h3 className="text-sm font-semibold text-white">TBC Pay</h3>
        <p className="mt-1 text-[11px] text-[#71717a]">{b.tbcHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-[#71717a]">
            Client ID
            <input
              value={tbcClientId}
              onChange={(e) => setTbcClientId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
            />
          </label>
          <label className="block text-xs text-[#71717a]">
            Client Secret
            <input
              type="password"
              value={tbcClientSecret}
              onChange={(e) => setTbcClientSecret(e.target.value)}
              placeholder={hasSecret.tbc ? b.secretKeep : ''}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
            />
          </label>
          <label className="block text-xs text-[#71717a] sm:col-span-2">
            API Key (optional)
            <input
              value={tbcApiKey}
              onChange={(e) => setTbcApiKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
            />
          </label>
        </div>
      </motion.div>

      <motion.div className="rounded-xl border border-white/[0.08] bg-[#13111a] p-4">
        <h3 className="text-sm font-semibold text-white">BOG Pay</h3>
        <p className="mt-1 text-[11px] text-[#71717a]">{b.bogHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-[#71717a]">
            Public key
            <input
              value={bogPublicKey}
              onChange={(e) => setBogPublicKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
            />
          </label>
          <label className="block text-xs text-[#71717a]">
            Secret key
            <input
              type="password"
              value={bogSecretKey}
              onChange={(e) => setBogSecretKey(e.target.value)}
              placeholder={hasSecret.bog ? b.secretKeep : ''}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-xs text-white"
            />
          </label>
          <label className="block text-xs text-[#71717a] sm:col-span-2">
            Callback public key (PEM)
            <textarea
              value={bogCallbackKey}
              onChange={(e) => setBogCallbackKey(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0a10] px-3 py-2 font-mono text-[10px] text-white"
            />
          </label>
        </div>
      </motion.div>

      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-lg bg-[#8b5cf6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7c3aed] disabled:opacity-50"
      >
        {busy ? b.saving : b.save}
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-[#4ade80]">{message}</p> : null}
      <p className="text-[11px] text-[#52525b]">{b.securityNote}</p>
    </div>
  );
}
