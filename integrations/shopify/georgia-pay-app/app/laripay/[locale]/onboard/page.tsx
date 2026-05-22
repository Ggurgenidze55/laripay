'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function LariPayOnboardPage() {
  const { t, href } = useLocale();
  const p = t.pages.onboard;
  const [form, setForm] = useState({ name: '', email: '', slug: '' });
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiKey(null);
    try {
      const res = await fetch('/api/laripay/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || 'Registration failed');
        return;
      }
      setApiKey(data.api_key || null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="accent" className="mb-4">
          {p.eyebrow}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1>
        <p className="mt-2 text-foreground-muted">{p.description}</p>
      </motion.div>

      {apiKey ? (
        <Card className="mt-8" glow>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {p.success}
          </div>
          <label className="mt-6 block text-xs font-medium text-foreground-muted">{p.yourKey}</label>
          <Input readOnly className="mt-2 font-mono" value={apiKey} onFocus={(e) => e.target.select()} />
          <Link
            href={href('/laripay/dashboard')}
            className={cn(
              'mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium',
              buttonVariants.primary,
            )}
          >
            {p.openDashboard}
          </Link>
        </Card>
      ) : (
        <Card className="mt-8" glow>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-xs text-foreground-muted">
                {p.businessName}
              </label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-xs text-foreground-muted">
                {p.email}
              </label>
              <Input
                id="email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="slug" className="mb-2 block text-xs text-foreground-muted">
                {p.slug} <span className="text-foreground-muted/80">{p.optional}</span>
              </label>
              <Input
                id="slug"
                className="font-mono"
                placeholder={p.slugPlaceholder}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? p.creating : p.createAccount}
            </Button>
          </form>
          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <p className="mt-6 text-xs text-foreground-muted">{p.requiresSignup}</p>
        </Card>
      )}
    </div>
  );
}
