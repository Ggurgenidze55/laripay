import type { NextRequest } from 'next/server';

/** Public LariPay API origin (no trailing slash). */
export function getPublicApiBase(request?: NextRequest): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_HOST?.trim() ||
    process.env.HOST?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (request) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    if (host) return `${proto}://${host}`.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}
