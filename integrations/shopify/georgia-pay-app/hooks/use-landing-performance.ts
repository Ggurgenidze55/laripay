'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useBelowLg } from '@/hooks/use-mobile';

/**
 * Landing "lite" mode: mobile/tablet or reduced motion.
 * Disables scroll-linked GSAP, canvas particles, infinite loops, and scroll listeners.
 */
export function useLandingPerformance() {
  const reduced = useReducedMotion();
  const belowLg = useBelowLg();
  const lite = reduced || belowLg;
  return { lite, reduced, belowLg };
}
