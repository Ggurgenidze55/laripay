'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/interactive';
import { TwoFactorPanel } from '@/components/auth/two-factor-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { apiErrorMessage, fetchWithDbRetry, formatFetchError, parseApiJson, warmDatabase } from '@/lib/api-client';

type Props = {
  onLoggedIn: () => void;
};

export function MerchantConsoleLoginPanel({ onLoggedIn }: Props) {
  const { route, t } = useLocale();
  const l = t.dashboard.login;
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/health', { credentials: 'include' }).catch(() => {});
  }, []);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await warmDatabase();
      const res = await fetchWithDbRetry('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await parseApiJson(res)) as Record<string, unknown>;
      if (!res.ok) {
        setError(apiErrorMessage(data, l.loginFailed));
        return;
      }
      if (!data.requires_2fa && !data.challenge_id) {
        onLoggedIn();
        return;
      }
      if (!data.challenge_id) {
        setError(l.loginFailed);
        return;
      }
      setChallengeId(String(data.challenge_id || ''));
      setPhoneMasked(String(data.phone_masked || ''));
      setStep('2fa');
    } catch (err) {
      setError(formatFetchError(err, l.loginFailed));
    } finally {
      setLoading(false);
    }
  }

  async function complete2fa(emailCode: string, phoneCode: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithDbRetry('/api/auth/2fa/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challenge_id: challengeId,
          email_code: emailCode,
          phone_code: phoneCode,
        }),
      });
      const data = (await parseApiJson(res)) as Record<string, unknown>;
      if (!res.ok) {
        setError(apiErrorMessage(data, l.loginFailed));
        return;
      }
      onLoggedIn();
    } catch (err) {
      setError(formatFetchError(err, l.loginFailed));
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
    <div className="mx-auto max-w-md py-16">
      <Stagger>
        <StaggerItem>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan">{l.eyebrow}</p>
        </StaggerItem>
        <StaggerItem>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{l.title}</h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-2 text-foreground-muted">{l.hint}</p>
        </StaggerItem>
      </Stagger>

      <HoverLift className="mt-8">
        <Card className="mt-0 !p-6" glow>
          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground-muted">{l.email}</label>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
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
                  autoComplete="current-password"
                  minLength={12}
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
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? l.verifying : l.continueTo2fa}
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
      </HoverLift>

      <p className="mt-4 text-center text-xs text-foreground-muted">{l.deliveryHint}</p>
      <p className="mt-3 text-center text-xs text-foreground-muted">
        {l.noAccount}{' '}
        <Link href={route('onboard')} className="text-accent-cyan hover:underline">
          {l.register}
        </Link>
        {' · '}
        <Link href={route('login')} className="text-accent-cyan hover:underline">
          {l.signInPage}
        </Link>
      </p>
    </div>
  );
}
