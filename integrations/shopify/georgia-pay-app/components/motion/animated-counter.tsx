'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export function AnimatedCounter({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => `${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
