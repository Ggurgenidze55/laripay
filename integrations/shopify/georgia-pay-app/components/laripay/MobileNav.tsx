'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SITE_NAV } from '@/lib/site-links';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70"
      >
        Menu
      </button>
      {open ? (
        <nav
          className="absolute left-0 right-0 top-16 z-50 border-b border-white/[0.08] bg-canvas/95 px-6 py-4 backdrop-blur-xl"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {SITE_NAV.map((item) => {
              const active =
                item.href === '/laripay'
                  ? pathname === '/laripay'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 text-sm',
                      active ? 'bg-white/[0.06] text-white' : 'text-white/55 hover:text-white/80',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
