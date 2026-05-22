'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/motion/fade-in';

export default function DemoPage() {
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
          success_url: `${origin}/laripay/dashboard?paid=1`,
          cancel_url: `${origin}/demo`,
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

  async function startDemo(provider: 'tbc' | 'bog') {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/demo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          amount: 1.5,
          orderId: `demo-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
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
          Sandbox
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Payment sandbox</h1>
        <p className="mt-2 max-w-xl text-white/45">
          Test TBC & BOG flows without Shopify. Bank credentials required in <code>.env</code>.
        </p>
      </FadeIn>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card glow>
          <Badge variant="live" className="mb-3">
            Recommended
          </Badge>
          <h2 className="text-lg font-medium">LariPay.ai API</h2>
          <p className="mt-1 text-sm text-white/40">Checkout session + platform fee</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={loading} onClick={() => startLariPayCheckout('tbc')}>
              TBC · 2.00 ₾
            </Button>
            <Button variant="secondary" disabled={loading} onClick={() => startLariPayCheckout('bog')}>
              BOG · 2.00 ₾
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium">Direct bank SDK</h2>
          <p className="mt-1 text-sm text-white/40">Low-level debug path</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" disabled={loading} onClick={() => startDemo('tbc')}>
              TBC · 1.50 ₾
            </Button>
            <Button variant="secondary" disabled={loading} onClick={() => startDemo('bog')}>
              BOG · 1.50 ₾
            </Button>
          </div>
        </Card>
      </div>

      {result && (
        <motion.pre
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#030306] p-4 font-mono text-xs text-white/60"
        >
          {result}
        </motion.pre>
      )}

      <p className="mt-10 text-sm text-white/35">
        <Link href="/laripay/dashboard" className="text-accent-cyan hover:underline">
          Dashboard
        </Link>{' '}
        ·{' '}
        <Link href="/api/laripay/setup" className="text-accent-cyan hover:underline">
          API setup
        </Link>
      </p>
    </>
  );
}
