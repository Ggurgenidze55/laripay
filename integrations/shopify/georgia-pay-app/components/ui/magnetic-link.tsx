'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/use-mobile';

function MagneticLinkDesktop({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 22 });
  const sy = useSpring(y, { stiffness: 300, damping: 22 });

  return (
    <motion.div style={{ x: sx, y: sy }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        className={cn(className)}
        onMouseMove={(e) => {
          const el = ref.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          x.set((e.clientX - r.left - r.width / 2) * 0.12);
          y.set((e.clientY - r.top - r.height / 2) * 0.12);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function MagneticLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { belowLg } = useViewport();

  if (belowLg) {
    return (
      <Link href={href} className={cn(className)}>
        {children}
      </Link>
    );
  }

  return (
    <MagneticLinkDesktop href={href} className={className}>
      {children}
    </MagneticLinkDesktop>
  );
}
