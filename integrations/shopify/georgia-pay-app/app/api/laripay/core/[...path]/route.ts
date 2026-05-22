import { NextRequest, NextResponse } from 'next/server';
import { proxyCoreAuthenticated, proxyCorePublic } from '@/lib/laripay-core/bff';

export const dynamic = 'force-dynamic';

const PUBLIC_GET = new Set([
  'v1/subscription-plans',
  'v1/open-banking/banks',
]);

const PUBLIC_PREFIX = [
  'v1/checkout/hosted/',
  'v1/checkout/embedded/',
  'v1/checkout/3ds/',
  'v1/open-banking/sca/',
  'v1/qr/',
];

function isPublicPath(path: string, method: string): boolean {
  if (path === 'status') return true;
  if (method === 'GET' && PUBLIC_GET.has(path)) return true;
  return PUBLIC_PREFIX.some((p) => path.startsWith(p));
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const corePath = `/${path}`;
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  if (isPublicPath(path, request.method)) {
    const res = await proxyCorePublic(corePath, init);
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'text/html' } });
    }
    const body = await res.text();
    return new NextResponse(body, { status: res.status, headers: { 'Content-Type': contentType || 'application/json' } });
  }

  const res = await proxyCoreAuthenticated(request, corePath, init);
  if ('error' in res) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

type Ctx = { params: { path: string[] } };

export async function GET(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.path);
}
