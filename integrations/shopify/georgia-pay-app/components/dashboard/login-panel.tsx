'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/i18n/LocaleProvider';

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
  const { href, t } = useLocale();
  const l = t.dashboard.login;

  return (
    <div className="mx-auto max-w-md py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan">{l.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{l.title}</h1>
        <p className="mt-2 text-foreground-muted">{l.hint}</p>
      </motion.div>

      <Card className="mt-8" glow>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="api-key" className="mb-2 block text-xs font-medium text-foreground-muted">
              {l.secretKey}
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
            {l.enter}
          </Button>
        </form>
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-foreground-muted">
          {l.noKey}{' '}
          <Link href="/api/laripay/setup" className="text-accent-cyan hover:underline">
            {l.setup}
          </Link>{' '}
          ·{' '}
          <Link href={href('/laripay/onboard')} className="text-accent-cyan hover:underline">
            {l.register}
          </Link>
        </p>
      </Card>
    </div>
  );
}
