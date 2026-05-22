import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { platformEnv } from '@/lib/laripay-env';

const COOKIE_NAME = 'laripay_user';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  return (
    platformEnv('PORTAL_SECRET') ||
    platformEnv('ADMIN_SECRET') ||
    'laripay-user-session-dev'
  );
}

export function createUserSessionToken(userId: string, merchantId: string | null): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ uid: userId, mid: merchantId, exp })).toString(
    'base64url',
  );
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyUserSessionToken(
  token: string,
): { userId: string; merchantId: string | null } | null {
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      uid: string;
      mid: string;
      exp: number;
    };
    if (!data.uid || data.exp < Date.now()) return null;
    return { userId: data.uid, merchantId: data.mid ?? null };
  } catch {
    return null;
  }
}

export function getUserSessionFromRequest(
  request: NextRequest,
): { userId: string; merchantId: string | null } | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyUserSessionToken(token);
}

export function attachUserCookie(
  response: NextResponse,
  userId: string,
  merchantId: string | null,
): NextResponse {
  response.cookies.set(COOKIE_NAME, createUserSessionToken(userId, merchantId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}

export function clearUserCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
