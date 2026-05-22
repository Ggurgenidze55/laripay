'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { TwoFactorPanel } from '@/components/auth/two-factor-panel';

type Props = {
  onLoggedIn: () => void;
};

export function AdminLoginPanel({ onLoggedIn }: Props) {
  const { t } = useLocale();
  const l = t.admin.login;
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/laripay/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || l.failed);
        return;
      }
      if (!data.requires_2fa && !data.challenge_id) {
        onLoggedIn();
        return;
      }
      setChallengeId(data.challenge_id);
      setPhoneMasked(data.phone_masked || '');
      setStep('2fa');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function complete2fa(emailCode: string, phoneCode: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challenge_id: challengeId,
          email_code: emailCode,
          phone_code: phoneCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || l.failed);
        return;
      }
      onLoggedIn();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend(channel: 'email' | 'phone') {
    await fetch('/api/auth/2fa/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, channel, resend: true }),
    });
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <Badge variant="live" pulse className="mb-4">
        {l.eyebrow}
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight">{l.title}</h1>
      <p className="mt-2 text-sm text-foreground-muted">{l.hint}</p>
      <Card className="mt-8 !p-6">
        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground-muted">{l.email}</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-muted">{l.password}</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full">
              {l.enter}
            </Button>
          </form>
        ) : (
          <TwoFactorPanel
            email={email}
            phoneMasked={phoneMasked}
            error={error}
            loading={loading}
            onVerify={complete2fa}
            onResend={resend}
          />
        )}
      </Card>
      <p className="mt-4 text-xs text-foreground-muted">{l.envHint}</p>
    </div>
  );
}
