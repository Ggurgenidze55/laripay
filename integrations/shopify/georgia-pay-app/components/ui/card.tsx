'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  hover = true,
  glow = false,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/[0.06] bg-canvas-card/80 p-6 shadow-card backdrop-blur-sm',
        glow && 'glow-border',
        hover && 'hover:border-white/10 hover:shadow-lift',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
