'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function LoginPanel({
  apiKey,
  setApiKey,
  error,
  onSubmit,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="mx-auto max-w-md py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan">Merchant console</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in with API key</h1>
        <p className="mt-2 text-white/45">
          Use <code className="text-accent-cyan/80">sk_test_</code> or{' '}
          <code className="text-accent-cyan/80">sk_live_</code> from your dashboard.
        </p>
      </motion.div>

      <Card className="mt-8" glow>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="api-key" className="mb-2 block text-xs font-medium text-white/50">
              Secret key
            </label>
            <Input
              id="api-key"
              type="password"
              className="font-mono"
              placeholder="sk_test_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Enter console
          </Button>
        </form>
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-white/35">
          No key?{' '}
          <Link href="/api/laripay/setup" className="text-accent-cyan hover:underline">
            Setup
          </Link>{' '}
          ·{' '}
          <Link href="/laripay/onboard" className="text-accent-cyan hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
