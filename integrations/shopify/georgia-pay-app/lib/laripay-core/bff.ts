import { NextRequest } from 'next/server';
import { getLariPayCoreBaseUrl, proxyToLariPayCore } from './proxy';

export function coreApiHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = request.headers.get('authorization');
  const legacy = request.headers.get('x-laripay-api-key') || request.headers.get('x-payka-api-key');
  if (auth) headers.Authorization = auth;
  if (legacy) headers['x-laripay-api-key'] = legacy;
  return headers;
}

export async function proxyCoreAuthenticated(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<Response | { error: string; status: number }> {
  const base = getLariPayCoreBaseUrl();
  if (!base) {
    return { error: 'LariPay Core is not configured (set LARIPAY_CORE_API_URL)', status: 503 };
  }

  const headers = { ...coreApiHeaders(request), ...(init.headers as Record<string, string>) };
  if (!headers.Authorization && !headers['x-laripay-api-key']) {
    return { error: 'API key required (Authorization: Bearer sk_test_...)', status: 401 };
  }

  const res = await proxyToLariPayCore(path, { ...init, headers });
  if (!res) {
    return { error: 'Core proxy failed', status: 502 };
  }
  return res;
}

export async function proxyCorePublic(
  path: string,
  init: RequestInit = {},
): Promise<Response | { error: string; status: number }> {
  const base = getLariPayCoreBaseUrl();
  if (!base) {
    return { error: 'LariPay Core is not configured', status: 503 };
  }
  const res = await proxyToLariPayCore(path, init);
  if (!res) return { error: 'Core proxy failed', status: 502 };
  return res;
}
