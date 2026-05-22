'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import { LariPayLogo } from '@/components/laripay/Logo';
import { cn } from '@/lib/utils';
import type { PaymentBrandId } from '@/lib/payment-brands';

type CheckoutSession = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  provider: 'tbc' | 'bog';
  merchant_name: string;
  redirect_url: string | null;
  cancel_url: string | null;
  success_url: string;
  expires_at: number;
};

type Copy = {
  secure: string;
  payTo: string;
  total: string;
  wallets: string;
  walletsHint: string;
  banks: string;
  payWith: string;
  continueBank: string;
  processing: string;
  expired: string;
  notFound: string;
  cancel: string;
  powered: string;
};

const COPY: Record<'en' | 'ka', Copy> = {
  en: {
    secure: 'Secure checkout',
    payTo: 'Pay to',
    total: 'Total',
    wallets: 'Wallets',
    walletsHint: 'Available on the bank page after you continue',
    banks: 'Pay with bank',
    payWith: 'Pay',
    continueBank: 'Continue to bank',
    processing: 'Redirecting to bank…',
    expired: 'This checkout session has expired.',
    notFound: 'Checkout session not found.',
    cancel: 'Cancel',
    powered: 'Powered by LariPay',
  },
  ka: {
    secure: 'უსაფრთხო გადახდა',
    payTo: 'გადახდა',
    total: 'ჯამი',
    wallets: 'საფულეები',
    walletsHint: 'ბანკის გვერდზე გადასვლის შემდეგ ხელმისაწვდომია',
    banks: 'ბანკით გადახდა',
    payWith: 'გადახდა',
    continueBank: 'ბანკზე გადასვლა',
    processing: 'ბანკზე გადამისამართება…',
    expired: 'გადახდის სესია ვადაგასულია.',
    notFound: 'გადახდის სესია ვერ მოიძებნა.',
    cancel: 'გაუქმება',
    powered: 'LariPay',
  },
};

function formatAmount(amount: number, currency: string, locale: 'en' | 'ka') {
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-GE', {
    style: 'currency',
    currency: currency || 'GEL',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function HostedCheckoutPage({
  sessionId,
  locale,
}: {
  sessionId: string;
  locale: 'en' | 'ka';
}) {
  const t = COPY[locale];
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'tbc' | 'bog'>('tbc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/checkout/ui/${sessionId}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setSession(null);
      setError(data.error || t.notFound);
      return;
    }
    setSession(data);
    setProvider(data.provider === 'bog' ? 'bog' : 'tbc');
  }, [sessionId, t.notFound]);

  useEffect(() => {
    load();
  }, [load]);

  async function pay(selected?: 'tbc' | 'bog') {
    if (!session) return;
    const bank = selected ?? provider;

    if (session.redirect_url) {
      window.location.href = session.redirect_url;
      return;
    }

    setPaying(true);
    setError('');
    const res = await fetch(`/api/checkout/ui/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: bank }),
    });
    const data = await res.json();
    setPaying(false);

    if (data.redirect_url) {
      window.location.href = data.redirect_url;
      return;
    }
    setError(data.message || data.error || 'Payment failed');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-foreground-muted">{error || t.notFound}</p>
      </div>
    );
  }

  if (session.status === 'expired') {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-foreground-muted">{t.expired}</p>
        {session.cancel_url ? (
          <Link href={session.cancel_url} className="mt-6 text-sm text-accent-cyan hover:underline">
            {t.cancel}
          </Link>
        ) : null}
      </div>
    );
  }

  const banks: { id: 'tbc' | 'bog'; brand: PaymentBrandId; label: string }[] = [
    { id: 'tbc', brand: 'tbc', label: 'TBC Pay' },
    { id: 'bog', brand: 'bog', label: 'BOG Pay' },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <LariPayLogo size={36} showWordmark={false} />
        <span className="rounded-full border border-border bg-canvas-card/80 px-3 py-1 text-xs text-foreground-muted">
          {t.secure}
        </span>
      </header>

      <div className="rounded-3xl border border-border-strong bg-canvas-card/90 p-6 shadow-glow-light backdrop-blur-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">{t.payTo}</p>
        <p className="mt-1 text-lg font-semibold">{session.merchant_name}</p>

        <div className="mt-6 flex items-end justify-between border-b border-border pb-6">
          <span className="text-sm text-foreground-muted">{t.total}</span>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatAmount(session.amount, session.currency, locale)}
          </span>
        </div>

        <section className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-foreground-muted">{t.wallets}</p>
          <div className="flex flex-wrap gap-3">
            <PaymentBrandLogo brand="google-pay" size="md" />
            <PaymentBrandLogo brand="apple-pay" size="md" />
          </div>
          <p className="mt-2 text-xs text-foreground-muted">{t.walletsHint}</p>
        </section>

        <section className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-foreground-muted">{t.banks}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {banks.map((bank) => {
              const selected = provider === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setProvider(bank.id)}
                  className={cn(
                    'flex flex-col items-center rounded-2xl border p-4 transition-all',
                    selected
                      ? 'border-accent-cyan bg-accent-cyan/5 ring-2 ring-accent-cyan/30'
                      : 'border-border bg-canvas-elevated/50 hover:border-border-strong',
                  )}
                >
                  <PaymentBrandLogo brand={bank.brand} size="lg" transparent />
                  <span className="mt-3 text-sm font-medium">{bank.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

        <button
          type="button"
          disabled={paying}
          onClick={() => pay()}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-accent-blue to-accent-violet py-4 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {paying
            ? t.processing
            : session.redirect_url
              ? t.continueBank
              : `${t.payWith} ${provider === 'tbc' ? 'TBC' : 'BOG'}`}
        </button>

        {session.cancel_url ? (
          <Link
            href={session.cancel_url}
            className="mt-4 block text-center text-sm text-foreground-muted hover:text-foreground"
          >
            {t.cancel}
          </Link>
        ) : null}
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-foreground-muted">{t.powered}</p>
    </div>
  );
}
