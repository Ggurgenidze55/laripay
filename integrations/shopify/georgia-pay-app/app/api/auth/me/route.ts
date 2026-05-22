import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSessionFromRequest } from '@/lib/laripay/user-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getUserSessionFromRequest(request);
  if (!session) {
    return laripayError('Not signed in', 401);
  }

  const user = await prisma.platformUser.findUnique({
    where: { id: session.userId },
    include: { merchant: { select: { id: true, slug: true, email: true, name: true, status: true } } },
  });

  if (!user) {
    return laripayError('User not found', 404);
  }

  return laripayJson({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    merchant: user.merchant,
  });
}
