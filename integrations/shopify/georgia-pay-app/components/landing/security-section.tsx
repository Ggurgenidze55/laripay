'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="m11 11 9 9M16 16l3 3M19 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const TRUST_ICONS = [ShieldIcon, LockIcon, KeyIcon, FileIcon];

export function SecuritySection() {
  const { t, route } = useLocale();
  const s = t.landing.securitySection;

  return (
    <SectionShell id="security" wide tone="brand" borderTop={false}>
      <SectionHeader eyebrow={s.eyebrow} title={s.title} description={s.description} brand />

      <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {s.items.map((item, i) => {
          const Icon = TRUST_ICONS[i] ?? ShieldIcon;
          return (
            <StaggerItem key={item.title} className="h-full">
              <Link href={route('security')} className="group block h-full">
                <div className="h-full rounded-card border border-slate-600/50 bg-slate-800/40 p-6 transition-colors hover:border-indigo-400/50 hover:bg-slate-800/70">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
                    <Icon />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300/90">{item.desc}</p>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </SectionShell>
  );
}
