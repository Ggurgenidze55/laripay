'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
import { COMPANY } from '@/lib/site-links';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function ContactPage() {
  const { t, route } = useLocale();
  const p = t.pages.contact;

  return (
    <div className="max-w-3xl">
      <Stagger>
        <StaggerItem>
          <p className="landing-section-label">{p.eyebrow}</p>
        </StaggerItem>
        <StaggerItem>
          <h1 className="text-section text-tx-primary dark:text-zinc-50">{p.title}</h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-5 text-lg text-tx-body dark:text-zinc-300">{p.description}</p>
        </StaggerItem>
      </Stagger>

      <Stagger className="mt-10 grid gap-6 sm:grid-cols-2">
        <StaggerItem>
          <div className="landing-card p-6">
            <h2 className="text-sm font-semibold text-tx-primary dark:text-zinc-100">{p.general}</h2>
            <motion.a
              href={`mailto:${COMPANY.email}`}
              whileHover={{ x: 4 }}
              className="mt-2 block font-medium text-accent hover:underline dark:text-indigo-400"
            >
              {COMPANY.email}
            </motion.a>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div id="support" className="scroll-mt-24">
            <motion.div className="landing-card p-6">
              <h2 className="text-sm font-semibold text-tx-primary dark:text-zinc-100">{p.support}</h2>
              <motion.a
                href={`mailto:${COMPANY.supportEmail}`}
                whileHover={{ x: 4 }}
                className="mt-2 block font-medium text-accent hover:underline dark:text-indigo-400"
              >
                {COMPANY.supportEmail}
              </motion.a>
              <p className="mt-3 text-xs text-tx-muted">{p.supportNote}</p>
            </motion.div>
          </div>
        </StaggerItem>
      </Stagger>

      <FadeIn delay={0.15}>
        <div className="landing-card mt-8 p-6 md:p-8">
          <h2 className="text-card-h text-tx-primary dark:text-zinc-50">{p.sendMessage}</h2>
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
              viewport={{ once: true }}
              className="w-full rounded-btn border border-bd-default bg-bg-surface px-4 py-3 text-sm text-tx-primary placeholder:text-tx-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <Button type="submit" variant="primary">
              {p.openEmail}
            </Button>
          </form>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="prose-laripay mt-8 text-sm text-tx-secondary">
          {p.integrationHint}{' '}
          <Link href={route('docs')} className="text-accent hover:underline dark:text-indigo-400">
            {p.documentation}
          </Link>{' '}
          {p.or}{' '}
          <Link href={route('onboard')} className="text-accent hover:underline dark:text-indigo-400">
            {p.sandboxKeys}
          </Link>
          .
        </p>
      </FadeIn>
    </div>
  );
}
