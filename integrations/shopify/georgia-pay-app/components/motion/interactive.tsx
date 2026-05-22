'use client';

import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const ease = [0.22, 1, 0.36, 1] as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease },
  },
};

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
  scale = 1.02,
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PulseDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)}>
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-400/50"
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
    </span>
  );
}

export function AnimatedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.li
      variants={reveal}
      whileHover={{ x: 6, color: 'var(--foreground)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={className}
    >
      {children}
    </motion.li>
  );
}

export function InteractiveCardShell({
  children,
  className,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      variants={reveal}
      whileHover={{
        y: -6,
        boxShadow: '0 20px 50px -12px rgba(56, 189, 248, 0.15)',
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border-strong bg-canvas-card p-6 shadow-card',
        glow && 'glow-border',
        'hover:border-accent-cyan/30',
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-cyan/10 blur-2xl"
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 0.4 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.04] to-transparent dark:from-foreground/[0.02]" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <dl className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.q}
            layout
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ delay: i * 0.06, duration: 0.45, ease }}
          >
            <motion.button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              whileHover={{ x: 4 }}
              className={cn(
                'w-full rounded-xl border px-4 py-4 text-left transition-colors',
                isOpen
                  ? 'border-accent-cyan/35 bg-accent-cyan/[0.06]'
                  : 'border-border bg-canvas-elevated/40 hover:border-border-strong',
              )}
            >
              <dt className="flex items-center justify-between gap-3 font-medium text-foreground/90">
                {item.q}
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  className="shrink-0 text-lg text-accent-cyan"
                >
                  +
                </motion.span>
              </dt>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.dd
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="overflow-hidden text-foreground-muted"
                  >
                    {item.a}
                  </motion.dd>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        );
      })}
    </dl>
  );
}

export function ApiTable({
  title,
  rows,
  methods,
}: {
  title: string;
  rows: readonly (readonly [string, string] | string[])[];
  methods: readonly string[];
}) {
  return (
    <motion.section
      id="api"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      className="scroll-mt-24 space-y-3 border-t border-border pt-8"
    >
      <motion.h2 variants={reveal} className="text-xl font-medium text-foreground">
        {title}
      </motion.h2>
      <motion.div
        variants={reveal}
        className="overflow-hidden rounded-xl border border-border bg-canvas-elevated/60 font-mono text-sm"
      >
        <table className="w-full text-left">
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => {
              const [path, desc] = row as [string, string];
              return (
              <motion.tr
                key={path}
                variants={reveal}
                whileHover={{ backgroundColor: 'rgba(56, 189, 248, 0.06)' }}
                className="cursor-default text-foreground/60"
              >
                <td className="px-4 py-3">
                  <motion.span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-violet"
                    whileHover={{ scale: 1.08 }}
                  >
                    {methods[i] ?? 'GET'}
                  </motion.span>
                </td>
                <td className="px-4 py-3 text-accent-cyan">{path}</td>
                <td className="hidden px-4 py-3 sm:table-cell">{desc}</td>
              </motion.tr>
            );
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.section>
  );
}

export function StatusServices({
  services,
  operationalLabel,
}: {
  services: readonly string[];
  operationalLabel: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className="divide-y divide-border overflow-hidden rounded-2xl border border-border-strong bg-canvas-card shadow-card"
    >
      {services.map((name) => (
        <motion.div
          key={name}
          variants={reveal}
          whileHover={{ backgroundColor: 'rgba(52, 211, 153, 0.05)', x: 4 }}
          className="flex items-center justify-between px-6 py-4"
        >
          <span className="text-sm text-foreground/80">{name}</span>
          <span className="flex items-center gap-2 text-xs capitalize text-emerald-400/90">
            <PulseDot />
            {operationalLabel}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function IntegrationGrid({
  items,
  viewDocs,
}: {
  items: readonly { name: string; status: string; desc: string; href: string }[];
  viewDocs: string;
}) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-30px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {items.map((item) => (
        <InteractiveCardShell key={item.name} glow className="group h-full">
          <Link href={item.href} className="flex h-full min-h-[180px] flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-medium text-foreground">{item.name}</h3>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground-muted"
            >
              {item.status}
            </motion.span>
          </div>
          <p className="mt-2 text-sm text-foreground-muted">{item.desc}</p>
          <span className="mt-4 inline-block text-sm text-accent-cyan group-hover:underline">
            {viewDocs}
          </span>
          </Link>
        </InteractiveCardShell>
      ))}
    </motion.div>
  );
}
