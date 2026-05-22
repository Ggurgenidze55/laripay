'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PricingSection } from './pricing-section';

export function EnterpriseFooter() {
  return (
    <>
      <PricingSection />

      <section className="relative overflow-hidden py-40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent-blue/10 via-transparent to-transparent" />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-violet/20 blur-[140px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-gradient">Ship payments</span>
            <br />
            <span className="text-gradient-accent">like infrastructure</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-lg text-white/45">
            Join merchants building on LariPay.ai — from startups to enterprise retail in Georgia.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/laripay/onboard"
              className={cn(
                'inline-flex h-14 items-center rounded-2xl px-10 text-sm font-medium',
                buttonVariants.primary,
              )}
            >
              Start building
            </Link>
            <Link
              href="/laripay/dashboard"
              className={cn(
                'inline-flex h-14 items-center rounded-2xl px-10 text-sm font-medium',
                buttonVariants.secondary,
              )}
            >
              Open console
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
