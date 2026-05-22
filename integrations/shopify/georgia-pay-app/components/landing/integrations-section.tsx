'use client';

import { motion } from 'framer-motion';
import { SectionHeader, SectionShell } from './shared';
import { Stagger, StaggerItem } from '@/components/motion/fade-in';

const PLATFORMS = [
  {
    name: 'Shopify',
    desc: 'Offsite payments extension · automatic merchant provisioning',
    tag: 'Payments',
  },
  {
    name: 'WooCommerce',
    desc: 'Native gateway plugin · checkout sessions + webhooks',
    tag: 'Plugin',
  },
  {
    name: 'Custom stack',
    desc: 'REST API · Bearer keys · any language',
    tag: 'API',
  },
];

export function IntegrationsSection() {
  return (
    <SectionShell id="integrations" wide>
      <SectionHeader
        eyebrow="Integrations"
        title="Drop into your commerce stack"
        description="From Shopify storefronts to WooCommerce and headless Next.js — one infrastructure layer."
      />

      <Stagger className="grid gap-8 md:grid-cols-3">
        {PLATFORMS.map((p, i) => (
          <StaggerItem key={p.name}>
            <motion.div
              whileHover={{ y: -8 }}
              className="group relative h-full overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-8"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan/80">
                {p.tag}
              </span>
              <h3 className="mt-6 text-2xl font-semibold">{p.name}</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/45">{p.desc}</p>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-violet/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}
