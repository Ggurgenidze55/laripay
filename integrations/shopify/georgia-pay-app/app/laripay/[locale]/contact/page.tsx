'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/interactive';
import { COMPANY } from '@/lib/site-links';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function ContactPage() {
  const { t, route } = useLocale();
  const p = t.pages.contact;

  return (
    <div className="max-w-3xl">
      <Stagger>
        <StaggerItem>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Badge variant="accent" className="mb-4">
              {p.eyebrow}
            </Badge>
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">{p.title}</h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-5 text-lg text-foreground-muted">{p.description}</p>
        </StaggerItem>
      </Stagger>

      <Stagger className="mt-10 grid gap-6 sm:grid-cols-2">
        <StaggerItem>
          <HoverLift>
            <Card className="p-6" hover>
              <h2 className="text-sm font-medium text-foreground/80">{p.general}</h2>
              <motion.a
                href={`mailto:${COMPANY.email}`}
                whileHover={{ x: 4 }}
                className="mt-2 block text-accent-cyan hover:underline"
              >
                {COMPANY.email}
              </motion.a>
            </Card>
          </HoverLift>
        </StaggerItem>
        <StaggerItem>
          <HoverLift>
            <div id="support" className="scroll-mt-24">
              <Card className="p-6" hover>
                <h2 className="text-sm font-medium text-foreground/80">{p.support}</h2>
                <motion.a
                  href={`mailto:${COMPANY.supportEmail}`}
                  whileHover={{ x: 4 }}
                  className="mt-2 block text-accent-cyan hover:underline"
                >
                  {COMPANY.supportEmail}
                </motion.a>
                <p className="mt-3 text-xs text-foreground-muted">{p.supportNote}</p>
              </Card>
            </div>
          </HoverLift>
        </StaggerItem>
      </Stagger>

      <FadeIn delay={0.15}>
        <Card className="mt-8 p-6" glow>
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
            {(['name', 'email', 'subject'] as const).map((field, i) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <Input
                  name={field}
                  type={field === 'email' ? 'email' : 'text'}
                  placeholder={
                    field === 'name'
                      ? p.namePlaceholder
                      : field === 'email'
                        ? p.emailPlaceholder
                        : p.subjectPlaceholder
                  }
                  required={field !== 'subject'}
                />
              </motion.div>
            ))}
            <motion.textarea
              name="message"
              required
              rows={5}
              placeholder={p.messagePlaceholder}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileFocus={{ scale: 1.01, borderColor: 'rgba(56, 189, 248, 0.5)' }}
              viewport={{ once: true }}
              className="w-full rounded-xl border border-border-strong bg-canvas px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
            />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" variant="primary">
                {p.openEmail}
              </Button>
            </motion.div>
          </form>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="mt-8 text-sm text-foreground-muted">
          {p.integrationHint}{' '}
          <Link href={route('docs')} className="text-accent-cyan hover:underline">
            {p.documentation}
          </Link>{' '}
          {p.or}{' '}
          <Link href={route('onboard')} className="text-accent-cyan hover:underline">
            {p.sandboxKeys}
          </Link>
          .
        </p>
      </FadeIn>
    </div>
  );
}
