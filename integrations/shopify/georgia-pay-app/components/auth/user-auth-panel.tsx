'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/interactive';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { apiErrorMessage, fetchWithDbRetry, parseApiJson } from '@/lib/api-client';
import { RegisterVerifyPanel } from './register-verify-panel';
import { TwoFactorPanel } from './two-factor-panel';

type Mode = 'register' | 'login';
type RegisterStep = 'form' | 'verify_email' | 'verify_phone';
type LoginStep = 'form' | '2fa';

export function UserAuthPanel({ initialMode = 'register' }: { initialMode?: Mode }) {
  const { t, route } = useLocale();
  const a = t.pages.auth;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [loginStep, setLoginStep] = useState<LoginStep>('form');
  const [pendingId, setPendingId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    slug: '',
  });

  useEffect(() => {
    fetch('/api/health', { credentials: 'include' }).catch(() => {});
  }, []);

  async function postRegister(): Promise<Response> {
    return fetchWithDbRetry('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        business_name: form.businessName,
        slug: form.slug || undefined,
      }),
    });
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiKey(null);
    try {
      const res = await postRegister();
      const data = (await parseApiJson(res)) as Record<string, unknown>;
      if (!res.ok) {
        setError(apiErrorMessage(data, a.registerFailed));
        return;
      }
      if (data.api_key) {
        setApiKey(String(data.api_key));
        try {
          sessionStorage.setItem('laripay_api_key', String(data.api_key));
        } catch {
          /* ignore */
        }
        return;
      }
      setPendingId(String(data.pending_id || ''));
      setRegisterStep('verify_email');
    } catch (err) {
      setError(err instanceof Error ? err.message : a.registerFailed);
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithDbRetry('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = (await parseApiJson(res)) as Record<string, unknown>;
      if (!res.ok) {
        setError(apiErrorMessage(data, a.loginFailed));
        return;
      }
      if (!data.requires_2fa && !data.challenge_id) {
        router.push(route('dashboard'));
        router.refresh();
        return;
      }
      setChallengeId(String(data.challenge_id || ''));
      setPhoneMasked(String(data.phone_masked || ''));
      setLoginStep('2fa');
    } catch (err) {
      setError(err instanceof Error ? err.message : a.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  async function completeLogin2fa(emailCode: string, phoneCode: string) {
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
        setError(apiErrorMessage(data, a.loginFailed));
        return;
      }
      if (!data.requires_2fa && !data.challenge_id) {
        router.push(route('dashboard'));
        router.refresh();
        return;
      }
      setChallengeId(String(data.challenge_id || ''));
      setPhoneMasked(String(data.phone_masked || ''));
      setLoginStep('2fa');
    } catch (err) {
      setError(err instanceof Error ? err.message : a.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  async function resendLogin2fa(channel: 'email' | 'phone') {
    await fetch('/api/auth/2fa/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, channel, resend: true }),
    });
  }

  function resetMode(next: Mode) {
    setMode(next);
    setError('');
    setApiKey(null);
    setRegisterStep('form');
    setLoginStep('form');
    setPendingId('');
    setChallengeId('');
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <Stagger>
        <StaggerItem>
          <p className="landing-section-label mb-4">{a.eyebrow}</p>
        </StaggerItem>
        <StaggerItem>
          <h1 className="text-section text-tx-primary dark:text-zinc-50">{a.title}</h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-2 text-tx-body dark:text-zinc-300">{a.description}</p>
        </StaggerItem>
      </Stagger>

      {registerStep === 'form' && loginStep === 'form' ? (
        <div className="mt-6 flex gap-2 rounded-btn border border-bd-default bg-bg-subtle p-1 dark:border-zinc-700 dark:bg-zinc-900">
          {(['register', 'login'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => resetMode(m)}
              className={cn(
                'flex-1 rounded-btn py-2 text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-accent-light text-accent dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-tx-muted hover:text-tx-primary dark:hover:text-zinc-100',
              )}
            >
              {m === 'register' ? a.tabRegister : a.tabLogin}
            </button>
          ))}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {apiKey ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <HoverLift>
              <Card className="mt-6 !p-6" glow>
                <p className="rounded-btn border border-success/30 bg-success/10 px-3 py-2 text-sm text-success dark:text-green-400">
                  {a.registerSuccess}
                </p>
                <label className="mt-4 block text-xs text-foreground-muted">{a.apiKeyOnce}</label>
                <Input readOnly className="mt-2 font-mono" value={apiKey} onFocus={(e) => e.target.select()} />
                <Link href={route('dashboard')} className="mt-6 block">
                  <Button className="w-full">{a.openDashboard}</Button>
                </Link>
              </Card>
            </HoverLift>
          </motion.div>
        ) : mode === 'register' && registerStep !== 'form' ? (
          <motion.div key={registerStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <HoverLift>
              <Card className="mt-6 !p-6">
                <RegisterVerifyPanel
                  pendingId={pendingId}
                  email={form.email}
                  phoneMasked={phoneMasked || form.phone}
                  step={registerStep === 'verify_email' ? 'verify_email' : 'verify_phone'}
                  onVerified={(data) => {
                    if (data.api_key) {
                      setApiKey(String(data.api_key));
                      try {
                        sessionStorage.setItem('laripay_api_key', String(data.api_key));
                      } catch {
                        /* ignore */
                      }
                      return;
                    }
                    if (data.next_step === 'verify_phone') {
                      setRegisterStep('verify_phone');
                    }
                  }}
                />
              </Card>
            </HoverLift>
          </motion.div>
        ) : mode === 'login' && loginStep === '2fa' ? (
          <motion.div key="2fa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <HoverLift>
              <Card className="mt-6 !p-6">
                <TwoFactorPanel
                  email={form.email}
                  phoneMasked={phoneMasked}
                  error={error}
                  loading={loading}
                  onVerify={completeLogin2fa}
                  onResend={resendLogin2fa}
                />
              </Card>
            </HoverLift>
          </motion.div>
        ) : (
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <HoverLift>
              <Card className="mt-6 !p-6">
                <form onSubmit={mode === 'register' ? submitRegister : submitLogin} className="space-y-4">
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="text-xs text-foreground-muted">{a.fullName}</label>
                        <Input
                          required
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground-muted">{a.businessName}</label>
                        <Input
                          required
                          value={form.businessName}
                          onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground-muted">
                          {a.slug} ({a.optional})
                        </label>
                        <Input
                          className="font-mono"
                          placeholder={a.slugPlaceholder}
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground-muted">{a.phone}</label>
                        <Input
                          type="tel"
                          placeholder="+995 5XX XX XX XX"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs text-foreground-muted">{a.email}</label>
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">{a.password}</label>
                    <Input
                      type="password"
                      required
                      minLength={12}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  {mode === 'register' ? (
                    <p className="text-xs text-foreground-muted">{a.twoFactorNote}</p>
                  ) : null}
                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading
                      ? a.loading
                      : mode === 'register'
                        ? a.createAccount
                        : a.signIn}
                  </Button>
                </form>
                {error ? (
                  <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}
              </Card>
            </HoverLift>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
