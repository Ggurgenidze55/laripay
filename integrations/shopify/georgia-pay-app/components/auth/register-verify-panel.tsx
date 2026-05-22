'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Step = 'verify_email' | 'verify_phone';

type Props = {
  pendingId: string;
  email: string;
  phoneMasked?: string;
  step: Step;
  onVerified: (data: {
    api_key?: string;
    next_step?: string;
  }) => void;
};

export function RegisterVerifyPanel({
  pendingId,
  email,
  phoneMasked,
  step,
  onVerified,
}: Props) {
  const { t } = useLocale();
  const f = t.pages.auth.twoFactor;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setError('');
    try {
      const channel = step === 'verify_email' ? 'email' : 'phone';
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pending_id: pendingId, channel, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || f.invalidCode);
        return;
      }
      if (data.api_key) {
        onVerified({ api_key: data.api_key });
        return;
      }
      onVerified({ next_step: data.next_step });
      setCode('');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const channel = step === 'verify_email' ? 'email' : 'phone';
    await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pending_id: pendingId, channel, resend: true }),
    });
  }

  const label = step === 'verify_email' ? f.verifyEmailTitle : f.verifyPhoneTitle;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{label}</h2>
      <p className="text-sm text-foreground-muted">
        {step === 'verify_email' ? (
          <>
            {f.sentTo} <span className="text-foreground">{email}</span>
          </>
        ) : (
          <>
            {f.phone} <span className="text-foreground">{phoneMasked || '***'}</span>
          </>
        )}
      </p>
      <Input
        inputMode="numeric"
        placeholder="000000"
        maxLength={6}
        className="font-mono tracking-widest"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      <button type="button" className="text-xs text-accent-cyan hover:underline" onClick={resend}>
        {step === 'verify_email' ? f.resendEmail : f.resendPhone}
      </button>
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <Button disabled={loading || code.length < 6} className="w-full" onClick={verify}>
        {loading ? f.verifying : f.confirm}
      </Button>
    </div>
  );
}
