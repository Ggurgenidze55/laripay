'use client';

import { motion } from 'framer-motion';
import { useLandingPerformance } from '@/hooks/use-landing-performance';

export function AuroraBackground() {
  const { lite } = useLandingPerformance();

  if (lite) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-canvas" />
        <div className="absolute -left-[20%] top-[-30%] h-[55vh] w-[70vw] rounded-full bg-accent-blue/15 blur-3xl dark:bg-accent-blue/20" />
        <div className="absolute -right-[15%] top-[10%] h-[45vh] w-[55vw] rounded-full bg-accent-violet/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.1),transparent_55%)]" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-canvas" />
      <motion.div
        className="absolute -left-[20%] top-[-30%] h-[70vh] w-[70vw] rounded-full bg-accent-blue/20 blur-[120px] dark:bg-accent-blue/25"
        animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-[15%] top-[10%] h-[60vh] w-[55vw] rounded-full bg-accent-violet/20 blur-[110px]"
        animate={{ x: [0, -60, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[25%] h-[50vh] w-[50vw] rounded-full bg-accent-cyan/10 blur-[100px]"
        animate={{ x: [0, 50, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="vignette absolute inset-0" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}
