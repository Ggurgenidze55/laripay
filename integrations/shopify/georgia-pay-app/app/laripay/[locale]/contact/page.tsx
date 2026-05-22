'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COMPANY } from '@/lib/site-links';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function ContactPage() {
  const { locale, t, href } = useLocale();
  const p = t.pages.contact;

  return (
    <div className="max-w-3xl">
      <Badge variant="accent" className="mb-4">
        {p.eyebrow}
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">{p.title}</h1>
      <p className="mt-5 text-lg text-foreground-muted">{p.description}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-medium text-foreground/80">{p.general}</h2>
          <a href={`mailto:${COMPANY.email}`} className="mt-2 block text-accent-cyan hover:underline">
            {COMPANY.email}
          </a>
        </Card>
        <div id="support" className="scroll-mt-24">
          <Card className="p-6">
            <h2 className="text-sm font-medium text-foreground/80">{p.support}</h2>
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="mt-2 block text-accent-cyan hover:underline"
            >
              {COMPANY.supportEmail}
            </a>
            <p className="mt-3 text-xs text-foreground-muted">{p.supportNote}</p>
          </Card>
        </div>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-medium text-foreground">{p.sendMessage}</h2>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const subject = encodeURIComponent(String(fd.get('subject') || 'LariPay inquiry'));
            const body = encodeURIComponent(
              `Name: ${fd.get('name')}\nEmail: ${fd.get('email')}\n\n${fd.get('message')}`,
            );
            window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
          }}
        >
          <Input name="name" placeholder={p.namePlaceholder} required />
          <Input name="email" type="email" placeholder={p.emailPlaceholder} required />
          <Input name="subject" placeholder={p.subjectPlaceholder} />
          <textarea
            name="message"
            required
            rows={5}
            placeholder={p.messagePlaceholder}
            className="w-full rounded-xl border border-border-strong bg-canvas px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
          />
          <Button type="submit" variant="primary">
            {p.openEmail}
          </Button>
        </form>
      </Card>

      <p className="mt-8 text-sm text-foreground-muted">
        {p.integrationHint}{' '}
        <Link href={href('/laripay/docs')} className="text-accent-cyan hover:underline">
          {p.documentation}
        </Link>{' '}
        {p.or}{' '}
        <Link href={href('/laripay/onboard')} className="text-accent-cyan hover:underline">
          {p.sandboxKeys}
        </Link>
        .
      </p>
    </div>
  );
}
