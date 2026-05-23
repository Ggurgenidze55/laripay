'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LaripayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[laripay]', error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-foreground-muted">
        The page could not load. Try again or open the home page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-2.5 text-sm font-medium text-white"
        >
          Try again
        </button>
        <Link
          href="/laripay/en"
          className="rounded-xl border border-border-strong px-5 py-2.5 text-sm text-foreground"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
