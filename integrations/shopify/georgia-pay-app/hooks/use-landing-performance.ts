'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useViewport } from '@/hooks/use-mobile';

/**
 * Landing "lite" mode: mobile/tablet, reduced motion, or before viewport is measured.
 * Disables scroll-linked GSAP, canvas particles, infinite loops, and scroll listeners.
 */
export function useLandingPerformance() {
  const reduced = useReducedMotion();
  const { belowLg, ready } = useViewport();
  const lite = !ready || reduced || belowLg;
  return { lite, reduced, belowLg, ready };
}
