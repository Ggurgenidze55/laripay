import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { platformEnv } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';
import { authenticateApiRequest } from './auth';
import { getUserSessionFromRequest } from './user-session';

const COOKIE_NAME = 'laripay_portal';
const LEGACY_COOKIE_NAME = 'payka_portal';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function portalSecret(): string {
  return (
    platformEnv('PORTAL_SECRET') ||
    platformEnv('ADMIN_SECRET') ||
    'laripay-portal-dev-only'
  );
}

export function createPortalSessionToken(merchantId: string, slug: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ mid: merchantId, slug, exp })).toString(
    'base64url',
  );
  const sig = createHmac('sha256', portalSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyPortalSessionToken(
  token: string,
): { merchantId: string; slug: string } | null {
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', portalSecret()).update(payload).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      mid: string;
      slug: string;
      exp: number;
    };
    if (!data.mid || data.exp < Date.now()) return null;
    return { merchantId: data.mid, slug: data.slug };
  } catch {
    return null;
  }
}

export function getPortalSessionFromRequest(
  request: NextRequest,
): { merchantId: string; slug: string } | null {
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPortalSessionToken(token);
}

export function attachPortalCookie(
  response: NextResponse,
  merchantId: string,
  slug: string,
): NextResponse {
  response.cookies.set(COOKIE_NAME, createPortalSessionToken(merchantId, slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}

export function clearPortalCookie(response: NextResponse): NextResponse {
  for (const name of [COOKIE_NAME, LEGACY_COOKIE_NAME]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}

/** Portal cookie, user session, or API key (Bearer / x-laripay-api-key). */
export async function authenticatePortalRequest(
  request: NextRequest,
): Promise<{ merchantId: string; slug: string } | { error: string; status: number }> {
  const portal = getPortalSessionFromRequest(request);
  if (portal) return portal;

  const userSession = getUserSessionFromRequest(request);
  if (userSession) {
    if (!userSession.merchantId) {
      return { error: 'No merchant linked to this account', status: 403 };
    }
    const merchant = await prisma.merchant.findUnique({
      where: { id: userSession.merchantId },
      select: { slug: true, status: true },
    });
    if (!merchant) {
      return { error: 'Merchant not found', status: 404 };
    }
    if (merchant.status === 'suspended') {
      return { error: 'Merchant account suspended', status: 403 };
    }
    return { merchantId: userSession.merchantId, slug: merchant.slug };
  }

  const api = await authenticateApiRequest(request);
  if ('error' in api) {
    return api;
  }
  return { merchantId: api.merchant.id, slug: api.merchant.slug };
}
