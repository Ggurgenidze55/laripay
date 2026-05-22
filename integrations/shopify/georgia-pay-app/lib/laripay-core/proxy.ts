/**
 * Forward API requests to LariPay Core when LARIPAY_CORE_API_URL is set.
 */

export function getLariPayCoreBaseUrl(): string | null {
  const base = process.env.LARIPAY_CORE_API_URL?.replace(/\/$/, '');
  return base || null;
}

export async function proxyToLariPayCore(
  path: string,
  init: RequestInit,
): Promise<Response | null> {
  const base = getLariPayCoreBaseUrl();
  if (!base) return null;

  const url = `${base}/api${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
  });
}
