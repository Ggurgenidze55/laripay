'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LariPayLogo } from './Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/laripay', label: 'Platform' },
  { href: '/laripay/dashboard', label: 'Dashboard' },
  { href: '/laripay/onboard', label: 'Developers' },
  { href: '/demo', label: 'Demo' },
];

export function LariPayShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/laripay';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLanding]);

  return (
    <div className="relative min-h-screen bg-canvas">
      {!isLanding && (
        <>
          <div className="pointer-events-none fixed inset-0 bg-mesh-gradient opacity-80" />
          <div className="noise-overlay pointer-events-none fixed inset-0" />
        </>
      )}

      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-2xl transition-all duration-500',
          isLanding
            ? scrolled
              ? 'border-white/[0.08] bg-canvas/85 shadow-[0_8px_40px_rgba(0,0,0,0.45)]'
              : 'border-transparent bg-transparent'
            : 'border-white/[0.06] bg-canvas/70',
        )}
      >
        <div
          className={cn(
            'mx-auto flex h-16 items-center justify-between px-6 lg:px-8',
            isLanding ? 'max-w-[90rem]' : 'max-w-7xl',
          )}
        >
          <Link href="/laripay" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <LariPayLogo size={32} variant="light" />
            <span className="hidden text-sm font-medium tracking-tight text-white/80 sm:inline">
              LariPay.ai
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {NAV.map((item) => {
              const active =
                item.href === '/laripay'
                  ? pathname === '/laripay'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'text-white' : 'text-white/45 hover:text-white/80',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/laripay/dashboard"
            className="rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-4 py-2 text-xs font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Console
          </Link>
        </div>
      </header>

      <main
        className={cn(
          'relative',
          isLanding ? 'max-w-none px-0 py-0' : 'mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14',
        )}
      >
        {children}
      </main>

      {!isLanding && (
        <footer className="relative border-t border-white/[0.06] py-8">
          <p className="text-center text-xs text-white/30">
            LariPay.ai — Payments infrastructure · TBC Pay · BOG Pay · GEL
          </p>
        </footer>
      )}
    </div>
  );
}
