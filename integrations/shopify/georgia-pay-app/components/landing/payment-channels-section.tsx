'use client';

import { motion } from 'framer-motion';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';
import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { PaymentBrandId } from '@/lib/payment-brands';
import { cn } from '@/lib/utils';
import { SectionHeader, SectionShell, AmbientOrbs } from './shared';

function WalletBadge({
  name,
  brand,
  desc,
}: {
  name: string;
  brand: PaymentBrandId;
  desc: string;
}) {
  return (
    <div className="flex min-w-[200px] max-w-xs flex-col rounded-2xl border border-border-strong bg-canvas-card/80 p-5 backdrop-blur-sm">
      <PaymentBrandLogo brand={brand} size="md" className="mb-4 self-start" />
      <span className="text-sm font-semibold tracking-tight">{name}</span>
      <span className="mt-2 text-xs leading-relaxed text-foreground-muted">{desc}</span>
    </div>
  );
}

function BankCard({
  bank,
  accent,
}: {
  bank: {
    name: string;
    brand: PaymentBrandId;
    product: string;
    tagline: string;
    services: { title: string; desc: string }[];
  };
  accent: 'cyan' | 'violet';
}) {
  const accentBorder =
    accent === 'cyan' ? 'from-accent-cyan/40 to-transparent' : 'from-accent-violet/40 to-transparent';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={cn(
        'landing-card-interactive relative flex h-full flex-col overflow-hidden rounded-3xl border border-border-strong p-8',
        'bg-gradient-to-b from-foreground/[0.04] to-transparent dark:from-white/[0.04]',
      )}
    >
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b', accentBorder)} />
      <PaymentBrandLogo brand={bank.brand} size="lg" className="mb-6 self-start" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan/80">{bank.product}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{bank.name}</h3>
      <p className="mt-2 text-sm text-foreground-muted">{bank.tagline}</p>
      <ul className="mt-8 flex-1 space-y-4">
        {bank.services.map((s) => (
          <li key={s.title} className="border-t border-border/60 pt-4 first:border-0 first:pt-0">
            <p className="text-sm font-medium text-foreground">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">{s.desc}</p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function PaymentChannelsSection() {
  const { t } = useLocale();
  const c = t.landing.paymentChannels;

  return (
    <SectionShell id="payment-methods" wide>
      <AmbientOrbs />
      <SectionHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <Stagger className="mb-14">
        <StaggerItem>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-foreground-muted">
            {c.walletsTitle}
          </p>
          <div className="flex flex-wrap items-stretch justify-center gap-4">
            {c.wallets.map((w) => (
              <WalletBadge key={w.name} name={w.name} brand={w.brand as PaymentBrandId} desc={w.desc} />
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-foreground-muted">{c.walletsNote}</p>
        </StaggerItem>
      </Stagger>

      <Stagger className="grid gap-8 lg:grid-cols-2">
        {c.banks.map((bank, i) => (
          <StaggerItem key={bank.name} className="h-full">
            <BankCard
              bank={{ ...bank, brand: bank.brand as PaymentBrandId }}
              accent={i === 0 ? 'cyan' : 'violet'}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <p className="mx-auto mt-12 max-w-3xl text-center text-sm text-foreground-muted">{c.disclaimer}</p>
    </SectionShell>
  );
}
