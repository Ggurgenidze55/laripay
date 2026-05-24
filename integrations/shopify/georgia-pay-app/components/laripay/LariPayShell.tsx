'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/motion/interactive';
import { SiteFooter } from './SiteFooter';
import { RailwayNav } from '@/components/landing/railway/railway-nav';
import { cn } from '@/lib/utils';

const LANDING_RE = /^\/laripay\/(en|ka)\/?$/;
const APP_SHELL_RE = /^\/laripay\/(en|ka)\/dashboard\/?$/;
const WIDE_MAIN_RE =
  /^\/laripay\/(en|ka)\/(pricing|platform|integrations|docs|demo)(\/|$)/;

export function LariPayShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  if (LANDING_RE.test(pathname)) {
    return <>{children}</>;
  }

  if (APP_SHELL_RE.test(pathname)) {
    return <>{children}</>;
  }

  const wideMain = WIDE_MAIN_RE.test(pathname);

  return (
    <div className="railway-theme flex min-h-screen flex-col overflow-x-hidden bg-[#0b0a10] text-[#e4e4e7] selection:bg-[#8b5cf6]/40 selection:text-white">
      <RailwayNav />

      <main
        className={cn(
          'relative flex-1',
          wideMain
            ? 'mx-auto w-full max-w-[1280px] px-4 pb-12 pt-24 sm:px-6'
            : 'mx-auto w-full max-w-3xl px-4 pb-12 pt-24 sm:px-6',
        )}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={pathname}>{children}</PageTransition>
        </AnimatePresence>
      </main>

      <SiteFooter compact railway />
    </div>
  );
}
