'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/interactive';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function DemoPage() {
  const { t, route, locale } = useLocale();
  const p = t.pages.demo;
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    fetch('/api/laripay/setup')
      .then((r) => r.json())
      .then((d) => {
        if (d.demo_api_key) setApiKey(d.demo_api_key);
      })
      .catch(() => {});
  }, []);

  async function startLariPayCheckout(provider: 'tbc' | 'bog') {
    if (!apiKey) {
      setResult('Open /api/laripay/setup and set LARIPAY_DEMO_API_KEY in .env');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const origin = window.location.origin;
      const res = await fetch('/api/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          amount: 2.0,
          provider,
          success_url: `${origin}${route('dashboard')}?paid=1`,
          cancel_url: `${origin}${route('demo')}`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <FadeIn>
        <Badge variant="accent" pulse className="mb-4">
          {p.sandbox}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1>
        <p className="mt-2 max-w-xl text-foreground-muted">{p.description}</p>
      </FadeIn>

      <Stagger className="mt-10 grid gap-6 md:grid-cols-2">
        <StaggerItem>
          <HoverLift>
            <Card glow>
              <h2 className="text-lg font-medium">{p.apiCardTitle}</h2>
              <p className="mt-1 text-sm text-foreground-muted">{p.apiCardDesc}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button disabled={loading} onClick={() => startLariPayCheckout('tbc')}>
                    TBC · 2.00 ₾
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="secondary" disabled={loading} onClick={() => startLariPayCheckout('bog')}>
                    BOG · 2.00 ₾
                  </Button>
                </motion.div>
              </div>
            </Card>
          </HoverLift>
        </StaggerItem>
      </Stagger>

      {result && (
        <motion.pre
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-x-auto rounded-2xl border border-border bg-canvas-elevated p-4 font-mono text-xs text-foreground/60"
        >
          {result}
        </motion.pre>
      )}

      <p className="mt-10 text-sm text-foreground-muted">
        <Link href={route('dashboard')} className="text-accent-cyan hover:underline">
          {p.dashboard}
        </Link>{' '}
        ·{' '}
        <Link href="/api/laripay/setup" className="text-accent-cyan hover:underline">
          {p.setup}
        </Link>
      </p>
    </>
  );
}
