'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COMPANY } from '@/lib/site-links';

export default function ContactPage() {
  return (
    <div className="max-w-3xl">
      <Badge variant="accent" className="mb-4">
        Company
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight text-white">Contact us</h1>
      <p className="mt-5 text-lg text-white/50">
        Sales, partnerships, and technical questions — we typically respond within one business day.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-medium text-white/80">General</h2>
          <a
            href={`mailto:${COMPANY.email}`}
            className="mt-2 block text-accent-cyan hover:underline"
          >
            {COMPANY.email}
          </a>
        </Card>
        <div id="support" className="scroll-mt-24">
        <Card className="p-6">
          <h2 className="text-sm font-medium text-white/80">Support</h2>
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="mt-2 block text-accent-cyan hover:underline"
          >
            {COMPANY.supportEmail}
          </a>
          <p className="mt-3 text-xs text-white/40">For existing merchants — include your merchant ID.</p>
        </Card>
        </div>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-medium text-white/90">Send a message</h2>
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
          <Input name="name" placeholder="Your name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="subject" placeholder="Subject" />
          <textarea
            name="message"
            required
            rows={5}
            placeholder="How can we help?"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-blue/50 focus:outline-none focus:ring-1 focus:ring-accent-blue/30"
          />
          <Button type="submit" variant="primary">
            Open in email client
          </Button>
        </form>
      </Card>

      <p className="mt-8 text-sm text-white/40">
        Building an integration? Start with{' '}
        <Link href="/laripay/docs" className="text-accent-cyan hover:underline">
          documentation
        </Link>{' '}
        or{' '}
        <Link href="/laripay/onboard" className="text-accent-cyan hover:underline">
          sandbox keys
        </Link>
        .
      </p>
    </div>
  );
}
