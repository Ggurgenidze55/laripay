'use client';

import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

const ITEMS = [
  { title: 'API key isolation', desc: 'Per-merchant secrets, hashed storage, rotation support.' },
  { title: 'Signed webhooks', desc: 'HMAC SHA-256 with timestamp tolerance.' },
  { title: 'Bank-grade routing', desc: 'Direct TBC & BOG credentials — never shared across tenants.' },
  { title: 'Audit-ready logs', desc: 'Payment lifecycle, refunds, and delivery attempts.' },
];

export function SecuritySection() {
  return (
    <SectionShell id="security" wide>
      <SectionHeader
        eyebrow="Trust & compliance"
        title="Enterprise reliability by default"
        description="Built for merchants who need security posture that satisfies finance teams and integrators alike."
      />

      <Stagger className="grid gap-6 md:grid-cols-2">
        {ITEMS.map((item) => (
          <StaggerItem key={item.title}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-7 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
              <h3 className="text-lg font-medium text-white/90">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/45">{item.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
