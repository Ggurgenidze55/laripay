'use client';

import { useEffect, useState } from 'react';

/** Matches Tailwind `lg` breakpoint (below 1024px = mobile/tablet layout). */
export function useBelowLg() {
  const [below, setBelow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setBelow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return below;
}
