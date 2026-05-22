'use client';

import Link from 'next/link';
import { LariPayLogo } from './Logo';
import { COMPANY, FOOTER_COLUMNS } from '@/lib/site-links';

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/50 transition-colors hover:text-white/85"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="relative border-t border-white/[0.06] bg-canvas/40">
      <div className={compact ? 'mx-auto max-w-[90rem] px-6 py-12 lg:px-8' : 'mx-auto max-w-7xl px-6 py-14 lg:px-8'}>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/laripay" className="inline-flex items-center gap-3">
              <LariPayLogo size={36} variant="light" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              {COMPANY.tagline}. TBC Pay, BOG Pay, checkout sessions, webhooks, and merchant tools — built
              for GEL.
            </p>
            <p className="mt-4 text-sm text-white/40">
              <a href={`mailto:${COMPANY.email}`} className="hover:text-accent-cyan">
                {COMPANY.email}
              </a>
            </p>
          </div>
          <FooterColumn title="Product" links={FOOTER_COLUMNS.product} />
          <FooterColumn title="Developers" links={FOOTER_COLUMNS.developers} />
          <FooterColumn title="Company" links={FOOTER_COLUMNS.company} />
          <FooterColumn title="Legal" links={FOOTER_COLUMNS.legal} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © {COMPANY.year} {COMPANY.name}. All rights reserved.
          </p>
          <p className="text-xs text-white/25">
            Licensed payment facilitation subject to Georgian regulations. Sandbox and production modes
            available per merchant agreement.
          </p>
        </div>
      </div>
    </footer>
  );
}
