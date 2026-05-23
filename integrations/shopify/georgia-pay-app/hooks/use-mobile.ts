'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const BELOW_LG_QUERY = '(max-width: 1023px)';

function readBelowLg() {
  return window.matchMedia(BELOW_LG_QUERY).matches;
}

export type ViewportState = {
  /** Below Tailwind `lg` (1024px). Defaults true until measured (mobile-first). */
  belowLg: boolean;
  /** True after the first layout measurement (prevents GSAP pin on mobile before paint). */
  ready: boolean;
};

/** Matches Tailwind `lg` breakpoint (below 1024px = mobile/tablet layout). */
export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>({ belowLg: true, ready: false });

  useLayoutEffect(() => {
    setState({ belowLg: readBelowLg(), ready: true });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(BELOW_LG_QUERY);
    const update = () => setState((s) => ({ ...s, belowLg: mq.matches }));
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return state;
}

/** @deprecated Prefer useViewport() — kept for legacy imports */
export function useBelowLg(): boolean {
  return useViewport().belowLg;
}
