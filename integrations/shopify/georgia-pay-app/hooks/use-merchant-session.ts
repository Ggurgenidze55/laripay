'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type SessionState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'merchant' }
  | { status: 'admin' };

export function useMerchantSession(): SessionState & { isLoggedIn: boolean } {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setSession({ status: 'guest' });
          return;
        }
        const data = (await res.json()) as {
          user?: { role?: string };
          merchant?: { id?: string } | null;
        };
        if (data.merchant?.id) {
          setSession({ status: 'merchant' });
          return;
        }
        if (data.user?.role === 'platform_admin') {
          setSession({ status: 'admin' });
          return;
        }
        setSession({ status: 'guest' });
      })
      .catch(() => {
        if (!cancelled) setSession({ status: 'guest' });
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return {
    ...session,
    isLoggedIn: session.status === 'merchant' || session.status === 'admin',
  };
}
