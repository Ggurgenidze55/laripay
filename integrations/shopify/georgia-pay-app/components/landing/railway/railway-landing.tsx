'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { getSiteNav } from '@/lib/site-links';
import { localePath } from '@/lib/i18n/routing';
import { LariPayLogo } from '@/components/laripay/Logo';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { PaymentBrandLogo } from '@/components/laripay/payment-brand-logo';
import type { PaymentBrandId } from '@/lib/payment-brands';
import { RailwayDashboardMock } from './railway-dashboard-mock';
import { RailwayHowItWorks } from './railway-how-it-works';
import { RailwayEventsDevSection } from './railway-events-dev-section';
import { RailwayIntegrationsSection } from './railway-integrations-section';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a78bfa]">{children}</p>
  );
}

function RailwayNav({
  homeHref,
  nav,
  startLabel,
  loginLabel,
  onboardHref,
  loginHref,
}: {
  homeHref: string;
  nav: ReturnType<typeof getSiteNav>;
  startLabel: string;
  loginLabel: string;
  onboardHref: string;
  loginHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <header
        className={cn(
          'pointer-events-auto w-full max-w-[1200px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0b0a10]/92 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl',
        )}
      >
        <div className="flex h-[56px] items-center justify-between gap-4 px-5 sm:px-6">
        <Link href={homeHref} className="shrink-0">
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9333ea] via-[#8b5cf6] to-[#6366f1] text-sm font-bold text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]">
              ₾
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white">LariPay</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-[13px] text-[#a1a1aa] transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex [&_button]:border-white/10 [&_button]:bg-white/5 [&_button]:text-[#a1a1aa] [&_button]:hover:text-white" />
          <Link
            href={loginHref}
            className="hidden rounded-lg px-3 py-1.5 text-[13px] text-[#a1a1aa] transition-colors hover:text-white sm:inline-block"
          >
            {loginLabel}
          </Link>
          <Link
            href={onboardHref}
            className="hidden rounded-lg bg-white px-4 py-1.5 text-[13px] font-semibold text-[#0b0a10] transition-all hover:shadow-[0_0_24px_-4px_rgba(255,255,255,0.35)] sm:inline-flex"
          >
            {startLabel}
          </Link>
          <button
            type="button"
            aria-expanded={open}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-[#a1a1aa] md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-white/[0.06] px-4 py-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={onboardHref}
            className="mt-2 block rounded-lg bg-white py-2 text-center text-sm font-semibold text-[#0b0a10]"
          >
            {startLabel}
          </Link>
        </nav>
      ) : null}
      </header>
    </div>
  );
}

export function RailwayLanding() {
  const { locale, t, route } = useLocale();
  const nav = useMemo(() => getSiteNav(locale), [locale]);
  const h = t.landing.hero;
  const dev = t.landing.developerExperience;
  const infra = t.landing.infrastructure;
  const payInfra = t.landing.paymentInfrastructure;
  const analytics = t.landing.analytics;
  const webhooks = t.landing.webhooks;
  const integrations = t.landing.integrationsSection;
  const security = t.landing.securitySection;
  const pricing = t.landing.pricing;
  const cta = t.landing.footerCta;
  const footer = t.footer;
  const homeHref = localePath(locale);
  const navLabels = t.nav;
  const statLabels = [h.stats.banks, h.stats.logistics, h.stats.currency] as const;

  const [sdkTab, setSdkTab] = useState(0);

  const pricingPlans = [
    {
      name: pricing.commission,
      price: '1%',
      sub: pricing.perPayment,
      featured: false,
      features: [pricing.noMonthly, pricing.tbcBog, pricing.fullApi],
    },
    {
      name: pricing.starter,
      price: '49 ₾',
      sub: pricing.perMonth,
      featured: true,
      features: [pricing.zeroCommission, pricing.dashboardWebhooks, pricing.emailSupport],
    },
    {
      name: pricing.pro,
      price: '149 ₾',
      sub: pricing.perMonth,
      featured: false,
      features: [pricing.highVolume, pricing.priorityRouting, pricing.dedicatedOnboarding],
    },
  ];

  return (
    <div className="railway-theme min-h-screen overflow-x-hidden bg-[#0b0a10] text-[#e4e4e7] selection:bg-[#8b5cf6]/40 selection:text-white">
      <RailwayNav
        homeHref={homeHref}
        nav={nav}
        startLabel={h.startBuilding}
        loginLabel={locale === 'ka' ? 'შესვლა' : 'Sign in'}
        onboardHref={route('onboard')}
        loginHref={route('login')}
      />

      {/* Hero — copy + dashboard centered in viewport */}
      <section className="relative flex flex-col justify-center px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-24 lg:min-h-[calc(100svh-5.5rem)] lg:py-8 lg:pt-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 55% at 50% -10%, rgba(147, 51, 234, 0.42), transparent 55%),
              radial-gradient(ellipse 50% 35% at 85% 20%, rgba(99, 102, 241, 0.18), transparent 45%),
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)
            `,
            backgroundSize: 'auto, auto, 32px 32px',
          }}
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center text-center">
          <div className="flex w-full shrink-0 flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/35 bg-[#8b5cf6]/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d8b4fe] sm:text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a78bfa] opacity-50" />
                <span className="relative h-2 w-2 rounded-full bg-[#a78bfa]" />
              </span>
              {h.badge}
            </span>

            <h1 className="mx-auto mt-4 max-w-[820px] text-[clamp(1.875rem,4vw+0.5rem,3.75rem)] font-bold leading-[1.06] tracking-[-0.045em] text-white sm:mt-5 lg:mt-3 lg:max-w-[900px] lg:text-[clamp(2.25rem,3.2vw,3.5rem)]">
              {h.title1}{' '}
              <span className="bg-gradient-to-r from-white via-[#e9d5ff] to-[#a78bfa] bg-clip-text text-transparent">
                {h.title2}
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-[560px] text-[clamp(0.9375rem,1vw+0.7rem,1.0625rem)] leading-[1.6] text-[#a1a1aa] sm:mt-4 lg:mt-2.5 lg:max-w-[640px]">
              {h.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6 lg:mt-4">
              <Link
                href={route('onboard')}
                className="group inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0b0a10] shadow-[0_0_48px_-10px_rgba(255,255,255,0.45)] transition-all hover:scale-[1.02] sm:h-11 sm:px-6"
              >
                {h.startBuilding}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href={route('docs')}
                className="inline-flex h-10 items-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.08] sm:h-11 sm:px-6"
              >
                {h.exploreApi}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0 sm:mt-8 sm:gap-6 lg:mt-3 lg:gap-8">
              {h.paymentBadges.map((b) => (
                <PaymentBrandLogo
                  key={b.brand}
                  brand={b.brand as PaymentBrandId}
                  size="sm"
                  transparent
                  className="h-6 opacity-90 sm:h-7"
                />
              ))}
            </div>
          </div>

          <div className="mx-auto mt-8 w-full max-w-6xl sm:mt-10 lg:mt-6 xl:max-w-[1180px]">
            <RailwayDashboardMock compact logs={dev.logs} statLabels={statLabels} statValues={h.statValues} />
          </div>
        </div>
      </section>

      {/* Metrics band */}
      <section className="border-y border-white/[0.06] bg-[#08070c]/80 px-6 py-10 backdrop-blur-sm">
        <div className="mx-auto grid max-w-[1200px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analytics.metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group rounded-xl border border-white/[0.06] bg-[#13111a]/60 p-5 transition-colors hover:border-[#8b5cf6]/30 hover:bg-[#13111a]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#52525b]">{m.label}</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white">{m.value}</p>
              <p className="mt-1 text-xs text-[#71717a]">{m.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <RailwayHowItWorks infra={infra} payInfra={payInfra} />

      <RailwayEventsDevSection
        webhooks={webhooks}
        dev={dev}
        sdkTab={sdkTab}
        onSdkTabChange={setSdkTab}
      />

      <RailwayIntegrationsSection />

      {/* Security */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-[1200px] text-center">
          <SectionLabel>{security.eyebrow}</SectionLabel>
          <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">{security.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#71717a]">{security.description}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {security.items.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/[0.08] bg-[#13111a] p-5 text-left transition-colors hover:border-[#8b5cf6]/30"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#8b5cf6]/15 text-[#c4b5fd]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 3 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-3Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#71717a]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/[0.06] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">{pricing.title}</h2>
            <p className="mt-3 text-[#a1a1aa]">{pricing.subtitle}</p>
          </div>
          <motion.div className="mt-12 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-8',
                  plan.featured
                    ? 'z-10 border-[#8b5cf6]/50 bg-gradient-to-b from-[#8b5cf6]/12 via-[#13111a] to-[#0f0d14] shadow-[0_0_60px_-15px_rgba(139,92,246,0.4)] lg:-mt-2 lg:mb-2'
                    : 'border-white/[0.08] bg-[#13111a]',
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#9333ea] to-[#6366f1] px-3 py-0.5 text-[10px] font-bold uppercase text-white">
                    {pricing.popular}
                  </span>
                ) : null}
                <p className="text-sm text-[#71717a]">{plan.name}</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-white">{plan.price}</p>
                <p className="mt-1 text-xs text-[#52525b]">{plan.sub}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                      <span className="mt-0.5 text-[#4ade80]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={route('onboard')}
                  className={cn(
                    'mt-8 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-all',
                    plan.featured
                      ? 'bg-white text-[#0b0a10] hover:shadow-[0_0_24px_-4px_rgba(255,255,255,0.3)]'
                      : 'border border-white/15 text-white hover:bg-white/[0.05]',
                  )}
                >
                  {pricing.startBuilding}
                </Link>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(139,92,246,0.25), transparent 60%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(99,102,241,0.15), transparent)',
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-white">
            {cta.title1}
            <br />
            <span className="bg-gradient-to-r from-[#e9d5ff] via-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
              {cta.title2}
            </span>
          </h2>
          <p className="mt-5 text-[17px] text-[#a1a1aa]">{cta.subtitle}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href={route('onboard')}
              className="inline-flex h-11 items-center rounded-lg bg-white px-7 text-sm font-semibold text-[#0b0a10] shadow-lg transition-transform hover:scale-[1.02]"
            >
              {cta.startBuilding}
            </Link>
            <Link
              href={route('dashboard')}
              className="inline-flex h-11 items-center rounded-lg border border-white/20 bg-white/[0.03] px-7 text-sm font-semibold text-white hover:bg-white/[0.06]"
            >
              {cta.openConsole}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#08070c] px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 sm:flex-row">
          <LariPayLogo variant="light" />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link href={route('docs')} className="text-[#71717a] hover:text-[#c4b5fd]">
              {footer.documentation}
            </Link>
            <Link href={route('pricing')} className="text-[#71717a] hover:text-[#c4b5fd]">
              {navLabels.pricing}
            </Link>
            <Link href={route('integrations')} className="text-[#71717a] hover:text-[#c4b5fd]">
              {footer.integrations}
            </Link>
            <Link href={route('contact')} className="text-[#71717a] hover:text-[#c4b5fd]">
              {footer.contact}
            </Link>
          </nav>
          <p className="text-xs text-[#52525b]">© {new Date().getFullYear()} LariPay.ai</p>
        </div>
      </footer>
    </div>
  );
}
