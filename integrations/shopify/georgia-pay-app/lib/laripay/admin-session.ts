import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { platformEnv } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';
import { requireAdminSecret } from './auth';
import { getUserSessionFromRequest } from './user-session';

const COOKIE_NAME = 'laripay_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function adminSecret(): string {
  return platformEnv('ADMIN_SECRET') || '';
}

export function createAdminSessionToken(userId?: string): string | null {
  const secret = adminSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', uid: userId || 'legacy', exp }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string): { userId: string | null } | null {
  const secret = adminSecret();
  if (!secret) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      role: string;
      uid?: string;
      exp: number;
    };
    if (data.role !== 'admin' || data.exp < Date.now()) return null;
    return { userId: data.uid && data.uid !== 'legacy' ? data.uid : null };
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token && verifyAdminSessionToken(token)) return true;
  return false;
}

export async function isPlatformAdminUser(request: NextRequest): Promise<boolean> {
  const session = getUserSessionFromRequest(request);
  if (!session) return false;
  const user = await prisma.platformUser.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  return user?.role === 'platform_admin';
}

export function attachAdminCookie(
  response: NextResponse,
  userId?: string,
): NextResponse | null {
  const token = createAdminSessionToken(userId);
  if (!token) return null;
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}

export function clearAdminCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  if (getAdminSessionFromRequest(request)) return true;
  if (await isPlatformAdminUser(request)) return true;
  return requireAdminSecret(request);
}
