'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Props = {
  email: string;
  phoneMasked?: string;
  onVerify: (emailCode: string, phoneCode: string) => Promise<void>;
  onResend: (channel: 'email' | 'phone') => Promise<void>;
  loading?: boolean;
  error?: string;
  devHint?: string;
};

export function TwoFactorPanel({
  email,
  phoneMasked,
  onVerify,
  onResend,
  loading,
  error,
  devHint,
}: Props) {
  const { t } = useLocale();
  const f = t.pages.auth.twoFactor;
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">{f.description}</p>
      <p className="text-xs text-foreground-muted">
        {f.sentTo} <span className="text-foreground">{email}</span>
        {phoneMasked ? (
          <>
            {' '}
            · {f.phone} <span className="text-foreground">{phoneMasked}</span>
          </>
        ) : null}
      </p>
      {devHint ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-200">
          DEV: {devHint}
        </p>
      ) : null}
      <div>
        <label className="text-xs text-foreground-muted">{f.emailCode}</label>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          className="mt-1 font-mono tracking-widest"
          value={emailCode}
          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button
          type="button"
          className="mt-1 text-xs text-accent-cyan hover:underline"
          onClick={() => onResend('email')}
        >
          {f.resendEmail}
        </button>
      </div>
      <div>
        <label className="text-xs text-foreground-muted">{f.phoneCode}</label>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          className="mt-1 font-mono tracking-widest"
          value={phoneCode}
          onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button
          type="button"
          className="mt-1 text-xs text-accent-cyan hover:underline"
          onClick={() => onResend('phone')}
        >
          {f.resendPhone}
        </button>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={loading || emailCode.length < 6 || phoneCode.length < 6}
        className="w-full"
        size="lg"
        onClick={() => onVerify(emailCode, phoneCode)}
      >
        {loading ? f.verifying : f.confirm}
      </Button>
    </div>
  );
}
