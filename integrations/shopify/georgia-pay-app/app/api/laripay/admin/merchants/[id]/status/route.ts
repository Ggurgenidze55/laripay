import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/laripay/admin-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401);
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const status = body.status === 'suspended' ? 'suspended' : 'active';
  const merchant = await prisma.merchant.update({
    where: { id: params.id },
    data: { status },
  });

  return laripayJson({
    id: merchant.id,
    slug: merchant.slug,
    status: merchant.status,
  });
}
