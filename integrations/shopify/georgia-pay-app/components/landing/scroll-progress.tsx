'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useLandingPerformance } from '@/hooks/use-landing-performance';

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[60] h-1 origin-left bg-accent-bright"
      style={{ scaleX }}
    />
  );
}

export function ScrollProgress() {
  const { lite } = useLandingPerformance();
  if (lite) return null;
  return <ScrollProgressBar />;
}
